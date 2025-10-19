const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/hockey_analytics'
    }
  }
});

async function testAuth() {
  try {
    console.log('Testing authentication flow...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Test password hashing
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashing works');
    
    // Test JWT
    const token = jwt.sign({ userId: 'test' }, 'your-super-secret-jwt-key-change-this-in-production', { expiresIn: '7d' });
    console.log('✅ JWT generation works');
    
    // Test database query
    const userCount = await prisma.user.count();
    console.log('✅ Database query works, user count:', userCount);
    
    await prisma.$disconnect();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAuth();
