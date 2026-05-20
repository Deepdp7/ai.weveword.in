import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, Card } from "../../components/ui";
import {
  Download,
  Settings2,
  Type,
  Layout,
  Upload,
  HardDrive,
  ChevronDown,
  FileUp,
  Highlighter,
  Sparkles as SparklesIcon,
  Loader2,
  PenTool,
  FileStack,
  Cloud,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/toastStore";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";

const FONTS = [
  { name: "Dancing Script", family: "'Dancing Script', cursive" },
  { name: "Pacifico", family: "'Pacifico', cursive" },
  { name: "Caveat", family: "'Caveat', cursive" },
  { name: "Satisfy", family: "'Satisfy', cursive" },
  { name: "Homemade Apple", family: "'Homemade Apple', cursive" },
  { name: "Great Vibes", family: "'Great Vibes', cursive" },
  { name: "Alex Brush", family: "'Alex Brush', cursive" },
  { name: "Rock Salt", family: "'Rock Salt', cursive" },
  { name: "Covered By Your Grace", family: "'Covered By Your Grace', cursive" },
  { name: "Shadows Into Light", family: "'Shadows Into Light', cursive" },
  { name: "Reenie Beanie", family: "'Reenie Beanie', cursive" },
  { name: "Indie Flower", family: "'Indie Flower', cursive" },
  { name: "Permanent Marker", family: "'Permanent Marker', cursive" },
  { name: "Kalam", family: "'Kalam', cursive" },
  { name: "Patrick Hand", family: "'Patrick Hand', cursive" },
  { name: "Amatic SC", family: "'Amatic SC', cursive" },
  { name: "Coming Soon", family: "'Coming Soon', cursive" },
  { name: "Gochi Hand", family: "'Gochi Hand', cursive" },
  { name: "Just Me Again Down Here", family: "'Just Me Again Down Here', cursive" },
  { name: "Marck Script", family: "'Marck Script', cursive" },
  { name: "Neucha", family: "'Neucha', cursive" },
  { name: "Pangolin", family: "'Pangolin', cursive" },
  { name: "Sue Ellen Francisco", family: "'Sue Ellen Francisco', cursive" },
];

export default function Studio() {
  const [engine, setEngine] = useState("local");
  const [inkType, setInkType] = useState("gel");
  const [text, setText] = useState(
    'Welcome to KolomFlow Studio!\n\nThis is where you can convert your typed text into realistic handwriting. Try changing the paper style or ink color to see how it looks.',
  );
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pages, setPages] = useState([]);
  const [previewPages, setPreviewPages] = useState([]);
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [inkColor, setInkColor] = useState("#1e3a8a");
  const [isHumanized, setIsHumanized] = useState(true);
  const [showMargin, setShowMargin] = useState(true);
  const [pageSize, setPageSize] = useState("a4");
  const [pageTheme, setPageTheme] = useState("school");
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [showImportMenu, setShowImportMenu] = useState(false);
  const importMenuRef = useRef(null);

  const { user } = useAuth();
  const { addToast, clearToasts } = useToast();

  const PAGE_CONFIGS = {
    a4: { w: 794, h: 1123, name: "A4 Standard" },
    letter: { w: 816, h: 1056, name: "Letter" },
    a3: { w: 1123, h: 1587, name: "A3 Large" },
    legal: { w: 816, h: 1344, name: "Legal" },
  };

  const currentConfig = PAGE_CONFIGS[pageSize] || PAGE_CONFIGS.a4;

  const triggerSuccessEffect = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const INK_STYLES = {
    gel: { filter: "none", opacity: 1 },
    fountain: { filter: "url(#ink-bleed)", opacity: 0.95 },
    pencil: { filter: "url(#pencil-texture)", opacity: 0.8 },
    marker: { filter: "url(#marker-glow)", opacity: 0.85 },
  };

  const getThemeStyles = (theme) => {
    const lh = fontSize * lineHeight;
    switch (theme) {
      case 'school':
        return { 
          backgroundColor: '#ffffff',
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${lh - 1}px, rgba(59, 130, 246, 0.2) ${lh - 1}px, rgba(59, 130, 246, 0.2) ${lh}px)`,
          backgroundSize: `100% ${lh}px`,
          backgroundPosition: `0 ${80 + lh}px`
        };
      case 'engineering':
        return { 
          backgroundColor: '#ffffff',
          backgroundImage: `linear-gradient(#10b98122 1px, transparent 1px), linear-gradient(90deg, #10b98122 1px, transparent 1px)`, 
          backgroundSize: '20px 20px' 
        };
      case 'vintage':
        return { backgroundColor: '#fdf6e3' };
      case 'burnt':
        return { backgroundColor: '#c19a6b', boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)' };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  const getJitter = useCallback((index) => {
    if (!isHumanized) return { x: 0, y: 0 };
    const random = Math.sin(index * 1234.5678) * 10000;
    const val = random - Math.floor(random);
    return {
      x: (val - 0.5) * 2,
      y: (Math.cos(index * 9876.54) - 0.5) * 2
    };
  }, [isHumanized]);

  const generatePages = useCallback(() => {
    if (!text.trim()) return [];
    
    const width = currentConfig.w;
    const height = currentConfig.h;
    const marginX = 100; // left 100, right 60
    const marginY = 80;
    const lhPx = fontSize * lineHeight;
    const maxLines = Math.max(1, Math.floor((height - marginY * 2) / lhPx));
    
    const paragraphs = text.split(/\r?\n/);
    const newPages = [];
    let currentPageLines = [];
    let lineCount = 0;
    
    const avgCharWidth = fontSize * 0.5 + letterSpacing;
    const maxCharsPerLine = Math.floor((width - marginX - 60) / avgCharWidth);

    for (let para of paragraphs) {
      if (!para.trim()) {
        currentPageLines.push("");
        lineCount++;
        if (lineCount >= maxLines) {
          newPages.push([...currentPageLines]);
          currentPageLines = [];
          lineCount = 0;
        }
        continue;
      }
      
      const words = para.split(/\s+/);
      let currentLine = "";
      
      for (let word of words) {
        if ((currentLine + word).length > maxCharsPerLine && currentLine.length > 0) {
          currentPageLines.push(currentLine.trimEnd());
          currentLine = word + " ";
          lineCount++;
          
          if (lineCount >= maxLines) {
            newPages.push([...currentPageLines]);
            currentPageLines = [];
            lineCount = 0;
          }
        } else {
          currentLine += word + " ";
        }
      }
      
      if (currentLine) {
        currentPageLines.push(currentLine.trimEnd());
        lineCount++;
        if (lineCount >= maxLines) {
          newPages.push([...currentPageLines]);
          currentPageLines = [];
          lineCount = 0;
        }
      }
    }
    
    if (currentPageLines.length > 0) {
      newPages.push([...currentPageLines]);
    }
    
    return newPages;
  }, [text, fontSize, lineHeight, letterSpacing, pageSize]);

  useEffect(() => {
    setPages(generatePages());
  }, [generatePages]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    addToast("Generating your masterpiece...", "loading");
    try {
      const { data } = await axios.post('http://localhost:5000/api/studio/render', {
        text,
        color: inkColor,
        paperStyle: pageTheme,
        fontSize,
        letterSpacing,
        wordSpacing,
        fontFamily: font.name,
        showMargin,
        isHumanized,
        pageSize
      });
      
      setPreviewPages(data.pages);
      clearToasts();
      addToast("Preview generated!", "success");
    } catch (error) {
      console.error('Failed to generate handwriting:', error);
      addToast('Failed to generate preview. Please try again.', "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (type = 'download') => {
    if (engine === 'local') {
      await handleExportLocal(type);
    } else {
      await handleExportServer(type);
    }
  };

  const handleExportLocal = async (type = 'download') => {
    if (pages.length === 0) return;
    
    setIsExporting(true);
    addToast(type === 'download' ? "Generating high-quality PDF..." : "Saving to Cloud Library...", "loading");
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [currentConfig.w, currentConfig.h]
      });
      
      const pageElements = document.querySelectorAll('.pdf-export-page');
      
      for (let i = 0; i < pageElements.length; i++) {
        const imgData = await toJpeg(pageElements[i], {
          pixelRatio: 2,
          quality: 0.95,
          width: currentConfig.w,
          height: currentConfig.h,
          style: {
            transform: 'none',
            margin: '0',
            padding: '0'
          },
          backgroundColor: pageTheme === 'vintage' ? '#fdf6e3' : pageTheme === 'burnt' ? '#c19a6b' : '#ffffff',
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, currentConfig.w, currentConfig.h);
      }
      
      if (type === 'download') {
        pdf.save(`KolomFlow_${Date.now()}.pdf`);
        clearToasts();
        addToast("PDF Downloaded successfully!", "success");
        triggerSuccessEffect();
      } else {
        const blob = pdf.output('blob');
        const uploadData = new FormData();
        uploadData.append('file', new File([blob], `KolomFlow_${Date.now()}.pdf`, { type: 'application/pdf' }));
        uploadData.append('toolSource', 'studio');
        await axios.post('http://localhost:5000/api/files/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
        clearToasts();
        addToast("PDF Saved to Cloud successfully!", "success");
        triggerSuccessEffect();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      addToast('Failed to export PDF. Please try again.', "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportServer = async (type = 'download') => {
    if (!text.trim()) return;
    
    setIsExporting(true);
    addToast(type === 'download' ? "Downloading PDF from Cloud..." : "Saving PDF to Cloud Library...", "loading");
    
    try {
      const response = await axios.post('http://localhost:5000/api/studio/export-pdf', {
        text,
        color: inkColor,
        paperStyle: pageTheme,
        fontSize,
        letterSpacing,
        wordSpacing,
        fontFamily: font.name,
        showMargin,
        isHumanized,
        pageSize
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      if (type === 'download') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `KolomFlow_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        clearToasts();
        addToast("PDF Downloaded successfully!", "success");
        triggerSuccessEffect();
      } else {
        const uploadData = new FormData();
        uploadData.append('file', new File([blob], `KolomFlow_${Date.now()}.pdf`, { type: 'application/pdf' }));
        uploadData.append('toolSource', 'studio');
        await axios.post('http://localhost:5000/api/files/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        clearToasts();
        addToast("PDF Saved to Cloud successfully!", "success");
        triggerSuccessEffect();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      addToast('Failed to export PDF. Please try again.', "error");
    } finally {
      setIsExporting(false);
    }
  };

  const enhanceText = async () => {
    if (!text || text.length < 10) {
      addToast("Please provide more text to enhance.", "info");
      return;
    }

    setIsEnhancing(true);
    addToast("AI is analyzing and structuring your notes...", "loading");

    setTimeout(() => {
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const title = lines[0].toUpperCase();

      const enhanced =
        `📝 ${title}\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🚀 KEY HIGHLIGHTS:\n` +
        `• ${lines[1] || "Important concept"}\n` +
        `• ${lines[2] || "Critical detail"}\n` +
        `• ${lines[3] || "Action item"}\n\n` +
        `💡 HANDWRITTEN SUMMARY:\n` +
        `${text.substring(0, 150)}...\n\n` +
        `🔖 TAGS: #SmartNotes #Handwriting #Summary`;

      setText(enhanced);
      setIsEnhancing(false);
      clearToasts();
      addToast("Notes enhanced successfully!", "success");
    }, 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);

    addToast("Extracting text from document...", "loading");
    try {
      const { data } = await axios.post('http://localhost:5000/api/studio/extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setText(data.text);
      clearToasts();
      addToast("Document imported!", "success");
      setShowImportMenu(false);
    } catch (error) {
      addToast('Failed to extract text. Please ensure it is a valid .docx or .txt file.', "error");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target)) {
        setShowImportMenu(false);
      }
    };
    if (showImportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showImportMenu]);

  const PagePreview = ({ lines, isExport, pageIndex }) => (
    <div 
      className={isExport ? "pdf-export-page" : "bg-white shadow-2xl rounded-sm border border-slate-200 transition-all duration-500 group flex-shrink-0"}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: `${currentConfig.w}px`,
        height: `${currentConfig.h}px`,
        transform: isExport ? 'none' : 'scale(1)', 
        ...getThemeStyles(pageTheme)
      }}
    >
      {showMargin && <div style={{ position: 'absolute', left: '80px', top: '0', bottom: '0', width: '2px', backgroundColor: 'rgba(248, 113, 113, 0.5)' }} />}
      
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          paddingTop: '80px',
          paddingLeft: '100px',
          paddingRight: '60px',
          fontFamily: font.family,
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          color: inkColor,
          letterSpacing: `${letterSpacing}px`,
          wordSpacing: `${wordSpacing}px`,
          ...INK_STYLES[inkType]
        }}
      >
        {lines.map((line, lIdx) => {
          const jitter = getJitter(pageIndex * 100 + lIdx);
          return (
            <div 
              key={lIdx} 
              style={{ 
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                minHeight: `${fontSize * lineHeight}px`,
                transform: `translate(${jitter.x}px, ${jitter.y}px)` 
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
      
      {!isExport && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-50">
          Page {pageIndex + 1}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-6 relative">
        {showMobilePanel && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowMobilePanel(false)} />
        )}

        {/* Tools Panel */}
        <div className={`
            fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto
            bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out
            lg:static lg:max-h-full lg:z-auto lg:rounded-none lg:shadow-none lg:bg-transparent
            lg:w-80 lg:flex-shrink-0 lg:overflow-y-auto lg:translate-y-0
            ${showMobilePanel ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
          `}>
          <div className="lg:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          <div className="p-4 lg:p-0 space-y-4 lg:space-y-6 pb-8 lg:pb-0">
            <Card className="space-y-4 shadow-xl border-blue-100 shadow-blue-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600" /> Effects & Export
              </h3>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isHumanized ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className="text-sm font-medium">Human Jitter</span>
                </div>
                <input type="checkbox" checked={isHumanized} onChange={(e) => setIsHumanized(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
              </label>

              <div className="relative" ref={importMenuRef}>
                <input type="file" accept=".txt,.docx" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <button onClick={() => setShowImportMenu(!showImportMenu)} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm h-11 px-4 text-sm font-medium transition-all active:scale-95 cursor-pointer ${showImportMenu ? "ring-2 ring-blue-500/30 border-blue-300" : ""}`}>
                  <FileUp className="w-4 h-4" /> Import Document
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${showImportMenu ? "rotate-180" : ""}`} />
                </button>

                {showImportMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-blue-100/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1.5">
                      <button onClick={() => document.getElementById("file-upload")?.click()} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-blue-50/80 transition-all group cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-50 group-hover:border-blue-200 transition-all shadow-sm">
                          <HardDrive className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">Local File</p>
                          <p className="text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors">.txt, .docx</p>
                        </div>
                        <Upload className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 mt-2 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendering Engine</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setEngine("local")} 
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        engine === "local" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Local
                    </button>
                    <button 
                      onClick={() => setEngine("server")} 
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        engine === "server" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      AI Cloud
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button className="flex-1 justify-center gap-2 h-14 text-[10px] font-black uppercase tracking-widest bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => handleExport('download')} disabled={isExporting || isGenerating}>
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button className="flex-1 justify-center gap-2 h-14 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={() => handleExport('cloud')} disabled={isExporting || isGenerating}>
                    <Cloud className="w-4 h-4" /> Save Cloud
                  </Button>
                </div>
                {engine === "local" ? (
                  <Button className="justify-center gap-3 h-14 text-sm font-black uppercase tracking-widest w-full bg-slate-900 hover:bg-black text-white border-none" onClick={() => addToast("Preview updates automatically!", "success")} disabled={isExporting}>
                    <RefreshCw className="w-5 h-5" /> Auto Preview On
                  </Button>
                ) : (
                  <Button className="justify-center gap-3 h-14 text-sm font-black uppercase tracking-widest w-full bg-slate-900 hover:bg-black text-white border-none shadow-lg shadow-slate-200" onClick={handleGenerate} disabled={isExporting || isGenerating}>
                    <RefreshCw className={cn("w-5 h-5", isGenerating && "animate-spin")} /> {isGenerating ? "Rendering..." : "Generate Preview"}
                  </Button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-blue-600">AI Productivity</h4>
                <Button className="w-full justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-200 border-none h-11 text-white" onClick={enhanceText} disabled={isEnhancing}>
                  {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />} AI Notes Enhancer
                </Button>
              </div>
            </Card>

            <Card className="space-y-4 bg-white/80 backdrop-blur-sm border-blue-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Layout className="w-4 h-4 text-blue-600" /> Page Setup</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Size</label>
                    <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                      <option value="a4">A4 Standard</option>
                      <option value="letter">Letter</option>
                      <option value="a3">A3 Large</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ink Color</label>
                    <div className="flex items-center gap-2 h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <input type="color" value={inkColor} onChange={(e) => setInkColor(e.target.value)} className="w-full h-5 cursor-pointer bg-transparent" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Notebook Themes</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: "plain", name: "Plain", color: "bg-white" },
                      { id: "school", name: "School", color: "bg-[repeating-linear-gradient(transparent,transparent_4px,#3b82f6_4px,#3b82f6_5px)]" },
                      { id: "engineering", name: "Engineer", color: "bg-[linear-gradient(#10b981_1px,transparent_1px),linear-gradient(90deg,#10b981_1px,transparent_1px)] bg-[size:4px_4px]" },
                      { id: "vintage", name: "Vintage", color: "bg-orange-100" },
                      { id: "burnt", name: "Burnt", color: "bg-[#c19a6b] shadow-inner" },
                    ].map((t) => (
                      <button key={t.id} onClick={() => setPageTheme(t.id)} className={`h-10 rounded-lg border-2 transition-all overflow-hidden cursor-pointer ${pageTheme === t.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-100 bg-white"}`} title={t.name}>
                        <div className={`w-full h-full ${t.color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ink Realism</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "gel", name: "Gel Pen", icon: PenTool },
                      { id: "fountain", name: "Fountain", icon: SparklesIcon },
                      { id: "pencil", name: "Pencil", icon: Highlighter },
                      { id: "marker", name: "Marker", icon: Type },
                    ].map((style) => (
                      <button key={style.id} onClick={() => setInkType(style.id)} className={cn("p-2.5 rounded-lg border-2 flex items-center gap-2 transition-all cursor-pointer", inkType === style.id ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-50 text-slate-500 hover:border-slate-100")}>
                        <style.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50/30 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-blue-100 shadow-sm flex-shrink-0">
                      <div className="w-[2px] h-4 bg-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Notebook Margin</p>
                      <p className="text-[9px] text-slate-500 italic">Classic red line</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMargin(!showMargin)} className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${showMargin ? "bg-blue-600" : "bg-slate-300"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${showMargin ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Type className="w-4 h-4" /> Typography</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Font Style</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={font.name} onChange={(e) => setFont(FONTS.find((f) => f.name === e.target.value) || FONTS[0])}>
                    {FONTS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex justify-between">Size <span>{fontSize}px</span></label>
                    <input type="range" min="12" max="48" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-blue-600 h-5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex justify-between">Letter Spacing <span>{letterSpacing}</span></label>
                    <input type="range" min="-2" max="10" step="0.5" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full accent-blue-600 h-5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex justify-between">Word Spacing <span>{wordSpacing}</span></label>
                    <input type="range" min="-5" max="20" step="1" value={wordSpacing} onChange={(e) => setWordSpacing(Number(e.target.value))} className="w-full accent-blue-600 h-5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex justify-between">Line Height <span>{lineHeight}</span></label>
                    <input type="range" min="1.0" max="2.5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-blue-600 h-5" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Editor & Preview Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50/50">
          <div className="lg:hidden bg-white border-b border-slate-200/60 p-4 flex items-center justify-between">
            <button onClick={() => setShowMobilePanel(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg">
              <Settings2 className="w-3.5 h-3.5" /> Settings
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 font-black text-[9px] uppercase">
              <Zap size={10} className="fill-current" /> {engine === "local" ? "Free" : "1 Credit"}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Highlighter size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Studio Editor</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Masterpiece Creator</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl">
                  <Zap size={14} className="text-yellow-400 fill-current" />
                  <span className="text-xs font-black tracking-tight">{engine === "local" ? "Cost: Free" : "Cost: 1 Credit"}</span>
                </div>
              </div>

              <Card className="flex-none min-h-[300px] overflow-hidden flex flex-col p-0 border-slate-200/60 shadow-xl rounded-3xl">
                <textarea
                  className="w-full h-full p-6 lg:p-8 text-slate-700 bg-white border-none focus:outline-none focus:ring-0 resize-none font-medium leading-relaxed transition-all"
                  placeholder="Type or paste your raw notes here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </Card>
            </div>

            {/* Hand-written Preview Area */}
            <div className="flex-1 pb-10">
              <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl mb-8 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Handwritten Preview</h2>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Rendering
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-all cursor-pointer", viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-400")}><Layout className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-all cursor-pointer", viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-400")}><FileStack className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Responsive Container for scrolling pages */}
              <div className="w-full overflow-x-auto pb-8">
                <div 
                  className={cn(
                    "mx-auto",
                    viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "flex flex-col items-center gap-12"
                  )}
                  style={{ minWidth: `${currentConfig.w}px` }}
                >
                  {engine === "local" ? (
                    pages.length > 0 ? (
                      pages.map((lines, idx) => (
                        <PagePreview key={idx} lines={lines} isExport={false} pageIndex={idx} />
                      ))
                    ) : (
                      <div 
                        className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200"
                        style={{ width: `${currentConfig.w}px` }}
                      >
                        <RefreshCw className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Type something to generate preview</p>
                      </div>
                    )
                  ) : (
                    previewPages.length > 0 ? (
                      previewPages.map((page, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "relative bg-white shadow-2xl transition-all duration-500 overflow-hidden group rounded-sm border border-slate-200 flex-shrink-0"
                          )}
                          style={{
                            width: `${currentConfig.w}px`,
                            height: `${currentConfig.h}px`,
                          }}
                        >
                          <img src={`data:image/png;base64,${page}`} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                          <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            Page {idx + 1}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200"
                        style={{ width: `${currentConfig.w}px` }}
                      >
                        <RefreshCw className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No preview generated yet</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Generate Preview" to render on AI Cloud</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Export Container */}
      <div className="absolute left-[-9999px] top-0 overflow-visible z-[-1]" aria-hidden="true">
        <div id="pdf-export-wrapper" className="flex flex-col gap-4">
          {pages.map((lines, idx) => (
            <PagePreview key={`export-${idx}`} lines={lines} isExport={true} pageIndex={idx} />
          ))}
        </div>
      </div>

      <svg className="hidden">
        <defs>
          <filter id="ink-bleed">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="bleed" />
            <feComposite in="SourceGraphic" in2="bleed" operator="over" />
          </filter>
          <filter id="pencil-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
          </filter>
          <filter id="marker-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
