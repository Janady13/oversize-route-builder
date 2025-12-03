/**
 * Parse permit data from PDF text
 * Supports Oklahoma and Texas permits (expandable to other states)
 */

const parsePermitData = (text, state) => {
  const result = {
    permitNumber: null,
    permitType: null,
    issuedDate: null,
    startDate: null,
    endDate: null,
    loadSpecs: {},
    route: {},
    vehicle: {},
    restrictions: []
  };

  try {
    if (state === 'OK' || state === 'OKLAHOMA') {
      return parseOklahomaPermit(text);
    } else if (state === 'TX' || state === 'TEXAS') {
      return parseTexasPermit(text);
    } else {
      return parseGenericPermit(text);
    }
  } catch (error) {
    console.error('Permit parsing error:', error);
    return result;
  }
};

const parseOklahomaPermit = (text) => {
  const result = {
    permitNumber: extractPattern(text, /Permit Number:\s*(\d+)/i),
    permitType: 'single-trip',
    issuedDate: extractDate(text, /Issued:\s*(\d{2}\/\d{2}\/\d{4})/i),
    startDate: extractDate(text, /Start Date:\s*(\d{2}\/\d{2}\/\d{4})/i),
    endDate: extractDate(text, /End Date:\s*(\d{2}\/\d{2}\/\d{4})/i),
    loadSpecs: {},
    route: {},
    vehicle: {},
    restrictions: []
  };

  // Extract load specifications
  result.loadSpecs = {
    maxWidth: extractDimension(text, /Max Width:\s*([\d-]+)/i),
    maxHeight: extractDimension(text, /Max Height:\s*([\d-]+)/i),
    maxLength: extractDimension(text, /Total Length:\s*([\d-]+)/i),
    grossWeight: parseInt(extractPattern(text, /Gross Weight:\s*(\d+)/i) || '0'),
    overweightBy: parseInt(extractPattern(text, /Overweight By:\s*(\d+)/i) || '0'),
    numAxles: parseInt(extractPattern(text, /Number of Axles:\s*(\d+)/i) || '0'),
    description: extractPattern(text, /Load Description:\s*([^\n]+)/i)
  };

  // Extract vehicle information
  result.vehicle = {
    truckMake: extractPattern(text, /Truck Make:\s*([^\s]+)/i),
    truckYear: parseInt(extractPattern(text, /Truck Year:\s*(\d{4})/i) || '0'),
    tagNumber: extractPattern(text, /Tag Number:\s*([^\s]+)/i),
    tagState: extractPattern(text, /Tag State:\s*([A-Z]{2})/i),
    trailerMake: extractPattern(text, /Trailer Make:\s*([^\n]+?)\s*Trailer Year/i),
    trailerYear: parseInt(extractPattern(text, /Trailer Year:\s*(\d{4})/i) || '0')
  };

  // Extract route information
  const originMatch = text.match(/Starting From:\s*([^,\n]+)/i);
  const destMatch = text.match(/Going To:\s*([^,\n]+)/i);
  
  result.route = {
    origin: originMatch ? originMatch[1].trim() : null,
    destination: destMatch ? destMatch[1].trim() : null,
    totalDistance: parseFloat(extractPattern(text, /Approximate Mileage:\s*([\d.]+)/i) || '0'),
    estimatedTime: null,
    directions: extractOklahomaDirections(text),
    restrictions: extractOklahomaRestrictions(text)
  };

  return result;
};

