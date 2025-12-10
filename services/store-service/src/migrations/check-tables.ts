import { db } from '../config/database';
import { pool } from '../config/database';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    console.log('🔄 Checking store service database tables...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('store_categories', 'stores', 'store_addresses', 'store_hours', 'store_staff', 'store_reviews', 'store_analytics')
      ORDER BY table_name;
    `;
    
    const result = await db.execute(sql.raw(tablesQuery));
    const tables = result.rows.map((row: any) => row.table_name);
    
    const expectedTables = [
      'store_categories',
      'stores', 
      'store_addresses',
      'store_hours',
      'store_staff',
      'store_reviews',
      'store_analytics'
    ];
    
    console.log('📋 Expected tables:', expectedTables);
    console.log('✅ Found tables:', tables);
    
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('💡 Run migrations to create missing tables: npm run migrate');
    } else {
      console.log('✅ All store service tables are present');
    }
    
    // Check table counts
    for (const table of tables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        console.log(`📊 ${table}: ${countResult.rows[0]?.count || 0} records`);
      } catch (error) {
        console.log(`❌ Error counting records in ${table}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkTables();
}

export { checkTables };