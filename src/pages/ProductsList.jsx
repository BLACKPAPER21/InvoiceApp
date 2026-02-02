import { useEffect, useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import useProductStore from '../store/useProductStore';
import { cn } from '../utils/helpers';

export default function ProductsList({ onNavigate }) {
  const { products, fetchProducts, deleteProduct, loading } = useProductStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const filters = {};
    if (filter === 'lowStock') {
      filters.lowStock = true;
    }
    await fetchProducts(filters);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(id);
        alert('Product deleted successfully');
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your inventory products</p>
        </div>
        <button
          onClick={() => onNavigate('inventory-new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              loadProducts();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Products</option>
            <option value="lowStock">Low Stock</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first product'}
          </p>
          <button
            onClick={() => onNavigate('inventory-new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            product.isLowStock ? 'text-red-600' : 'text-gray-900'
                          )}
                        >
                          {product.stock} {product.unit}
                        </span>
                        {product.isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Min: {product.minStock}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">
                        Rp {product.price.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">
                        Rp {(product.stock * product.price).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('inventory-edit', product._id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {filteredProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Products: {filteredProducts.length}</span>
            <span className="text-gray-600">
              Total Value: Rp{' '}
              {filteredProducts
                .reduce((sum, p) => sum + p.stock * p.price, 0)
                .toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
