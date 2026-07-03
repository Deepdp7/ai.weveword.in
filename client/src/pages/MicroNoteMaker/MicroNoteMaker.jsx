import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { 
  FileText, Download, Upload, File, 
  FileArchive, FileType, FileCode, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, Settings,
  FileIcon, FileUp, Trash2
} from 'lucide-react';
import VoiceDictationButton from '../../components/VoiceDictationButton';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const extractTextFromPDF = async (file) => {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  }
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n\n';
  }
  return text;
};

const extractTextFromDOCX = async (file) => {
  if (!window.mammoth) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.2/mammoth.browser.min.js");
  }
  const mammoth = window.mammoth;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function MicroNoteMaker() {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [fontSize, setFontSize] = useState(6); // Default to a "micro" size

  const getAutoFontSize = (text) => {
    const chars = text.length;
    if (chars < 2000) return 8;
    if (chars < 6000) return 6;
    if (chars < 15000) return 4;
    return 3;
  };

  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '297mm';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note, fontSize]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      const a4Width = 800; // approx width in px for 210mm + padding
      if (containerWidth < a4Width) {
        setScale((containerWidth - 32) / a4Width);
      } else {
        setScale(1);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const handleDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess('');

    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.name.endsWith('.docx')) {
        extractedText = await extractTextFromDOCX(file);
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      setNote((prev) => prev + (prev.trim() ? '\n\n' : '') + extractedText);
      setSuccess('Text file imported!');
      setTimeout(() => setSuccess(''), 3000);
      
      const optimal = getAutoFontSize(extractedText);
      setFontSize(optimal);
    } catch (err) {
      console.error(err);
      setError('Failed to extract text. Make sure it is a valid PDF, DOCX, or TXT file.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(fontSize);
    
    const lines = doc.splitTextToSize(note, 190);
    doc.text(lines, 10, 10);
    
    doc.save('micro_note.pdf');
  };

  const exportToDOCX = async () => {
    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: note.split('\n').map(text => 
          new Paragraph({
            children: [new TextRun({ text, size: fontSize * 2 })] // size in half-points
          })
        )
      }]
    });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, 'micro_note.docx');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-8 sm:p-12 shadow-xl shadow-indigo-100/50 border border-indigo-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileText className="w-48 h-48 text-indigo-900 rotate-12" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-600 font-bold text-sm shadow-sm border border-indigo-100 mb-6">
          <Sparkles className="w-4 h-4" />
          The Ultimate Cheat Sheet Generator
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight">
          Micro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Note Maker</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl font-medium leading-relaxed">
          A distraction-free notepad. Type, dictate with your voice, or drop a file to extract text. Export instantly to PDF or DOCX.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Live A4 Editor */}
        <div className="lg:col-span-9 flex flex-col h-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col flex-1 h-[600px] relative overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm uppercase tracking-wider">
                <FileIcon className="w-4 h-4" />
                Live A4 Editor
              </div>
              <div className="flex items-center gap-2">
                {note.trim() && (
                  <button 
                    onClick={() => setNote('')} 
                    title="Clear note content"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" /> Clear
                  </button>
                )}
                <VoiceDictationButton 
                  onTranscription={(newText) => setNote(prev => prev + (prev.trim() ? ' ' : '') + newText)}
                />
              </div>
            </div>
            
            <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200/80 p-4 sm:p-8 custom-scrollbar relative flex justify-center items-start">
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Start typing your note here... Use the voice dictation button above, or drag and drop a document on the right to extract its text!"
                  className="bg-white shadow-md mx-auto text-gray-900 resize-none outline-none focus:ring-0 block shrink-0"
                  style={{ 
                    width: '210mm', 
                    minHeight: '297mm', 
                    padding: '10mm',
                    fontSize: `${fontSize}pt`,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    backgroundImage: 'linear-gradient(to bottom, transparent calc(297mm - 2px), #ef4444 calc(297mm - 2px), #ef4444 297mm)',
                    backgroundSize: '100% 297mm',
                    lineHeight: '1.4',
                    overflow: 'hidden'
                  }}
                />
              </div>
              
              {/* Word count */}
              <div className="absolute bottom-6 left-6 text-xs font-bold text-gray-500 bg-white/90 shadow-sm px-3 py-1.5 rounded-lg border border-gray-200 backdrop-blur-sm z-10 pointer-events-none">
                {note.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* File Upload Zone */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-indigo-500" />
              Extract Text from File
            </h3>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px]
                ${isDragActive ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="flex flex-col items-center text-indigo-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-bold">Extracting text...</p>
                  <p className="text-sm mt-1 text-indigo-400">This might take a moment.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4 text-indigo-500">
                    <FileText className="w-8 h-8" />
                    <FileCode className="w-8 h-8" />
                    <FileType className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-gray-700 mb-1">
                    {isDragActive ? 'Drop your file here!' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    or click to browse
                  </p>
                  <div className="mt-4 flex gap-2 justify-center flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">TXT</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">PDF</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">DOCX</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Status Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-3 bg-green-50 text-green-600 text-sm font-semibold rounded-xl border border-green-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}
          </div>

          {/* Micro Settings Zone */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-orange-500" />
              Micro Settings
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 flex justify-between mb-2">
                  <span>Font Size</span>
                  <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{fontSize} pt</span>
                </label>
                <input 
                  type="range" 
                  min="2" max="16" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-2 font-medium">Use 3-6 pt for extremely small "micro" cheating notes.</p>
              </div>
              
              <button
                onClick={() => {
                  const optimal = getAutoFontSize(note);
                  setFontSize(optimal);
                  setSuccess(`Auto-sized to ${optimal}pt based on file length!`);
                  setTimeout(() => setSuccess(''), 3000);
                }}
                disabled={!note.trim()}
                className={`w-full py-3 px-4 font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 text-sm ${
                  note.trim()
                    ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 shadow-sm cursor-pointer'
                    : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Automatic Generate Size
              </button>
            </div>
          </div>

          {/* Export Zone */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <Download className="w-5 h-5 text-purple-500" />
              Export Note
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={exportToPDF}
                disabled={!note.trim()}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold ${
                  note.trim() 
                    ? 'border-red-100 bg-white text-red-600 hover:border-red-500 hover:bg-red-50 hover:shadow-md cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5" />
                  Download as PDF
                </div>
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={exportToDOCX}
                disabled={!note.trim()}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold ${
                  note.trim() 
                    ? 'border-blue-100 bg-white text-blue-600 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileArchive className="w-5 h-5" />
                  Download as DOCX
                </div>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
