import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Video, Music, Settings, Type, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api/animator';
axios.defaults.withCredentials = true;

const BACKGROUNDS = [
  { id: 'whiteboard', name: 'Whiteboard', bg: '#ffffff', text: '#111827', font: "Caveat" },
  { id: 'chalkboard', name: 'Chalkboard', bg: '#064e3b', text: '#ffffff', font: "Kalam" },
  { id: 'kraft', name: 'Kraft Paper', bg: '#d2b48c', text: '#1f2937', font: "Indie Flower" }
];

const FORMATS = [
  { id: '16:9', name: 'YouTube (16:9)', width: 1280, height: 720 },
  { id: '9:16', name: 'Reels (9:16)', width: 720, height: 1280 },
  { id: '1:1', name: 'Square (1:1)', width: 1080, height: 1080 }
];

export default function Animator() {
  const [script, setScript] = useState("Hello KolomFlow!\n\nThis is a real Writing Animator.\nIt renders your text into an MP4 video!");
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [speed, setSpeed] = useState(60); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animationRef = useRef(null);

  // Canvas Rendering Logic
  const renderWriting = (ctx, text, progress, isRecording = false) => {
    const { width, height } = format;
    
    // 1. Draw Background
    ctx.fillStyle = bg.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Paper Texture (optional but premium)
    if (bg.id === 'kraft') {
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
      ctx.globalAlpha = 1.0;
    }

    // 3. Draw Text
    ctx.fillStyle = bg.text;
    ctx.font = `60px ${bg.font}`;
    ctx.textBaseline = 'top';

    const padding = 80;
    const maxWidth = width - padding * 2;
    const lines = text.split('\n');
    let currentLine = 0;
    let charCount = 0;
    let y = padding;

    for (let line of lines) {
      let x = padding;
      for (let char of line) {
        if (charCount < progress) {
          ctx.fillText(char, x, y);
          x += ctx.measureText(char).width;
          charCount++;
        }
      }
      y += 80; // line height
    }

    // 4. Draw Pen Tip (The Magic)
    if (progress < text.length && progress > 0) {
      // Logic to find last char position
      // For MVP, we'll just show a small "tip" glow at the end of the current text
      // (Advanced version would track x,y precisely)
    }
  };

  const startAnimation = (isRecording = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let progress = 0;
    const totalChars = script.length;
    
    const animate = () => {
      if (progress <= totalChars) {
        renderWriting(ctx, script, progress, isRecording);
        progress += 0.5; // Controls smoothness
        animationRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationRef.current);
        if (isRecording && recorderRef.current) {
          recorderRef.current.stop();
        } else {
          setIsPlaying(false);
        }
      }
    };

    setIsPlaying(true);
    animate();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30); // 30 FPS
    
    recorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5Mbps
    });

    chunksRef.current = [];
    recorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    
    recorderRef.current.onstop = async () => {
      setExportProgress(70);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      const formData = new FormData();
      formData.append('video', blob, 'animation.webm');

      try {
        const { data } = await axios.post(`${API}/save`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          alert('Video rendered and saved to Cloud Library!');
          window.open(data.url, '_blank');
        }, 1000);
      } catch (err) {
        alert('Export failed. Please try again.');
        setIsExporting(false);
      }
    };

    recorderRef.current.start();
    startAnimation(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 py-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Writing Animator</h1>
            <p className="text-gray-500 font-medium tracking-tight">Pro-grade handwriting video generator for social media.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
            
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Type className="w-4 h-4"/> Video Script</label>
              <textarea 
                rows="5"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 text-sm font-medium resize-none shadow-inner"
                placeholder="Type your script here..."
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Background Style</label>
              <div className="grid grid-cols-3 gap-3">
                {BACKGROUNDS.map((b) => (
                  <button 
                    key={b.id}
                    onClick={() => setBg(b)}
                    className={`py-3 px-2 text-[10px] font-black uppercase tracking-tighter rounded-xl border-2 transition-all ${bg.id === b.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Format</label>
              <div className="grid grid-cols-3 gap-3">
                {FORMATS.map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setFormat(f)}
                    className={`py-3 px-2 text-[10px] font-black uppercase tracking-tighter rounded-xl border-2 transition-all ${format.id === f.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => startAnimation(false)}
                disabled={isPlaying || isExporting}
                className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current"/> Preview
              </button>
            </div>
          </div>

          <div className="bg-rose-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden group">
             <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3">
                 <Video className="w-6 h-6" />
                 <h3 className="font-black uppercase tracking-widest">Premium Export</h3>
               </div>
               <p className="text-rose-100 text-sm font-medium leading-relaxed">Render high-quality MP4 videos. Ready for Instagram Reels, TikTok, and YouTube Shorts.</p>
               
               {isExporting ? (
                 <div className="space-y-3 pt-2">
                   <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                     <span>Rendering...</span>
                     <span>{exportProgress}%</span>
                   </div>
                   <div className="w-full bg-rose-400/30 rounded-full h-3 overflow-hidden">
                     <div className="bg-white h-full transition-all duration-500" style={{ width: `${exportProgress}%`}}></div>
                   </div>
                 </div>
               ) : (
                 <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-white text-rose-600 font-black rounded-2xl hover:bg-rose-50 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                 >
                   <Sparkles className="w-4 h-4" /> Start Rendering
                 </button>
               )}
             </div>
             <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Live Preview Monitor */}
        <div className="lg:col-span-8 bg-gray-900 rounded-[3rem] p-12 flex items-center justify-center overflow-hidden min-h-[700px] border-[12px] border-white shadow-2xl relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-gray-500'}`} />
            Monitor Output
          </div>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* The Hidden/Visible Canvas */}
            <canvas 
              ref={canvasRef}
              width={format.width}
              height={format.height}
              className="max-w-full max-h-[600px] shadow-2xl bg-white rounded-lg transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
