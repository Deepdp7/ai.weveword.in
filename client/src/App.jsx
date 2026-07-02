import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import { useAuth } from './context/AuthContext';
import { MessageCircle } from 'lucide-react';

// Lazy load components for performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));

const PDFHub = lazy(() => import('./pages/PDFTools/PDFHub'));
const MergePDF = lazy(() => import('./pages/PDFTools/MergePDF'));
const GenericConverter = lazy(() => import('./pages/PDFTools/GenericConverter'));
const ImagesToPDF = lazy(() => import('./pages/PDFTools/ImagesToPDF'));
const Studio = lazy(() => import('./pages/Studio/Studio'));

const Signature = lazy(() => import('./pages/Signature/Signature'));
const Animator = lazy(() => import('./pages/Animator/Animator'));
const BgRemover = lazy(() => import('./pages/BgRemover/BgRemover'));
const ImageResizer = lazy(() => import('./pages/ImageResizer/ImageResizer'));
const MicroNoteMaker = lazy(() => import('./pages/MicroNoteMaker/MicroNoteMaker'));
const AIMentors = lazy(() => import('./pages/AIMentors/AIMentors'));
const ProjectBuilder = lazy(() => import('./pages/ProjectBuilder/ProjectBuilder'));
const Library = lazy(() => import('./pages/Library/Library'));
const PPTMaker = lazy(() => import('./pages/PPTMaker/PPTMaker'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const TaskHistory = lazy(() => import('./pages/Admin/TaskHistory'));
const CreditShop = lazy(() => import('./pages/CreditShop/CreditShop'));

// Loading Fallback
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
  </div>
);

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

const WhatsAppButton = () => (
  <a
    href="https://wa.me/917980975812"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/40 hover:-translate-y-1 transition-all z-50 flex items-center justify-center group"
    title="Connect on WhatsApp"
  >
    <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform fill-current" />
  </a>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          
          {/* Main Layout - Now Public */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            
            {/* Signature Generator */}
            <Route path="signature" element={<ProtectedRoute><Signature /></ProtectedRoute>} />

            {/* AI Mentors */}
            <Route path="mentors" element={<ProtectedRoute><AIMentors /></ProtectedRoute>} />

            {/* Micro Note Maker */}
            <Route path="micro-notes" element={<ProtectedRoute><MicroNoteMaker /></ProtectedRoute>} />

            {/* Writing Animator */}
            <Route path="animator" element={<ProtectedRoute><Animator /></ProtectedRoute>} />


            {/* Studio Tools */}
            <Route path="studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="bg-remover" element={<ProtectedRoute><BgRemover /></ProtectedRoute>} />
            <Route path="image-resizer" element={<ProtectedRoute><ImageResizer /></ProtectedRoute>} />

            {/* Project Builder */}
            <Route path="project" element={<ProtectedRoute><ProjectBuilder /></ProtectedRoute>} />
            <Route path="project-builder" element={<ProtectedRoute><ProjectBuilder /></ProtectedRoute>} />

            {/* Cloud Library */}
            <Route path="library" element={<ProtectedRoute><Library /></ProtectedRoute>} />

            {/* PPT Maker */}
            <Route path="ppt-maker" element={<ProtectedRoute><PPTMaker /></ProtectedRoute>} />

            {/* Profile */}
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="admin/tasks" element={<AdminRoute><TaskHistory /></AdminRoute>} />

            {/* Credit Shop */}
            <Route path="credits" element={<ProtectedRoute><CreditShop /></ProtectedRoute>} />

            {/* PDF Tools */}
            <Route path="pdf-tools" element={<ProtectedRoute><PDFHub /></ProtectedRoute>} />
            <Route path="pdf-tools/merge" element={<ProtectedRoute><MergePDF /></ProtectedRoute>} />
            <Route path="pdf-tools/images-to-pdf" element={<ProtectedRoute><ImagesToPDF /></ProtectedRoute>} />
            <Route path="pdf-tools/:toolKey" element={<ProtectedRoute><GenericConverter /></ProtectedRoute>} />
            
          </Route>
        </Routes>
      </Suspense>
      <WhatsAppButton />
    </BrowserRouter>
  );
}

export default App;
