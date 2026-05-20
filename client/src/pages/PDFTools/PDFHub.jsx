import { Link } from 'react-router-dom';
import { FileText, Layers, Scissors, Minimize2, Image, Key, RotateCw, CheckSquare, Type, Presentation, FileSpreadsheet, FilePlus } from 'lucide-react';

export default function PDFHub() {
  const freeTools = [
    { name: 'Merge PDF', desc: 'Combine multiple PDFs into one file', icon: Layers, path: '/pdf-tools/merge', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Images to PDF', desc: 'Convert JPG/PNG images to PDF', icon: FilePlus, path: '/pdf-tools/images-to-pdf', color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Word to PDF', desc: 'Convert .docx to PDF', icon: FileText, path: '/pdf-tools/word-to-pdf', color: 'text-blue-600', bg: 'bg-blue-100', isNew: true },
    { name: 'TXT to PDF', desc: 'Convert plain text to PDF', icon: Type, path: '/pdf-tools/txt-to-pdf', color: 'text-gray-600', bg: 'bg-gray-100', isNew: true },
    { name: 'PPT to PDF', desc: 'Convert .pptx to PDF', icon: Presentation, path: '/pdf-tools/ppt-to-pdf', color: 'text-red-500', bg: 'bg-red-50', isNew: true },
    { name: 'Excel to PDF', desc: 'Convert .xlsx to PDF', icon: FileSpreadsheet, path: '/pdf-tools/excel-to-pdf', color: 'text-green-600', bg: 'bg-green-50', isNew: true },
  ];

  const premiumTools = [
    { name: 'PDF to Word', desc: 'Convert PDF to .docx', credits: 8 },
    { name: 'PDF OCR', desc: 'Make scanned PDF searchable', credits: 10 },
    { name: 'Add Watermark', desc: 'Add text or image watermark', credits: 5 },
    { name: 'Add E-Signature', desc: 'Sign your PDF documents', credits: 5 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-8 px-4">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto text-brand-600 mb-6">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          PDF Tools Hub
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A comprehensive suite of tools to manipulate, convert, and secure your PDF documents.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Free Utilities <span className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">0 Credits</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.name}
                to={tool.path}
                className="group bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex items-start gap-4 relative"
              >
                {tool.isNew && (
                  <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">NEW</span>
                )}
                <div className={`p-4 rounded-xl ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                  <p className="text-sm text-gray-500">{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Premium Utilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumTools.map((tool) => (
            <div key={tool.name} className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5 rounded-2xl relative overflow-hidden group cursor-not-allowed opacity-70">
              <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{tool.desc}</p>
              <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">
                <CheckSquare className="w-3 h-3" /> {tool.credits} Credits
              </div>
              <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
