import dotenv from 'dotenv';
import { client } from '../config/database';

// Load environment variables
dotenv.config();

async function checkTables() {
  try {
    console.log('🔍 Checking Auth Service database tables...');
    
    // Verify we're connected to the correct database
    const dbResult = await client`SELECT current_database()`;
    console.log(`🗄️  Connected to database: ${dbResult[0].current_database}`);
    
    // Get list of tables in the current database
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'users',
      'user_sessions', 
      'password_resets',
      'email_verifications',
      'user_activities',
      'oauth_providers',
      'api_keys'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    
    console.log(`📋 Existing tables in ${dbResult[0].current_database}:`);
    if (existingTables.length === 0) {
      console.log('   ❌ No tables found');
    } else {
      existingTables.forEach(table => {
        const status = expectedTables.includes(table) ? '✅' : '⚠️';
        console.log(`   ${status} ${table}`);
      });
    }
    
    console.log('\n📋 Expected auth service tables:');
    expectedTables.forEach(table => {
      const status = existingTables.includes(table) ? '✅' : '❌';
      console.log(`   ${status} ${table}`);
    });
    
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n💡 Run "npm run migrate" to create missing tables');
      return false;
    } else {
      console.log('\n🎉 All required tables exist!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run check if this file is executed directly
if (require.main === module) {
  checkTables()
    .then((complete) => {
      process.exit(complete ? 0 : 1);
    });
}

export { checkTables };