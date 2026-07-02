import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PenTool, LayoutTemplate, FileText, Image as ImageIcon, Scissors, Crop, Video, FileSignature, Folder, Presentation, User, LogOut, ShieldCheck, Coins, Brain, Sparkles, Minimize, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoUrl from '../../assets/logo2.png';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Cloud Library', path: '/library', icon: Folder },
    { name: 'AI Mentors', path: '/mentors', icon: Brain },
    { name: 'Studio', path: '/studio', icon: PenTool },
    { name: 'Project Builder', path: '/project-builder', icon: LayoutTemplate },
    { name: 'PPT Maker', path: '/ppt-maker', icon: Presentation },
    { name: 'Micro Note Maker', path: '/micro-notes', icon: Sparkles },
    { name: 'PDF Tools', path: '/pdf-tools', icon: FileText },
    { name: 'BG Remover', path: '/bg-remover', icon: Scissors },
    { name: 'Image Resizer', path: '/image-resizer', icon: Minimize },
    { name: 'Signature Generator', path: '/signature', icon: FileSignature },
    { name: 'Writing Animator', path: '/animator', icon: Video },
    { name: 'Credits', path: '/credits', icon: Coins },
  ];

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-xl md:shadow-sm flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="py-6 flex items-center justify-center px-6 border-b border-gray-100">
        <div className="flex items-center justify-center w-full">
          <img src={logoUrl} alt="Logo" className="w-full max-w-[130px] h-auto object-contain drop-shadow-md" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-100 space-y-1">
        {user ? (
          <>
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <span className="truncate text-sm font-medium text-gray-800">{user?.name || 'Profile'}</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors text-sm font-medium">
                <ShieldCheck className="w-5 h-5" /> Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-3 px-3 py-2 rounded-xl text-brand-600 hover:bg-brand-50 transition-colors text-sm font-medium">
            <User className="w-5 h-5" /> Sign In to Waveword
          </Link>
        )}
      </div>
    </aside>
  );
}
