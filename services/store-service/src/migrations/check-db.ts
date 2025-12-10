import { db } from '../config/database';
import { pool } from '../config/database';
import { sql } from 'drizzle-orm';

async function checkDatabaseConnection() {
  try {
    console.log('🔄 Checking database connection...');
    
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection successful');
    console.log('📅 Current database time:', result.rows[0]?.current_time);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDatabaseConnection();
}

export { checkDatabaseConnection };