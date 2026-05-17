import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PenTool, LayoutTemplate, FileText, Image as ImageIcon, Video, FileSignature, Folder, Presentation, User, LogOut, ShieldCheck, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Studio', path: '/studio', icon: PenTool },
    { name: 'Scan & Fix', path: '/scan', icon: ImageIcon },
    { name: 'Writing Animator', path: '/animator', icon: Video },
    { name: 'Signature Generator', path: '/signature', icon: FileSignature },
    { name: 'Project Builder', path: '/project-builder', icon: LayoutTemplate },
    { name: 'Cloud Library', path: '/library', icon: Folder },
    { name: 'PPT Maker', path: '/ppt-maker', icon: Presentation },
    { name: 'PDF Tools', path: '/pdf-tools', icon: FileText },
    { name: 'Credits', path: '/credits', icon: Coins },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <PenTool className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">KolomFlow</span>
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
      </div>
    </aside>
  );
}
