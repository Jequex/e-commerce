export const API_URLS = {
  auth: {
    adminLogin: '/api/auth/admin-login',
    admins: '/api/auth/admins',
    adminRegister: '/api/auth/admin-register',
    legalConsents: '/api/auth/legal-consents',
    users: '/api/auth/users',
  },
  products: {
    list: '/api/products',
    categories: '/api/products/categories',
    coupons: '/api/products/coupons',
    markups: '/api/products/markups',
    upload: '/api/products/upload',
  },
  orders: {
    all: '/api/orders/admin/all',
  },
  store: {
    contactSettings: '/api/store/settings/contact',
    legal: '/api/store/legal',
  },
};

