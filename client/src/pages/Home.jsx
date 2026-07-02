import { ArrowRight, PenTool, Image as ImageIcon, Video, FileText, FileSignature, LayoutTemplate, Clock, Scissors, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function Home() {
  const { user } = useAuth();

  const tools = [
    { name: 'AI Mentors', desc: 'Learn with intelligent agents', icon: Brain, path: '/mentors', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Studio', desc: 'Create & edit documents', icon: PenTool, path: '/studio', color: 'bg-brand-500', bg: 'bg-brand-50' },
    { name: 'BG Remover', desc: 'Remove backgrounds instantly', icon: Scissors, path: '/bg-remover', color: 'bg-indigo-500', bg: 'bg-indigo-50' },
    { name: 'PDF Tools', desc: 'Merge, split & compress PDFs', icon: FileText, path: '/pdf-tools', color: 'bg-rose-500', bg: 'bg-rose-50' },
    { name: 'Signature Gen', desc: 'Create beautiful digital signatures', icon: FileSignature, path: '/signature', color: 'bg-amber-500', bg: 'bg-amber-50' },
    { name: 'Project Builder', desc: 'Drag-and-drop report maker', icon: LayoutTemplate, path: '/project', color: 'bg-indigo-500', bg: 'bg-indigo-50' },
  ];

  const recentFiles = [
    { name: 'Marketing_Deck.ppt', tool: 'PPT Maker', time: '2 hours ago' },
    { name: 'Contract_Signed.pdf', tool: 'Signature', time: '1 day ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 text-white p-8 md:p-12 shadow-xl shadow-brand-500/20">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Welcome {user ? 'back ' : ''}to Waveword AI!
          </h1>
          <p className="text-brand-100 text-lg mb-8 max-w-xl leading-relaxed">
            Your all-in-one platform for creative document productivity. What would you like to create today?
          </p>
          <div className="flex gap-4">
            <Link to="/studio" className="bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-50 transition-colors shadow-lg shadow-black/10">
              Start Writing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-40 w-64 h-64 bg-brand-400/20 blur-3xl rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link 
              key={tool.name} 
              to={tool.path}
              className="group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 overflow-hidden flex items-start gap-4"
            >
              <div className={`p-4 rounded-xl ${tool.bg} ${tool.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-sm text-gray-500">{tool.desc}</p>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-500/10 rounded-2xl transition-colors"></div>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Creations</h2>
          <Link to="/library" className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1">
            View Cloud Library <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {recentFiles.map((file, i) => (
              <li key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.tool}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {file.time}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
