import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema/payments';

// Database configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_payments';

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Ignore notices
});

// Create Drizzle instance
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Test database connection
export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log('✅ Payment Service database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Payment Service database connection failed:', error);
    throw error;
  }
}

// Gracefully close database connection
export async function closeConnection() {
  try {
    await client.end();
    console.log('📝 Payment Service database connection closed');
  } catch (error) {
    console.error('Error closing Payment Service database connection:', error);
  }
}