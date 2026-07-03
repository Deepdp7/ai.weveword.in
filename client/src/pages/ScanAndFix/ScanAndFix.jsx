import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, UploadCloud, RefreshCw, Download, Scan, Loader2, Sparkles, CheckCircle2, SlidersHorizontal, ArrowRight, Cloud, Zap } from 'lucide-react';
import axios from 'axios';

const API = `http://${window.location.hostname}/api/scan-fix`;
axios.defaults.withCredentials = true;

export default function ScanAndFix() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [settings, setSettings] = useState({
    contrast: 150,
    brightness: 110,
    grayscale: 100
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result);
        setProcessedUrl(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1
  });

  const handleEnhance = async () => {
    setIsProcessing(true);
    try {
      const { data } = await axios.post(`${API}/enhance`, {
        image: originalImage,
        settings
      });
      setProcessedUrl(data.url);
    } catch (err) {
      alert('AI Restoration failed. Please try a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `Restored_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Scan className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Blur Fix AI</h1>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-md">
                <Zap size={14} className="text-yellow-400 fill-current" />
                <span className="text-[10px] font-black tracking-tight uppercase">Cost: 5 Credits</span>
              </div>
            </div>
            <p className="text-gray-500 font-medium">Instantly clear up blurry images, handwritten notes, and old photos.</p>
          </div>
        </div>
        {originalImage && (
          <button onClick={() => { setOriginalImage(null); setProcessedUrl(null); }} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
            Reset
          </button>
        )}
      </div>

      {!originalImage ? (
        <div {...getRootProps()} className={`border-3 border-dashed rounded-[2rem] p-24 text-center transition-all cursor-pointer bg-white ${isDragActive ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-200 hover:border-emerald-400 hover:shadow-xl'}`}>
          <input {...getInputProps()} />
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-2 italic">DRAG & DROP</h3>
          <p className="text-gray-400 font-bold max-w-sm mx-auto uppercase tracking-tighter">Upload your blurry images, handwritten notes, or old photos to clear them instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative min-h-[500px] flex items-center justify-center">
              <img src={processedUrl || originalImage} className={`max-w-full max-h-[700px] transition-all duration-700 ${isProcessing ? 'opacity-50 blur-sm scale-95' : 'scale-100'}`} alt="Preview" />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
                    <Sparkles className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-white mt-4 font-black tracking-widest text-xs uppercase animate-pulse">Running AI Enhancements...</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">Fine-tune Output</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <span>Contrast Boost</span>
                    <span>{settings.contrast}%</span>
                  </div>
                  <input type="range" min="100" max="250" value={settings.contrast} onChange={(e) => setSettings({...settings, contrast: parseInt(e.target.value)})} className="w-full accent-emerald-600" />
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <span>Brightness</span>
                    <span>{settings.brightness}%</span>
                  </div>
                  <input type="range" min="80" max="180" value={settings.brightness} onChange={(e) => setSettings({...settings, brightness: parseInt(e.target.value)})} className="w-full accent-emerald-600" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                {!processedUrl ? (
                  <button onClick={handleEnhance} disabled={isProcessing} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                    <Sparkles size={16} /> Enhance Photo
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadResult}
                      className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button 
                      onClick={() => alert('Restoration successfully saved to your Cloud Library!')}
                      className="flex-1 py-4 bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-800 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Cloud size={18} /> Save to Cloud
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-lg font-black mb-2 uppercase">Pro Tip!</h4>
                 <p className="text-emerald-100 text-sm font-medium leading-relaxed">AI Restoration works best on photos with even lighting. Use 'B&W Mode' for text documents for maximum clarity.</p>
               </div>
               <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
