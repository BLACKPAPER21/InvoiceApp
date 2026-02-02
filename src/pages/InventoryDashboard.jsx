import { useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import useProductStore from '../store/useProductStore';
import { cn } from '../utils/helpers';

export default function InventoryDashboard() {
  const { stats, lowStockProducts, fetchStats, fetchLowStock, loading } = useProductStore();

  useEffect(() => {
    fetchStats();
    fetchLowStock();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Stock Value',
      value: `Rp ${(stats?.totalStockValue || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Retail Value',
      value: `Rp ${(stats?.totalRetailValue || 0).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your inventory and stock levels</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('w-6 h-6', stat.textColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Low Stock Alerts</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className="text-lg font-bold text-red-600">
                    {product.stock} {product.unit}
                  </p>
                  <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                </div>
              </div>
            ))}
          </div>
          {lowStockProducts.length > 5 && (
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
              View all {lowStockProducts.length} low stock items →
            </button>
          )}
        </div>
      )}

      {/* Categories Overview */}
      {stats?.categoryList && stats.categoryList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {stats.categoryList.map((category) => (
              <span
                key={category}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
