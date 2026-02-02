import { useEffect, useState } from 'react';
import { History, TrendingDown, TrendingUp, Settings, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, IN, OUT, ADJUSTMENT

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products/stock-history`);
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(item => item.type === filter);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'ADJUSTMENT':
        return <Settings className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      IN: 'bg-green-100 text-green-800',
      OUT: 'bg-red-100 text-red-800',
      ADJUSTMENT: 'bg-blue-100 text-blue-800',
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy">Stock History</h1>
          <p className="text-gray-600 mt-2">Track all inventory movements and changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('IN')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'IN'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock In
          </button>
          <button
            onClick={() => setFilter('OUT')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'OUT'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock Out
          </button>
          <button
            onClick={() => setFilter('ADJUSTMENT')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ADJUSTMENT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Adjustments
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No stock movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${
                          item.type === 'OUT' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {item.type === 'OUT' ? '-' : '+'}
                        {Math.abs(item.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantityBefore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantityAfter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.reference ? (
                        <span className="text-blue-600 font-medium">
                          Invoice: {item.reference}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Stock In</p>
              <p className="text-2xl font-bold text-green-700">
                {history.filter((h) => h.type === 'IN').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Stock Out</p>
              <p className="text-2xl font-bold text-red-700">
                {history.filter((h) => h.type === 'OUT').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Adjustments</p>
              <p className="text-2xl font-bold text-blue-700">
                {history.filter((h) => h.type === 'ADJUSTMENT').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
