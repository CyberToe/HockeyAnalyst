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
        data: {
          user: {
            id: '1',
            email: req.body.email || 'test@example.com',
            displayName: 'Test User'
          },
          token: 'test-jwt-token-' + Date.now()
        }
      });
      return;
    }

    // Handle auth register
    if ((req.url === '/api/auth/register' || req.url.startsWith('/api/auth/register')) && req.method === 'POST') {
      res.status(200).json({ 
        data: {
          user: {
            id: '1',
            email: req.body.email || 'test@example.com',
            displayName: req.body.displayName || 'Test User'
          },
          token: 'test-jwt-token-' + Date.now()
        }
      });
      return;
    }

    // Handle teams endpoint
    if ((req.url === '/api/teams' || req.url.startsWith('/api/teams')) && req.method === 'GET') {
      res.status(200).json([
        {
          id: '1',
          name: 'Test Team 1',
          description: 'A test team for development',
          teamCode: 'TEST123',
          createdAt: new Date().toISOString(),
          _count: {
            players: 5,
            games: 3
          }
        },
        {
          id: '2', 
          name: 'Test Team 2',
          description: 'Another test team',
          teamCode: 'TEST456',
          createdAt: new Date().toISOString(),
          _count: {
            players: 8,
            games: 7
          }
        }
      ]);
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