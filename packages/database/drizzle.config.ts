import { defineConfig } from 'drizzle-kit';
import { env } from '@ecommerce/config';

export default defineConfig({
  schema: './src/schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
});