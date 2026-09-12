/**
 * Direct database test script to diagnose authentication issues
 * This bypasses the API and tests database operations directly
 */

require('dotenv').config();
const { getDatabase } = require('../src/storage/database');

async function testDatabaseOperations() {
  console.log('=== Direct Database Test ===\n');
  console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('');

  try {
    const db = getDatabase();
    console.log('Database instance created');
    console.log('Has pool:', !!db.pool);
    console.log('Has db:', !!db.db);
    console.log('');

    // Initialize database
    console.log('Initializing database...');
    await db.initialize();
    console.log('Database initialized successfully');
    console.log('');

    // Test user creation
    console.log('Testing user creation...');
    const userId = await db.createUser({
      username: 'testuser_direct',
      email: 'testdirect@example.com',
      password: 'hashedpassword123',
      role: 'user'
    });
    console.log('User created with ID:', userId);
    console.log('');

    // Test user lookup
    console.log('Testing user lookup...');
    const user = await db.findUserByUsername('testuser_direct');
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User details:', {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    }
    console.log('');

    // Test user lookup by ID
    console.log('Testing user lookup by ID...');
    const userById = await db.findUserById(userId);
    console.log('User by ID found:', userById ? 'YES' : 'NO');
    console.log('');

    console.log('=== All database tests passed ===');
    process.exit(0);
  } catch (error) {
    console.error('=== Database test failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDatabaseOperations();
