import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AllInvoices from './pages/AllInvoices';
import InvoiceEditor from './pages/InvoiceEditor';
import InventoryDashboard from './pages/InventoryDashboard';
import ProductsList from './pages/ProductsList';
import ProductEditor from './pages/ProductEditor';
import StockHistory from './pages/StockHistory';
import SalesAnalytics from './pages/SalesAnalytics';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);

  const handleNavigate = (page, id = null) => {
    setCurrentPage(page);
    setSelectedId(id);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'invoices':
        return <AllInvoices onNavigate={handleNavigate} />;
      case 'create':
        return <InvoiceEditor onNavigate={handleNavigate} />;
      case 'inventory':
        return <ProductsList onNavigate={handleNavigate} />;
      case 'inventory-dashboard':
        return <InventoryDashboard onNavigate={handleNavigate} />;
      case 'inventory-new':
        return <ProductEditor onNavigate={handleNavigate} />;
      case 'inventory-edit':
        return <ProductEditor productId={selectedId} onNavigate={handleNavigate} />;
      case 'stock-history':
        return <StockHistory onNavigate={handleNavigate} />;
      case 'sales-analytics':
        return <SalesAnalytics onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
