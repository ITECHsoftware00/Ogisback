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
import TikTokCallback from './pages/TikTokCallback';
import FacebookCallback from './pages/FacebookCallback';
import ResetPassword from './pages/ResetPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Notifications from './pages/Notifications';
import Following from './pages/Following';
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

// Route guard — any authenticated user
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, settling } = useAuth();
  if (loading || settling) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

// Creator-only route
function CreatorRoute({ children }) {
  const { isLoggedIn, activeRole, loading, settling } = useAuth();
  if (loading || settling) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (activeRole === 'admin') return <Navigate to="/admin" replace />;
  if (activeRole !== 'creator') return <Navigate to="/brand/dashboard" replace />;
  return children;
}

// Brand-only route
function BrandRoute({ children }) {
  const { isLoggedIn, activeRole, loading, settling } = useAuth();
  if (loading || settling) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (activeRole === 'admin') return <Navigate to="/admin" replace />;
  if (activeRole !== 'brand') return <Navigate to="/creator/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isLoggedIn, activeRole, loading, settling } = useAuth();
  if (loading || settling) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (activeRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function HomeRoute() {
  const { isLoggedIn, activeRole, loading, settling } = useAuth();
  if (loading || settling) return null;
  if (!isLoggedIn) return <Landing />;
  if (activeRole === 'creator') return <Navigate to="/creator/dashboard" replace />;
  if (activeRole === 'brand')   return <Navigate to="/brand/discover" replace />;
  if (activeRole === 'admin')   return <Navigate to="/admin" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/creator/:username" element={<CreatorPublicProfile />} />
      <Route path="/campaign/:id" element={<CampaignPublicDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/tiktok" element={<TikTokCallback />} />
      <Route path="/auth/facebook" element={<FacebookCallback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Creator dashboard */}
      <Route path="/creator/dashboard" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
      <Route path="/creator/feed" element={<CreatorRoute><CreatorFeed /></CreatorRoute>} />
      <Route path="/creator/post/new" element={<CreatorRoute><CreatorNewPost /></CreatorRoute>} />
      <Route path="/creator/campaigns" element={<CreatorRoute><CreatorCampaigns /></CreatorRoute>} />
      <Route path="/creator/campaigns/:id" element={<CreatorRoute><CreatorCampaignDetail /></CreatorRoute>} />
      <Route path="/creator/orders" element={<CreatorRoute><CreatorOrders /></CreatorRoute>} />
      <Route path="/creator/orders/:id" element={<CreatorRoute><CreatorOrderDetail /></CreatorRoute>} />
      <Route path="/creator/pitch" element={<CreatorRoute><CreatorPitch /></CreatorRoute>} />
      <Route path="/creator/messages" element={<CreatorRoute><CreatorMessages /></CreatorRoute>} />
      <Route path="/creator/messages/:id" element={<CreatorRoute><CreatorMessageThread /></CreatorRoute>} />
      <Route path="/creator/earnings" element={<CreatorRoute><CreatorEarnings /></CreatorRoute>} />
      <Route path="/creator/withdraw" element={<CreatorRoute><CreatorWithdraw /></CreatorRoute>} />
      <Route path="/creator/analytics" element={<CreatorRoute><CreatorAnalytics /></CreatorRoute>} />
      <Route path="/creator/profile/edit" element={<CreatorRoute><CreatorProfileEdit /></CreatorRoute>} />
      <Route path="/creator/settings" element={<CreatorRoute><CreatorSettings /></CreatorRoute>} />

      {/* Brand dashboard */}
      <Route path="/brand/dashboard" element={<BrandRoute><BrandDashboard /></BrandRoute>} />
      <Route path="/brand/discover" element={<BrandRoute><BrandDiscover /></BrandRoute>} />
      <Route path="/brand/discover/:username" element={<BrandRoute><BrandCreatorView /></BrandRoute>} />
      <Route path="/brand/campaigns" element={<BrandRoute><BrandCampaigns /></BrandRoute>} />
      <Route path="/brand/campaigns/new" element={<BrandRoute><BrandNewCampaign /></BrandRoute>} />
      <Route path="/brand/campaigns/:id" element={<BrandRoute><BrandCampaignDetail /></BrandRoute>} />
      <Route path="/brand/orders" element={<BrandRoute><BrandOrders /></BrandRoute>} />
      <Route path="/brand/orders/:id" element={<BrandRoute><BrandOrderDetail /></BrandRoute>} />
      <Route path="/brand/messages" element={<BrandRoute><BrandMessages /></BrandRoute>} />
      <Route path="/brand/messages/:id" element={<BrandRoute><BrandMessageThread /></BrandRoute>} />
      <Route path="/brand/payments" element={<BrandRoute><BrandPayments /></BrandRoute>} />
      <Route path="/brand/add-funds" element={<BrandRoute><BrandAddFunds /></BrandRoute>} />
      <Route path="/brand/saved" element={<BrandRoute><BrandSaved /></BrandRoute>} />
      <Route path="/brand/settings" element={<BrandRoute><BrandSettings /></BrandRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
      <Route path="/admin/campaigns" element={<AdminRoute><AdminCampaigns /></AdminRoute>} />
      <Route path="/admin/escrow" element={<AdminRoute><AdminEscrow /></AdminRoute>} />
      <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />

      {/* Shared (any authenticated role) */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
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
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
