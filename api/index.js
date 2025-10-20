// Vercel serverless function entry point
console.log('=== VERCEL FUNCTION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Environment check:', process.env.NODE_ENV !== 'production' && !process.env.VERCEL);
console.log('=============================');

const app = require('../backend/dist/index.js').default;

// Export the app for Vercel
module.exports = app;
