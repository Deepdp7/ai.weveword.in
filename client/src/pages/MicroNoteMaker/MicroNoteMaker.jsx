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
  
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '297mm';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note, fontSize]);
  
  const handleDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess('');

    try {
      let extractedText = '';
      
      if (file.name.endsWith('.txt')) {
        extractedText = await file.text();
      } else if (file.name.endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(file);
      } else if (file.name.endsWith('.docx')) {
        extractedText = await extractTextFromDOCX(file);
      } else {
        throw new Error('Unsupported file type. Please upload TXT, PDF, or DOCX.');
      }
      
      setNote(prev => prev + (prev.trim() ? '\n\n' : '') + extractedText.trim());
      setSuccess(`Successfully extracted text from ${file.name}`);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract text from the file.');
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
    if (!note.trim()) return;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Micro Note", 20, 20);
    
    // Add content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    
    // Calculate line height in mm (approx 0.35mm per pt + spacing)
    const lineHeight = fontSize * 0.4;
    const splitText = doc.splitTextToSize(note, 190); // 10mm margins on A4 (210mm wide)
    let y = 30;
    
    for (let i = 0; i < splitText.length; i++) {
      if (y > 285) { // 12mm bottom margin on A4 (297mm tall)
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 10, y);
      y += lineHeight;
    }
    
    doc.save('MicroNote.pdf');
    setSuccess('Exported as PDF!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportToDOCX = async () => {
    if (!note.trim()) return;
    
    const docxData = new Document({
      sections: [{
        properties: {},
        children: note.split('\n').map(line => 
          new Paragraph({
            children: [new TextRun({ text: line, size: fontSize * 2 })], // DOCX size is in half-points
          })
        ),
      }],
    });
    
    const blob = await Packer.toBlob(docxData);
    downloadBlob(blob, 'MicroNote.docx');
    
    setSuccess('Exported as DOCX!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200/50 mb-2">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
          Micro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Note Maker</span>
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
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
            
            <div className="flex-1 overflow-auto bg-gray-200/80 p-4 sm:p-8 custom-scrollbar relative flex justify-center">
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Start typing your note here... Use the voice dictation button above, or drag and drop a document on the right to extract its text!"
                className="bg-white shadow-md mx-auto text-gray-900 resize-none outline-none focus:ring-0 block shrink-0"
                style={{ 
                  zoom: typeof window !== 'undefined' && window.innerWidth < 640 ? 0.42 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 0.7 : 1,
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
