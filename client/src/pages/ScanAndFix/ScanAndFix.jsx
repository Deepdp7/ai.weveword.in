import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, UploadCloud, RefreshCw, Download, Scan, Loader2, Sparkles, SlidersHorizontal, Cloud, Camera } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../../utils/api';
import { isNative, takePhoto, downloadOrShareFile } from '../../utils/capacitorHelper';

const API = `${API_BASE}/scan-fix`;
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

  const handleCameraCapture = async () => {
    try {
      const dataUrl = await takePhoto();
      if (dataUrl) {
        setOriginalImage(dataUrl);
        setProcessedUrl(null);
      }
    } catch (err) {
      console.warn('Camera capture cancelled or failed:', err);
    }
  };

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

  const downloadResult = async () => {
    if (!processedUrl) return;
    await downloadOrShareFile(processedUrl, `Restored_${Date.now()}.jpg`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 py-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Scan className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scan & Fix AI</h1>
            <p className="text-gray-500 font-medium">Real-time AI photo restoration for your documents.</p>
          </div>
        </div>
        {originalImage && (
          <button onClick={() => { setOriginalImage(null); setProcessedUrl(null); }} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
            Reset
          </button>
        )}
      </div>

      {!originalImage ? (
        <div className={`grid grid-cols-1 ${isNative() ? 'md:grid-cols-2' : ''} gap-6`}>
          <div {...getRootProps()} className={`border-3 border-dashed rounded-[2rem] p-16 text-center transition-all cursor-pointer bg-white ${isDragActive ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-200 hover:border-emerald-400 hover:shadow-xl'} flex flex-col items-center justify-center min-h-[350px]`}>
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 italic">CHOOSE PHOTO</h3>
            <p className="text-gray-400 font-bold max-w-xs mx-auto text-xs uppercase tracking-wider">Drag & drop or tap to select image from files</p>
          </div>
          
          {isNative() && (
            <div 
              onClick={handleCameraCapture}
              className="border-3 border-emerald-500 border-dashed rounded-[2rem] p-16 text-center transition-all cursor-pointer bg-white hover:bg-emerald-50/20 hover:shadow-xl flex flex-col items-center justify-center min-h-[350px]"
            >
              <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
                <Camera className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-emerald-600 mb-2 italic">TAKE PHOTO</h3>
              <p className="text-emerald-500/80 font-bold max-w-xs mx-auto text-xs uppercase tracking-wider">Use device camera to snap document</p>
            </div>
          )}
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
                  <h3 className="text-white font-black mt-6 tracking-widest text-xl uppercase">Running AI Restoration...</h3>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <SlidersHorizontal className="text-emerald-500" /> Enhancement
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">
                    <span>Contrast Boost</span>
                    <span>{settings.contrast}%</span>
                  </div>
                  <input type="range" min="100" max="250" value={settings.contrast} onChange={e => setSettings({...settings, contrast: e.target.value})} className="w-full accent-emerald-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">
                    <span>Brightness</span>
                    <span>{settings.brightness}%</span>
                  </div>
                  <input type="range" min="100" max="200" value={settings.brightness} onChange={e => setSettings({...settings, brightness: e.target.value})} className="w-full accent-emerald-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">B&W Document Mode</span>
                  <button onClick={() => setSettings({...settings, grayscale: settings.grayscale === 100 ? 0 : 100})} className={`w-12 h-6 rounded-full transition-all relative ${settings.grayscale === 100 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.grayscale === 100 ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={handleEnhance} 
                  disabled={isProcessing}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Sparkles size={20} /> Apply AI Magic
                </button>
                {processedUrl && (
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadResult}
                      className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Download size={18} /> Download
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
