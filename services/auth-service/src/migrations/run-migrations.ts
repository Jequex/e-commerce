import { readFileSync } from 'fs';
import { join } from 'path';
import { client } from '../config/database';

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations for Auth Service...');
    
    // Verify we're connected to the correct database
    const dbResult = await client`SELECT current_database()`;
    console.log(`🗄️  Target database: ${dbResult[0].current_database}`);
    
    if (dbResult[0].current_database !== 'ecommerce_auth') {
      throw new Error(`Expected to connect to 'ecommerce_auth' database, but connected to '${dbResult[0].current_database}'`);
    }
    
    // Read the SQL migration file
    const sqlFilePath = join(__dirname, 'create-tables.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');
    
    // Execute the migration
    await client.unsafe(sql);
    
    console.log('✅ Auth Service database tables created successfully!');
    console.log('📋 Created tables in ecommerce_auth database:');
    console.log('   - users');
    console.log('   - user_sessions');
    console.log('   - password_resets');
    console.log('   - email_verifications');
    console.log('   - user_activities');
    console.log('   - oauth_providers');
    console.log('   - api_keys');
    console.log('🔍 Created indexes for performance optimization');
    console.log('⚡ Created triggers for automatic timestamp updates');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Auth Service migration to dedicated database completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auth Service migration failed:', error);
      process.exit(1);
    });
}

export { runMigrations };