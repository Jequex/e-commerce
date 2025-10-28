import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema/auth';

const connectionString = process.env.DATABASE_URL || 'postgresql://ecommerce:password@localhost:5432/ecommerce_auth';

// Create the postgres client
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the drizzle database instance
export const db = drizzle(client, { schema });

// Database connection test
export const testConnection = async () => {
  try {
    await client`SELECT 1`;
    console.log('✅ Auth Service connected to dedicated auth database successfully');
    return true;
  } catch (error) {
    console.error('❌ Auth Service Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async () => {
  try {
    await client.end();
    console.log('📝 Auth Service database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};