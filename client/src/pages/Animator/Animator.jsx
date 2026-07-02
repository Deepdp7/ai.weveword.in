import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Video, Music, Settings, Type, Loader2, Sparkles, CheckCircle2, Palette, Smartphone, Cloud, Zap } from 'lucide-react';
import VoiceDictationButton from '../../components/VoiceDictationButton';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:5000/api`;
const API = `${API_BASE}/animator`;
axios.defaults.withCredentials = true;

const BACKGROUNDS = [
  { id: 'clean', name: 'Clean White', bg: '#ffffff', text: '#111827', accent: '#f9fafb' },
  { id: 'vintage', name: 'Vintage Paper', bg: '#fdf6e3', text: '#1f2937', accent: '#fef3c7' },
  { id: 'dark', name: 'Dark Studio', bg: '#111827', text: '#f9fafb', accent: '#1f2937' },
  { id: 'grid', name: 'Engineering Grid', bg: '#f8fafc', text: '#1e293b', accent: '#ecfdf5' }
];

const FONTS = [
  "Caveat", "Dancing Script", "Pacifico", "Satisfy", "Alex Brush",
  "Great Vibes", "Pinyon Script", "Amatic SC", "Cookie", "Courgette",
  "Indie Flower", "Kalam", "Kaushan Script", "Parisienne", "Patrick Hand",
  "Permanent Marker", "Playball", "Sacramento", "Shadows Into Light",
  "Tangerine", "Yellowtail"
];

const FORMATS = [
  { id: '9:16', name: 'Instagram Reel', ratioText: '9/16', width: 720, height: 1280, icon: 'smartphone' },
  { id: '16:9', name: 'YouTube Video', ratioText: '16/9', width: 1280, height: 720, icon: 'video' },
  { id: '1:2.16', name: 'Phone Screen', ratioText: '1/2.16', width: 1080, height: 2332, icon: 'smartphone' }
];

const CustomSlider = ({ label, value, setValue, theme = "purple", min = 0, max = 100, displayValue }) => {
  const colorMap = {
    purple: { bg: "bg-purple-600", text: "text-purple-600" },
    gray: { bg: "bg-slate-600", text: "text-slate-700" }
  };
  const colors = colorMap[theme];
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <span className={`text-[10px] font-black ${colors.text}`}>{displayValue || `${value}%`}</span>
      </div>
      <div className="relative w-full h-2 bg-slate-100 rounded-full flex items-center">
        <div className={`absolute h-2 rounded-full ${colors.bg}`} style={{ width: `${percentage}%` }} />
        <input 
          type="range" min={min} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div 
          className={`w-4 h-4 rounded-full shadow-md ${colors.bg} absolute pointer-events-none transition-transform`} 
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

export default function Animator() {
  const [script, setScript] = useState("Hello Waveword AI!\n\nThis is a real Writing Animator.\nIt renders your text into an MP4 video!");
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(48);
  
  const [speed, setSpeed] = useState(50); 
  const [speedJitter, setSpeedJitter] = useState(20);
  const [pressureVar, setPressureVar] = useState(30);
  const [randomMistakes, setRandomMistakes] = useState(5);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);

  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animationRef = useRef(null);

  const getPseudoRandom = (index) => {
    const x = Math.sin(index * 9999) * 10000;
    return x - Math.floor(x);
  };

  const renderWriting = (ctx, text, progress, isRecording = false) => {
    const { width, height } = format;
    
    ctx.fillStyle = bg.bg;
    ctx.fillRect(0, 0, width, height);

    if (bg.id === 'grid') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
      for (let i = 0; i < height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
      ctx.stroke();
    }

    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.textBaseline = 'top';

    const padding = fontSize * 1.5;
    const maxWidth = width - (padding * 2);
    const paragraphs = text.split('\n');
    let lines = [];

    for (let paragraph of paragraphs) {
      if (!paragraph) {
        lines.push("");
        continue;
      }
      
      let currentLine = "";
      const words = paragraph.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine === "" ? word : currentLine + " " + word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > maxWidth && i > 0) {
          lines.push(currentLine + " ");
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    let charCount = 0;
    let y = padding;

    for (let line of lines) {
      let x = padding;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (charCount < progress) {
          const rand = getPseudoRandom(charCount);
          const pVar = pressureVar / 100;
          ctx.globalAlpha = 1 - (rand * pVar * 0.7); 
          ctx.fillStyle = bg.text;
          
          const mVar = randomMistakes / 100;
          const jitterX = (getPseudoRandom(charCount + 100) - 0.5) * 20 * mVar;
          const jitterY = (getPseudoRandom(charCount + 200) - 0.5) * 20 * mVar;
          
          ctx.fillText(char, x + jitterX, y + jitterY);
          
          x += ctx.measureText(char).width;
          charCount++;
        }
      }
      y += fontSize * 1.5;
    }
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    // Re-render when background changes to show preview
    if (!isPlaying && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      renderWriting(ctx, script, script.length);
    }
  }, [bg, format, script, speedJitter, pressureVar, randomMistakes, fontFamily, fontSize]);

  const startAnimation = (isRecording = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let progress = 0;
    const totalChars = script.length;
    
    const animate = () => {
      if (progress <= totalChars) {
        renderWriting(ctx, script, progress, isRecording);
        
        const baseRate = 0.1 + (speed / 100) * 1.4;
        const sJitter = speedJitter / 100;
        const currentJitter = 1 + (Math.random() - 0.5) * 2 * sJitter; 
        
        progress += Math.max(0.01, baseRate * currentJitter);
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

  const handleExport = async (type) => {
    setIsExporting(true);
    setExportType(type);
    setExportProgress(10);

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30); 
    
    recorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 
    });

    chunksRef.current = [];
    recorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    
    recorderRef.current.onstop = async () => {
      setExportProgress(70);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      if (type === 'download') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'waveword-ai-animation.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          setExportType(null);
        }, 1000);
      } else {
        const formData = new FormData();
        formData.append('video', blob, 'animation.webm');

        try {
          const { data } = await axios.post(`${API}/save`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setExportProgress(100);
          setTimeout(() => {
            setIsExporting(false);
            setExportType(null);
            alert('Video rendered and saved to Cloud Library!');
            window.open(data.url, '_blank');
          }, 1000);
        } catch (err) {
          alert('Export failed. Please try again.');
          setIsExporting(false);
          setExportType(null);
        }
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Writing Animator</h1>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-md">
                <Zap size={14} className="text-yellow-400 fill-current" />
                <span className="text-[10px] font-black tracking-tight uppercase">Cost: 15 Credits</span>
              </div>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Pro-grade handwriting video generator for social media.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
            
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex justify-between items-center w-full">
                <span className="flex items-center gap-2"><Type className="w-4 h-4"/> Video Script</span>
                <VoiceDictationButton 
                  onTranscription={(newText) => setScript(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + newText)} 
                />
              </label>
              <textarea 
                rows="4"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 text-sm font-medium resize-none shadow-inner"
                placeholder="Type your script here..."
              ></textarea>
            </div>

            {/* Choose Format Section */}
            <div className="space-y-4">
              <label className="text-xs font-black text-purple-400 flex items-center gap-2 uppercase tracking-widest">
                <Smartphone className="w-4 h-4" /> Choose Format
              </label>
              <div className="flex flex-col gap-3">
                {FORMATS.map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setFormat(f)}
                    className={`flex items-center justify-between py-4 px-6 rounded-2xl transition-all ${format.id === f.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      {f.icon === 'smartphone' ? <Smartphone className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      <span className={`font-black uppercase tracking-wider text-sm ${format.id === f.id ? 'text-white' : 'text-slate-800'}`}>{f.name}</span>
                    </div>
                    <span className={`text-[10px] font-black ${format.id === f.id ? 'text-slate-400' : 'text-slate-400'}`}>{f.ratioText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Section */}
            <div className="space-y-4">
              <label className="text-xs font-black text-purple-400 flex items-center gap-2 uppercase tracking-widest">
                <Type className="w-4 h-4" /> Typography
              </label>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Style</label>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {FONTS.map((font) => (
                    <button 
                      key={font}
                      onClick={() => setFontFamily(font)}
                      className={`flex items-center justify-center py-4 px-4 rounded-2xl border-2 transition-all text-2xl ${fontFamily === font ? 'bg-purple-50 border-purple-400 text-slate-900' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'}`}
                      style={{ fontFamily: `"${font}", cursive` }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <CustomSlider label="Size" value={fontSize} setValue={setFontSize} theme="purple" min={20} max={120} displayValue={`${fontSize}px`} />
              </div>
            </div>

            {/* Background Style Section */}
            <div className="space-y-4">
              <label className="text-xs font-black text-purple-400 flex items-center gap-2 uppercase tracking-widest">
                <Palette className="w-4 h-4" /> Background Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BACKGROUNDS.map((b) => (
                  <button 
                    key={b.id}
                    onClick={() => setBg(b)}
                    className={`flex flex-col items-center justify-center gap-2 py-3 px-3 rounded-2xl border-2 transition-all bg-white shadow-sm hover:shadow-md ${bg.id === b.id ? 'border-purple-500 ring-4 ring-purple-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-full h-3 rounded-full" style={{ backgroundColor: b.accent }} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Speed */}
            <div className="pt-2">
              <CustomSlider label="Writing Speed" value={speed} setValue={setSpeed} theme="purple" />
            </div>

            <hr className="border-slate-100" />

            {/* Human Jitter Section */}
            <div className="space-y-6">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-purple-500" /> Human Jitter
              </label>
              
              <CustomSlider label="Speed Jitter" value={speedJitter} setValue={setSpeedJitter} theme="gray" />
              <CustomSlider label="Pressure Var" value={pressureVar} setValue={setPressureVar} theme="gray" />
              <CustomSlider label="Random Mistakes" value={randomMistakes} setValue={setRandomMistakes} theme="gray" />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => startAnimation(false)}
                disabled={isPlaying || isExporting}
                className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {isPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current"/>} 
                {isPlaying ? "Playing..." : "Preview"}
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
                     <span>{exportType === 'download' ? 'Processing Download...' : 'Saving to Cloud...'}</span>
                     <span>{exportProgress}%</span>
                   </div>
                   <div className="w-full bg-rose-400/30 rounded-full h-3 overflow-hidden">
                     <div className="bg-white h-full transition-all duration-500" style={{ width: `${exportProgress}%`}}></div>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col sm:flex-row gap-3 pt-2">
                   <button 
                    onClick={() => handleExport('download')}
                    disabled={isPlaying}
                    className="flex-1 py-4 bg-white text-rose-600 font-black rounded-2xl hover:bg-rose-50 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
                   >
                     <Download className="w-4 h-4" /> Download
                   </button>
                   <button 
                    onClick={() => handleExport('cloud')}
                    disabled={isPlaying}
                    className="flex-1 py-4 bg-rose-800 text-white font-black rounded-2xl hover:bg-rose-900 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 border border-rose-700"
                   >
                     <Cloud className="w-4 h-4" /> Save to Cloud
                   </button>
                 </div>
               )}
             </div>
             <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Live Preview Monitor */}
        <div className="lg:col-span-8">
          <div className="sticky top-8 bg-slate-900 rounded-3xl lg:rounded-[3rem] p-4 lg:p-12 flex flex-col items-center justify-center overflow-hidden h-[500px] lg:h-[calc(100vh-4rem)] min-h-[400px] lg:min-h-[600px] border-4 lg:border-[12px] border-white shadow-2xl relative">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/60 text-[10px] font-black uppercase tracking-[0.2em] z-10">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
              Monitor Output
            </div>

            <div className="relative w-full h-full flex items-center justify-center mt-8">
               <canvas 
                ref={canvasRef}
                width={format.width}
                height={format.height}
                className="max-w-full max-h-full shadow-2xl bg-white rounded-lg transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
