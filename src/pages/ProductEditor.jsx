import { useEffect, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import useProductStore from '../store/useProductStore';

export default function ProductEditor({ productId, onNavigate }) {
  const { currentProduct, fetchProductById, createProduct, updateProduct, loading } = useProductStore();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'General',
    unit: 'pcs',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 10,
    location: 'Main Warehouse',
    supplier: '',
  });

  const isEditMode = !!productId;

  useEffect(() => {
    if (isEditMode) {
      fetchProductById(productId);
    }
  }, [productId, isEditMode]);

  useEffect(() => {
    if (currentProduct && isEditMode) {
      setFormData({
        sku: currentProduct.sku || '',
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        category: currentProduct.category || 'General',
        unit: currentProduct.unit || 'pcs',
        price: currentProduct.price || 0,
        cost: currentProduct.cost || 0,
        stock: currentProduct.stock || 0,
        minStock: currentProduct.minStock || 10,
        location: currentProduct.location || 'Main Warehouse',
        supplier: currentProduct.supplier || '',
      });
    }
  }, [currentProduct, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        await updateProduct(productId, formData);
        alert('Product updated successfully!');
      } else {
        await createProduct(formData);
        alert('Product created successfully!');
      }
      onNavigate('inventory');
    } catch (error) {
      alert('Failed to save product: ' + error.message);
    }
  };

  const profitMargin = formData.cost > 0
    ? (((formData.price - formData.cost) / formData.cost) * 100).toFixed(2)
    : 0;

  if (loading && isEditMode && !currentProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('inventory')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Update product information' : 'Fill in the details to add a new product'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="e.g., PRD-001"
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Laptop Dell Inspiron"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Electronics"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="liter">Liter</option>
              <option value="meter">Meter</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (Rp)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {profitMargin > 0 && (
              <p className="text-sm text-green-600 mt-1">Profit Margin: {profitMargin}%</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock Alert
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Warehouse A"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., PT Supplier Jaya"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product description..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