const parseTexasPermit = (text) => {
  const result = {
    permitNumber: extractPattern(text, /Permit Number:\s*(\d+)/i),
    permitType: 'single-trip',
    issuedDate: extractDate(text, /Issued On:\s*(\d{2}\/\d{2}\/\d{4})/i),
    startDate: extractDate(text, /Effective:\s*(\d{2}\/\d{2}\/\d{4})/i),
    endDate: extractDate(text, /Expiration:\s*(\d{2}\/\d{2}\/\d{4})/i),
    loadSpecs: {},
    route: {},
    vehicle: {},
    restrictions: []
  };

  // Extract load specifications
  result.loadSpecs = {
    maxWidth: extractDimension(text, /Max\.\s*Width:\s*([\d']+)/i),
    maxHeight: extractDimension(text, /Max\.\s*Height:\s*([\d'\s]+)/i),
    maxLength: extractDimension(text, /Max\.\s*Length:\s*([\d']+)/i),
    grossWeight: parseInt(extractPattern(text, /Gross Weight:\s*(\d+)/i) || '0'),
    overweightBy: 0,
    numAxles: parseInt(extractPattern(text, /Axle:\s*(\d+)/i) || '0'),
    description: extractPattern(text, /Load Description:\s*([^\n]+)/i)
  };

  // Extract vehicle information
  result.vehicle = {
    truckMake: extractPattern(text, /Truck:\s*(\d{4})\s*([A-Z]+)/i, 2),
    truckYear: parseInt(extractPattern(text, /Truck:\s*(\d{4})/i) || '0'),
    tagNumber: extractPattern(text, /Tag Number:\s*([^\s]+)/i),
    tagState: extractPattern(text, /Tag State:\s*([A-Z]{2})/i),
    trailerMake: extractPattern(text, /Trailer:\s*([^\n]+)/i)
  };

  // Extract route information
  const originMatch = text.match(/Origin:\s*([^\n]+)/i);
  const destMatch = text.match(/Destination:\s*([^\n]+)/i);
  
  result.route = {
    origin: originMatch ? originMatch[1].trim() : null,
    destination: destMatch ? destMatch[1].trim() : null,
    totalDistance: parseFloat(extractPattern(text, /(\d+\.?\d*)\s*mi/i) || '0'),
    estimatedTime: null,
    directions: extractTexasDirections(text),
    restrictions: extractTexasRestrictions(text)
  };

  return result;
};

const parseGenericPermit = (text) => {
  // Generic parser for unknown states
  const result = {
    permitNumber: extractPattern(text, /permit\s*#?:?\s*([A-Z0-9-]+)/i) ||
                  extractPattern(text, /number:?\s*([A-Z0-9-]+)/i),
    permitType: 'single-trip',
    issuedDate: extractDate(text, /issued:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i),
    startDate: extractDate(text, /start:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i),
    endDate: extractDate(text, /end:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i),
    loadSpecs: {
      maxWidth: extractDimension(text, /width:?\s*([\d'\-\s]+)/i),
      maxHeight: extractDimension(text, /height:?\s*([\d'\-\s]+)/i),
      maxLength: extractDimension(text, /length:?\s*([\d'\-\s]+)/i),
      grossWeight: parseInt(extractPattern(text, /weight:?\s*(\d+)/i) || '0')
    },
    route: {},
    vehicle: {},
    restrictions: []
  };

  return result;
};

// Helper functions
const extractPattern = (text, pattern, group = 1) => {
  const match = text.match(pattern);
  return match ? match[group].trim() : null;
};

const extractDate = (text, pattern) => {
  const dateStr = extractPattern(text, pattern);
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

const extractDimension = (text, pattern) => {
  const dim = extractPattern(text, pattern);
  if (!dim) return null;
  
  // Convert formats like "16-0" or "16' 0\"" to decimal
  const parts = dim.split(/[-'\s]/);
  if (parts.length >= 2) {
    return parseFloat(parts[0]) + (parseFloat(parts[1]) || 0) / 12;
  }
  return parseFloat(dim) || null;
};

const extractOklahomaDirections = (text) => {
  const directions = [];
  const directionPattern = /(\d+\.?\d*)\s*mi\s+([^\n]+)/gi;
  let match;
  
  while ((match = directionPattern.exec(text)) !== null) {
    directions.push({
      distance: parseFloat(match[1]),
      instruction: match[2].trim()
    });
  }
  
  return directions;
};

const extractTexasDirections = (text) => {
  const directions = [];
  
  // Look for the route table
  const routeSection = text.match(/Miles\s+Route\s+To\s+Distance.*?Final Destination/s);
  if (routeSection) {
    const lines = routeSection[0].split('\n');
    lines.forEach(line => {
      const match = line.match(/^([\d.]+)\s+(.+?)\s+([\d.]+)\s+([\d:]+)$/);
      if (match) {
        directions.push({
          distance: parseFloat(match[1]),
          route: match[2].trim(),
          instruction: '',
          cumulativeDistance: parseFloat(match[3]),
          estimatedTime: match[4]
        });
      }
    });
  }
  
  return directions;
};

const extractOklahomaRestrictions = (text) => {
  const restrictions = [];
  
  // Common restriction patterns
  const patterns = [
    /no.*movement.*\d+:\d+.*\d+:\d+/gi,
    /escort.*required/gi,
    /contact.*utility/gi,
    /daylight.*only/gi,
    /travel.*prohibited/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => restrictions.push(m.trim()));
    }
  });
  
  return [...new Set(restrictions)]; // Remove duplicates
};

const extractTexasRestrictions = (text) => {
  const restrictions = [];
  
  // Extract from General Conditions section
  const conditionsMatch = text.match(/General Conditions:?(.*?)(?=Origin:|$)/s);
  if (conditionsMatch) {
    const conditions = conditionsMatch[1].split(/\d+\s+/).filter(c => c.trim());
    restrictions.push(...conditions.map(c => c.trim().substring(0, 200))); // Limit length
  }
  
  return restrictions;
};

module.exports = {
  parsePermitData
};
