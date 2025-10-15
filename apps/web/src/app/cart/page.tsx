import Link from 'next/link';

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="text-gray-500 mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 9H8" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            
            <Link 
              href="/products" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Browse Products
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Add Products</h4>
                <p className="text-sm text-gray-600">Browse our catalog and add items to your cart</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Manage Quantities</h4>
                <p className="text-sm text-gray-600">Update quantities or remove items as needed</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Secure Checkout</h4>
                <p className="text-sm text-gray-600">Proceed to secure payment processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}