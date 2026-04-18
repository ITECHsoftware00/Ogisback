import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { MessageNotificationProvider } from '../../context/MessageNotificationContext';

export default function DashboardLayout({ children }) {
  const { user, activeRole, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (user && !user.profileComplete) {
      if (activeRole === 'creator') navigate('/creator/profile/edit?setup=true');
      else navigate('/brand/settings?setup=true');
    }
  }, [isLoggedIn, user, activeRole]);

  return (
    <MessageNotificationProvider>
      <div className="min-h-screen bg-[#F8F8FB] dark:bg-[#09090F] relative">
        {/* Subtle dot grid — fixed so it doesn't scroll */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none hidden dark:block"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-0">
          <Navbar />
          <div className="flex max-w-[1440px] mx-auto">
            <Sidebar />
            <main className="flex-1 min-w-0 p-5 lg:p-7 animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </div>
    </MessageNotificationProvider>
  );
}
