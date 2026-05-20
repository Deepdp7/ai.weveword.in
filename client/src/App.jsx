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
import Wallet from './pages/Wallet/Wallet';
import ScanAndFix from './pages/ScanAndFix/ScanAndFix';
import Signature from './pages/Signature/Signature';
import Animator from './pages/Animator/Animator';
import ProjectBuilder from './pages/ProjectBuilder/ProjectBuilder';
import Library from './pages/Library/Library';
import PPTMaker from './pages/PPTMaker/PPTMaker';
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import CreditShop from './pages/CreditShop/CreditShop';
import { useAuth } from './context/AuthContext';

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
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          
          {/* Scan & Fix */}
          <Route path="scan" element={<ScanAndFix />} />
          <Route path="scan-fix" element={<ScanAndFix />} />

          {/* Signature Generator */}
          <Route path="signature" element={<Signature />} />

          {/* Writing Animator */}
          <Route path="animator" element={<Animator />} />

          {/* Wallet */}
          <Route path="wallet" element={<Wallet />} />

          {/* Studio Tools */}
          <Route path="studio" element={<Studio />} />

          {/* Project Builder */}
          <Route path="project" element={<ProjectBuilder />} />
          <Route path="project-builder" element={<ProjectBuilder />} />

          {/* Cloud Library */}
          <Route path="library" element={<Library />} />

          {/* PPT Maker */}
          <Route path="ppt-maker" element={<PPTMaker />} />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />

          {/* Admin */}
          <Route path="admin" element={<Dashboard />} />
          <Route path="admin/users" element={<UserManagement />} />

          {/* Credit Shop */}
          <Route path="credits" element={<CreditShop />} />

          {/* PDF Tools */}
          <Route path="pdf-tools" element={<PDFHub />} />
          <Route path="pdf-tools/merge" element={<MergePDF />} />
          <Route path="pdf-tools/images-to-pdf" element={<ImagesToPDF />} />
          <Route path="pdf-tools/:toolKey" element={<GenericConverter />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
