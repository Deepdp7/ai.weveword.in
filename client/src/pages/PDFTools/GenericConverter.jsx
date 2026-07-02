import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, Download, CheckCircle2, ArrowLeft, AlertCircle, Cloud } from 'lucide-react';
import axios from 'axios';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

const TOOL_CONFIG = {
  'word-to-pdf': { label: 'Word to PDF', accept: '.docx', icon: FileText, color: 'text-blue-600' },
  'txt-to-pdf': { label: 'TXT to PDF', accept: '.txt', icon: FileText, color: 'text-gray-600' },
  'ppt-to-pdf': { label: 'PPT to PDF', accept: '.pptx', icon: FileText, color: 'text-red-500' },
  'excel-to-pdf': { label: 'Excel to PDF', accept: '.xlsx', icon: FileText, color: 'text-green-600' },
};

export default function GenericConverter() {
  const { toolKey } = useParams();
  const navigate = useNavigate();
  const config = TOOL_CONFIG[toolKey] || { label: 'Converter', accept: '*', icon: FileText, color: 'text-brand-600' };
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/pdf/${toolKey}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });
      setResult({
        blob: response.data,
        fileName: file.name.replace(/\.[^/.]+$/, "") + '.pdf'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4">
      <button onClick={() => navigate('/pdf-tools')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft size={18} /> Back to Hub
      </button>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-gray-100 flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-gray-50 ${config.color}`}>
            <Icon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.label}</h1>
            <p className="text-gray-500 text-sm">Convert your {config.accept} files to high-quality PDF.</p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {!result ? (
            <div className="space-y-6">
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-brand-400 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                    <p className="mb-2 text-sm text-gray-700 font-semibold">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 uppercase">{config.accept} (Max 50MB)</p>
                  </div>
                  <input type="file" className="hidden" accept={config.accept} onChange={handleFileChange} />
                </label>
              ) : (
                <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Icon size={24} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1">Remove</button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={!file || loading}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {loading ? 'Converting...' : `Convert to PDF`}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                <p className="text-gray-500">Your file has been converted successfully.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  onClick={() => {
                    const url = window.URL.createObjectURL(result.blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', result.fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-8 py-3 bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download size={18} /> Download
                </button>
                <button
                  onClick={async () => {
                    setIsSavingCloud(true);
                    try {
                      const uploadData = new FormData();
                      uploadData.append('file', new File([result.blob], result.fileName, { type: 'application/pdf' }));
                      uploadData.append('toolSource', 'pdf');
                      await axios.post(`http://${window.location.hostname}:5000/api/files/upload`, uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      alert('Saved to Cloud Library!');
                    } catch (e) { alert('Failed to save to cloud.'); }
                    setIsSavingCloud(false);
                  }}
                  disabled={isSavingCloud}
                  className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-100 transition-colors"
                >
                  {isSavingCloud ? <Loader2 className="animate-spin" size={18} /> : <Cloud size={18} />} Save to Cloud
                </button>
                <button
                  onClick={() => { setFile(null); setResult(null); }}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Convert Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
