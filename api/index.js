// Vercel serverless function entry point
module.exports = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Simple test endpoint
    if (req.url === '/api/test') {
      res.status(200).json({ 
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      });
      return;
    }

    // For now, return a simple response for auth login
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      res.status(200).json({ 
        message: 'Login endpoint reached',
        timestamp: new Date().toISOString(),
        body: req.body
      });
      return;
    }

    // Default response
    res.status(404).json({ 
      error: 'Route not found',
      url: req.url,
      method: req.method
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
};