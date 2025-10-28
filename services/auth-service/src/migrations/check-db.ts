import dotenv from 'dotenv';
import { client } from '../config/database';

// Load environment variables
dotenv.config();

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking Auth Service database connection...');
    
    // Test the connection
    const result = await client`SELECT version()`;
    console.log('✅ Database connection successful!');
    console.log(`📊 PostgreSQL version: ${result[0].version}`);
    
    // Check if we're connected to the right database
    const dbResult = await client`SELECT current_database()`;
    console.log(`🗄️  Connected to database: ${dbResult[0].current_database}`);
    
    // Verify it's the expected database
    if (dbResult[0].current_database === 'ecommerce_auth') {
      console.log('✅ Connected to dedicated Auth Service database');
    } else {
      console.log('⚠️  Expected ecommerce_auth database, but connected to:', dbResult[0].current_database);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run check if this file is executed directly
if (require.main === module) {
  checkDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    });
}

export { checkDatabaseConnection };