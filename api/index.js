// Vercel serverless function entry point
module.exports = async (req, res) => {
  try {
    // Debug logging
    console.log('API Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });
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

    // Handle auth login - check for both exact path and starts with
    if ((req.url === '/api/auth/login' || req.url.startsWith('/api/auth/login')) && req.method === 'POST') {
      res.status(200).json({ 
        message: 'Login endpoint reached',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        body: req.body
      });
      return;
    }

    // Handle GET requests to login (for debugging)
    if ((req.url === '/api/auth/login' || req.url.startsWith('/api/auth/login')) && req.method === 'GET') {
      res.status(200).json({ 
        message: 'Login endpoint reached (GET)',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        note: 'This should be a POST request'
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