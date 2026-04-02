import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children, requiredRole }) {
  const { user, activeRole, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    // If new user, redirect to profile setup
    if (user && !user.profileComplete) {
      if (activeRole === 'creator') navigate('/creator/profile/edit?setup=true');
      else navigate('/brand/settings?setup=true');
    }
  }, [isLoggedIn, user, activeRole]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <Navbar />
      <div className="flex max-w-[1440px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
