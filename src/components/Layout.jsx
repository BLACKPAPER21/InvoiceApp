import { Home, FileText, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/helpers';

const navigation = [
  { name: 'Dashboard', icon: Home, href: '#' },
  { name: 'All Invoices', icon: FileText, href: '#invoices' },
  { name: 'Create New', icon: Plus, href: '#create' },
];

export default function Layout({ children, currentPage, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-navy text-white transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center p-6 border-b border-white/10">
            <img
              src="/assets/codeinkamu-logo.png"
              alt="CodeInKamu"
              className="h-20 w-auto object-contain"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 p-1 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === `#${currentPage}` || (item.href === '#' && currentPage === 'dashboard');
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.href.replace('#', '') || 'dashboard');
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="glass-card bg-white/10 p-4 rounded-lg">
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-xs text-blue-200 mt-1">
                Contact support for assistance
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-glass border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src="/assets/codeinkamu-logo.png"
              alt="CodeInKamu"
              className="h-12 w-auto object-contain"
            />
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
