import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AllInvoices from './pages/AllInvoices';
import InvoiceEditor from './pages/InvoiceEditor';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'invoices':
        return <AllInvoices onNavigate={setCurrentPage} />;
      case 'create':
        return <InvoiceEditor onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
