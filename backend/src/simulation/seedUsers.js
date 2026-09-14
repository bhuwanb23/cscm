/**
 * Seed Users Script
 * Creates simulated users with proper roles for the hackathon
 */

const UserSimulator = require('./userSimulator');

/**
 * Seed simulated users in the database
 */
async function seedUsers() {
  const simulator = new UserSimulator();
  
  console.log('=== CSCM User Seeding ===');
  console.log('Initializing simulated users...');
  
  simulator.initializeUsers();
  
  console.log('Registering users with proper roles...');
  const allUsers = Object.values(simulator.users).flat();
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of allUsers) {
    const result = await simulator.registerUser(user);
    if (result.success) {
      successCount++;
      console.log(`✓ Registered ${user.username} (${user.role})`);
    } else {
      failCount++;
      console.log(`✗ Failed to register ${user.username} (${user.role}): ${result.error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Seeding Summary ===');
  console.log(`Total users: ${allUsers.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  // Print credentials for reference (in production, these should be stored securely)
  console.log('\n=== User Credentials ===');
  console.log('NOTE: In production, store these securely in environment variables or a secrets manager');
  
  Object.keys(simulator.users).forEach(role => {
    console.log(`\n${role.toUpperCase()} users:`);
    simulator.users[role].forEach(user => {
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}`);
    });
  });
  
  // Export credentials to JSON for GitHub Actions secrets
  const credentials = {};
  Object.keys(simulator.users).forEach(role => {
    credentials[role] = simulator.users[role].map(user => ({
      username: user.username,
      password: user.password
    }));
  });
  
  console.log('\n=== Credentials JSON ===');
  console.log(JSON.stringify(credentials, null, 2));
  
  process.exit(failCount > 0 ? 1 : 0);
}

if (require.main === module) {
  seedUsers().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedUsers;
