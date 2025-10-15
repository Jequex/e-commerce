import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              E-Commerce Platform
            </h1>
            <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
              Customer-facing web application for browsing products, managing cart, and placing orders.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
              <Link 
                href="/cart" 
                className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Catalog</h3>
            <p className="text-gray-600">Browse our wide selection of products with advanced filtering and search.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shopping Cart</h3>
            <p className="text-gray-600">Add items to cart, manage quantities, and proceed to secure checkout.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Tracking</h3>
            <p className="text-gray-600">Track your orders in real-time from processing to delivery.</p>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Auth Service', 'Product Service', 'Order Service', 'Payment Service'].map((service) => (
              <div key={service} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{service}</h4>
                <p className="text-sm text-gray-600">Microservice running</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Running
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}