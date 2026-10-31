import postgres from 'postgres';

const basePaymentsUrl = process.env.DATABASE_URL || 'postgresql://ecommerce:password@postgres:5432/ecommerce_payments';
const ordersDbUrl = process.env.ORDERS_DATABASE_URL || basePaymentsUrl.replace(/ecommerce_payments(\?.*)?$/, 'ecommerce_orders$1');

export const ordersClient = postgres(ordersDbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

