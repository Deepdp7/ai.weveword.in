import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, UploadCloud, FileText, ArrowUp, ArrowDown, X, Layers, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Append new files, avoiding duplicates by name for simplicity
    const newFiles = acceptedFiles.filter(
      newFile => !files.some(f => f.name === newFile.name)
    );
    setFiles(prev => [...prev, ...newFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === files.length - 1) return;
    
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = temp;
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    
    setError(null);
    setIsMerging(true);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/pdf/merge', formData, {
        responseType: 'blob' // important for file download
      });
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Merged_KolomFlow.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
    } catch (err) {
      setError('Failed to merge PDFs. Please try again.');
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/pdf-tools" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-brand-600 hover:border-brand-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Merge PDF</h1>
          <p className="text-gray-500">Combine multiple PDFs in the order you want.</p>
        </div>
      </div>

      {/* Dropzone */}
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
          {isDragActive ? 'Drop your PDFs here...' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-gray-500 mt-2">or click to browse your files</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900">Files to merge ({files.length})</h3>
            <button 
              onClick={handleMerge}
              disabled={isMerging || files.length < 2}
              className="px-6 py-2 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-brand-500/20"
            >
              {isMerging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
              {isMerging ? 'Merging...' : 'Merge PDFs'}
            </button>
          </div>
          <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {files.map((file, index) => (
              <li key={file.name} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveFile(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => removeFile(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
