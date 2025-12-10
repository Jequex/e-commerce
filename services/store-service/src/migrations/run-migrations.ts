import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../config/database';
import { pool } from '../config/database';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, './sql') 
    });
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };