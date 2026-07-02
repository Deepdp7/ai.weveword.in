import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';

import PDFHub from './pages/PDFTools/PDFHub';
import MergePDF from './pages/PDFTools/MergePDF';
import GenericConverter from './pages/PDFTools/GenericConverter';
import ImagesToPDF from './pages/PDFTools/ImagesToPDF';
import Studio from './pages/Studio/Studio';

import Signature from './pages/Signature/Signature';
import Animator from './pages/Animator/Animator';
import BgRemover from './pages/BgRemover/BgRemover';
import ImageResizer from './pages/ImageResizer/ImageResizer';
import MicroNoteMaker from './pages/MicroNoteMaker/MicroNoteMaker';
import AIMentors from './pages/AIMentors/AIMentors';
import ProjectBuilder from './pages/ProjectBuilder/ProjectBuilder';
import Library from './pages/Library/Library';
import PPTMaker from './pages/PPTMaker/PPTMaker';
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import TaskHistory from './pages/Admin/TaskHistory';
import CreditShop from './pages/CreditShop/CreditShop';
import { useAuth } from './context/AuthContext';

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

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
