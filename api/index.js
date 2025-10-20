// Vercel serverless function entry point
const app = require('../backend/dist/index.js').default;

// Export the app for Vercel
module.exports = app;
