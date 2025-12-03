const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const db = require('../config/database');
const { authMiddleware, requireSubscription } = require('../middleware/auth');
const { parsePermitData } = require('../utils/permitParser');

// Configure multer for file uploads
const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Choose storage based on environment: disk in server, memory in serverless
const storage = isServerless
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads', req.user.id.toString());
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF files are allowed'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB default
  fileFilter: fileFilter
});

// Upload permit document
router.post('/upload', authMiddleware, requireSubscription, upload.single('permit'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { state } = req.body;

    if (!state) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: { message: 'State is required' } });
    }

    // Read PDF file
    const dataBuffer = isServerless ? req.file.buffer : await fs.readFile(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Parse permit data
    const parsedData = parsePermitData(pdfData.text, state);

    if (!parsedData.permitNumber) {
      return res.status(400).json({ 
        error: { 
          message: 'Could not extract permit information from PDF. Please ensure the document is a valid permit.',
          code: 'INVALID_PERMIT_FORMAT'
        } 
      });
    }

    // Insert permit into database
    const result = await db.query(
      `INSERT INTO permits 
       (user_id, permit_number, state, permit_type, file_path, original_filename, 
        parsed_data, issued_date, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, permit_number, state, status, created_at`,
      [
        req.user.id,
        parsedData.permitNumber,
        state,
        parsedData.permitType,
        isServerless ? null : req.file.path,
        req.file.originalname,
        JSON.stringify(parsedData),
        parsedData.issuedDate,
        parsedData.startDate,
        parsedData.endDate,
        'processed'
      ]
    );

    const permit = result.rows[0];

    // Extract load specifications
    if (parsedData.loadSpecs) {
      await db.query(
        `INSERT INTO load_specs 
         (permit_id, max_width, max_height, max_length, gross_weight, overweight_by, 
          num_axles, axle_config, load_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          permit.id,
          parsedData.loadSpecs.maxWidth,
          parsedData.loadSpecs.maxHeight,
          parsedData.loadSpecs.maxLength,
          parsedData.loadSpecs.grossWeight,
          parsedData.loadSpecs.overweightBy,
          parsedData.loadSpecs.numAxles,
          JSON.stringify(parsedData.loadSpecs.axleConfig),
          parsedData.loadSpecs.description
        ]
      );
    }

    // Extract route information
    if (parsedData.route) {
      await db.query(
        `INSERT INTO routes 
         (permit_id, user_id, origin_location, destination_location, 
          total_distance, estimated_time, route_data, restrictions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          permit.id,
          req.user.id,
          parsedData.route.origin,
          parsedData.route.destination,
          parsedData.route.totalDistance,
          parsedData.route.estimatedTime,
          JSON.stringify(parsedData.route.directions),
          JSON.stringify(parsedData.route.restrictions)
        ]
      );
    }

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'PERMIT_UPLOADED', 'permit', permit.id, JSON.stringify({ state, filename: req.file.originalname })]
    );

    res.status(201).json({
      message: 'Permit uploaded and processed successfully',
      permit: {
        id: permit.id,
        permitNumber: permit.permit_number,
        state: permit.state,
        status: permit.status,
        createdAt: permit.created_at
      },
      parsedData: {
        ...parsedData,
        rawText: undefined // Don't send raw text back
      }
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file && !isServerless && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Permit upload error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Error processing permit document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
  }
});

// Get all permits for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { state, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.id, p.permit_number, p.state, p.permit_type, p.status, 
             p.original_filename, p.issued_date, p.start_date, p.end_date, p.created_at,
             ls.max_width, ls.max_height, ls.max_length, ls.gross_weight,
             r.origin_location, r.destination_location, r.total_distance
      FROM permits p
      LEFT JOIN load_specs ls ON p.id = ls.permit_id
      LEFT JOIN routes r ON p.id = r.permit_id
      WHERE p.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (state) {
      query += ` AND p.state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM permits WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      permits: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({ error: { message: 'Error fetching permits' } });
  }
});

// Get single permit details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, ls.*, r.*,
              p.id as permit_id, ls.id as load_spec_id, r.id as route_id
       FROM permits p
       LEFT JOIN load_specs ls ON p.id = ls.permit_id
       LEFT JOIN routes r ON p.id = r.permit_id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Permit not found' } });
    }

    const permit = result.rows[0];

    res.json({
      id: permit.permit_id,
      permitNumber: permit.permit_number,
      state: permit.state,
      permitType: permit.permit_type,
      status: permit.status,
      filename: permit.original_filename,
      issuedDate: permit.issued_date,
      startDate: permit.start_date,
      endDate: permit.end_date,
      parsedData: permit.parsed_data,
      loadSpecs: permit.load_spec_id ? {
        maxWidth: permit.max_width,
        maxHeight: permit.max_height,
        maxLength: permit.max_length,
        grossWeight: permit.gross_weight,
        overweightBy: permit.overweight_by,
        numAxles: permit.num_axles,
        axleConfig: permit.axle_config,
        description: permit.load_description
      } : null,
      route: permit.route_id ? {
        origin: permit.origin_location,
        destination: permit.destination_location,
        totalDistance: permit.total_distance,
        estimatedTime: permit.estimated_time,
        directions: permit.route_data,
        restrictions: permit.restrictions
      } : null,
      createdAt: permit.created_at
    });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(500).json({ error: { message: 'Error fetching permit' } });
  }
});

// Delete permit
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get permit to delete file
    const permit = await db.query(
      'SELECT file_path FROM permits WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (permit.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Permit not found' } });
    }

    // Delete file
    if (permit.rows[0].file_path && !isServerless) {
      await fs.unlink(permit.rows[0].file_path).catch(console.error);
    }

    // Delete from database (cascades to load_specs and routes)
    await db.query('DELETE FROM permits WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'PERMIT_DELETED', 'permit', id]
    );

    res.json({ message: 'Permit deleted successfully' });
  } catch (error) {
    console.error('Delete permit error:', error);
    res.status(500).json({ error: { message: 'Error deleting permit' } });
  }
});

module.exports = router;
