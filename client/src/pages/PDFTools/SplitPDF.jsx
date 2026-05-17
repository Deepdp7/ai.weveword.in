import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, UploadCloud, FileText, Scissors, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function SplitPDF() {
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file first.');
      return;
    }
    if (!ranges.trim()) {
      setError('Please enter the page ranges to extract.');
      return;
    }
    
    setError(null);
    setIsSplitting(true);
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('ranges', ranges);

    try {
      const response = await axios.post('http://localhost:5000/api/pdf/split', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Extracted_KolomFlow.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
    } catch (err) {
      setError('Failed to split PDF. Please check your ranges and try again.');
      console.error(err);
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/pdf-tools" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-brand-600 hover:border-brand-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Split PDF</h1>
          <p className="text-gray-500">Extract specific pages from your PDF file.</p>
        </div>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
            isDragActive ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your PDF here...' : 'Drag & drop a PDF here'}
          </p>
          <p className="text-gray-500 mt-2">or click to browse</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-lg truncate">{file.name}</p>
              <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Extraction Options</h3>
            <p className="text-sm text-gray-500 mb-6">Enter the pages or page ranges you want to extract.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Ranges</label>
                <input 
                  type="text" 
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-5, 8, 11-13" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              <button 
                onClick={handleSplit}
                disabled={isSplitting || !ranges.trim()}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 text-lg"
              >
                {isSplitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scissors className="w-6 h-6" />}
                {isSplitting ? 'Splitting PDF...' : 'Extract Pages'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
