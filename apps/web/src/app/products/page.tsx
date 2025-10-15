import Link from 'next/link';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-4 text-lg text-gray-600">Browse our product catalog</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((product) => (
            <div key={product} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Product Image {product}</span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sample Product {product}</h3>
                <p className="text-gray-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">$99.99</span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search & Filter</h3>
                <p className="text-gray-600">Find products quickly with advanced search and filtering options</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Details</h3>
                <p className="text-gray-600">View detailed information, images, and specifications for each product</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add to Cart</h3>
                <p className="text-gray-600">Easily add products to your cart and proceed to checkout</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/cart" 
            className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors inline-block"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}