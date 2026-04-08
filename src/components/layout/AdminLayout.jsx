import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingBag, DollarSign,
  Megaphone, Shield, LogOut, Menu, X, Moon, Sun,
  ArrowDownToLine, CreditCard, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/withdrawals', icon: ArrowDownToLine, label: 'Withdrawals' },
  { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/admin/escrow', icon: Shield, label: 'Escrow' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
];

export default function AdminLayout({ children }) {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#111118] border-r border-gray-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-white">OgisBack Admin</p>
              <p className="text-[11px] text-gray-500">Super Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-red-500/10 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <item.icon size={16} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDark} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0A0A0F]/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-500">
              {NAV.find(n => n.to === location.pathname || (n.to !== '/admin' && location.pathname.startsWith(n.to)))?.label || 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
