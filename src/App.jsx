import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import Forum from './pages/Forum';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import CampaignPublicDetail from './pages/CampaignPublicDetail';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Notifications from './pages/Notifications';
import LiveSupport from './components/LiveSupport';

// Creator pages
import CreatorDashboard from './pages/creator/Dashboard';
import CreatorFeed from './pages/creator/Feed';
import CreatorNewPost from './pages/creator/NewPost';
import CreatorCampaigns from './pages/creator/Campaigns';
import CreatorCampaignDetail from './pages/creator/CampaignDetail';
import CreatorOrders from './pages/creator/Orders';
import CreatorOrderDetail from './pages/creator/OrderDetail';
import CreatorPitch from './pages/creator/Pitch';
import CreatorMessages from './pages/creator/Messages';
import CreatorMessageThread from './pages/creator/MessageThread';
import CreatorEarnings from './pages/creator/Earnings';
import CreatorWithdraw from './pages/creator/Withdraw';
import CreatorAnalytics from './pages/creator/Analytics';
import CreatorProfileEdit from './pages/creator/ProfileEdit';
import CreatorSettings from './pages/creator/Settings';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminCampaigns from './pages/admin/Campaigns';
import AdminEscrow from './pages/admin/Escrow';
import AdminSubscriptions from './pages/admin/Subscriptions';

// Brand pages
import BrandDashboard from './pages/brand/Dashboard';
import BrandDiscover from './pages/brand/Discover';
import BrandCreatorView from './pages/brand/CreatorView';
import BrandCampaigns from './pages/brand/Campaigns';
import BrandNewCampaign from './pages/brand/NewCampaign';
import BrandCampaignDetail from './pages/brand/CampaignDetail';
import BrandOrders from './pages/brand/Orders';
import BrandOrderDetail from './pages/brand/OrderDetail';
import BrandMessages from './pages/brand/Messages';
import BrandMessageThread from './pages/brand/MessageThread';
import BrandPayments from './pages/brand/Payments';
import BrandAddFunds from './pages/brand/AddFunds';
import BrandSaved from './pages/brand/Saved';
import BrandSettings from './pages/brand/Settings';

// Route guard
function ProtectedRoute({ children, requiredRole }) {
  const { isLoggedIn, activeRole } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (requiredRole && activeRole !== requiredRole) {
    if (activeRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover'} replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { isLoggedIn, activeRole } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (activeRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/creator/:username" element={<CreatorPublicProfile />} />
      <Route path="/campaign/:id" element={<CampaignPublicDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Creator dashboard */}
      <Route path="/creator/dashboard" element={<ProtectedRoute requiredRole="creator"><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/creator/feed" element={<ProtectedRoute requiredRole="creator"><CreatorFeed /></ProtectedRoute>} />
      <Route path="/creator/post/new" element={<ProtectedRoute requiredRole="creator"><CreatorNewPost /></ProtectedRoute>} />
      <Route path="/creator/campaigns" element={<ProtectedRoute requiredRole="creator"><CreatorCampaigns /></ProtectedRoute>} />
      <Route path="/creator/campaigns/:id" element={<ProtectedRoute requiredRole="creator"><CreatorCampaignDetail /></ProtectedRoute>} />
      <Route path="/creator/orders" element={<ProtectedRoute requiredRole="creator"><CreatorOrders /></ProtectedRoute>} />
      <Route path="/creator/orders/:id" element={<ProtectedRoute requiredRole="creator"><CreatorOrderDetail /></ProtectedRoute>} />
      <Route path="/creator/pitch" element={<ProtectedRoute requiredRole="creator"><CreatorPitch /></ProtectedRoute>} />
      <Route path="/creator/messages" element={<ProtectedRoute requiredRole="creator"><CreatorMessages /></ProtectedRoute>} />
      <Route path="/creator/messages/:id" element={<ProtectedRoute requiredRole="creator"><CreatorMessageThread /></ProtectedRoute>} />
      <Route path="/creator/earnings" element={<ProtectedRoute requiredRole="creator"><CreatorEarnings /></ProtectedRoute>} />
      <Route path="/creator/withdraw" element={<ProtectedRoute requiredRole="creator"><CreatorWithdraw /></ProtectedRoute>} />
      <Route path="/creator/analytics" element={<ProtectedRoute requiredRole="creator"><CreatorAnalytics /></ProtectedRoute>} />
      <Route path="/creator/profile/edit" element={<ProtectedRoute requiredRole="creator"><CreatorProfileEdit /></ProtectedRoute>} />
      <Route path="/creator/settings" element={<ProtectedRoute requiredRole="creator"><CreatorSettings /></ProtectedRoute>} />

      {/* Brand dashboard */}
      <Route path="/brand/dashboard" element={<ProtectedRoute requiredRole="brand"><BrandDashboard /></ProtectedRoute>} />
      <Route path="/brand/discover" element={<ProtectedRoute requiredRole="brand"><BrandDiscover /></ProtectedRoute>} />
      <Route path="/brand/discover/:username" element={<ProtectedRoute requiredRole="brand"><BrandCreatorView /></ProtectedRoute>} />
      <Route path="/brand/campaigns" element={<ProtectedRoute requiredRole="brand"><BrandCampaigns /></ProtectedRoute>} />
      <Route path="/brand/campaigns/new" element={<ProtectedRoute requiredRole="brand"><BrandNewCampaign /></ProtectedRoute>} />
      <Route path="/brand/campaigns/:id" element={<ProtectedRoute requiredRole="brand"><BrandCampaignDetail /></ProtectedRoute>} />
      <Route path="/brand/orders" element={<ProtectedRoute requiredRole="brand"><BrandOrders /></ProtectedRoute>} />
      <Route path="/brand/orders/:id" element={<ProtectedRoute requiredRole="brand"><BrandOrderDetail /></ProtectedRoute>} />
      <Route path="/brand/messages" element={<ProtectedRoute requiredRole="brand"><BrandMessages /></ProtectedRoute>} />
      <Route path="/brand/messages/:id" element={<ProtectedRoute requiredRole="brand"><BrandMessageThread /></ProtectedRoute>} />
      <Route path="/brand/payments" element={<ProtectedRoute requiredRole="brand"><BrandPayments /></ProtectedRoute>} />
      <Route path="/brand/add-funds" element={<ProtectedRoute requiredRole="brand"><BrandAddFunds /></ProtectedRoute>} />
      <Route path="/brand/saved" element={<ProtectedRoute requiredRole="brand"><BrandSaved /></ProtectedRoute>} />
      <Route path="/brand/settings" element={<ProtectedRoute requiredRole="brand"><BrandSettings /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
      <Route path="/admin/campaigns" element={<AdminRoute><AdminCampaigns /></AdminRoute>} />
      <Route path="/admin/escrow" element={<AdminRoute><AdminEscrow /></AdminRoute>} />
      <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />

      {/* Shared */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <LiveSupport />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '12px' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
