const dotenv = require('dotenv');
dotenv.config();

// Import the configured Express app (no listener)
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Only start the HTTP listener when not running in a serverless environment
if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
