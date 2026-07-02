import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, Loader2, Download, CheckCircle2, ArrowLeft, AlertCircle, Trash2, Cloud } from 'lucide-react';
import axios from 'axios';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

export default function ImagesToPDF() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post(`${API}/pdf/images-to-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });
      setResult({
        blob: response.data,
        fileName: `Images_to_PDF_${Date.now()}.pdf`
      });
    } catch (err) {
      setError('Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button onClick={() => navigate('/pdf-tools')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft size={18} /> Back to Hub
      </button>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-50 text-orange-500">
            <ImageIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Images to PDF</h1>
            <p className="text-gray-500 text-sm">Convert multiple JPG or PNG images into a single PDF document.</p>
          </div>
        </div>

        <div className="p-8">
          {!result ? (
            <div className="space-y-6">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-brand-400 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <p className="mb-2 text-sm text-gray-700 font-semibold">Click to upload images</p>
                  <p className="text-xs text-gray-500">JPG, PNG (Max 20 images)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </label>

              {files.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-2xl">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={files.length === 0 || loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {loading ? 'Generating PDF...' : `Create PDF from ${files.length} Image${files.length === 1 ? '' : 's'}`}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                <p className="text-gray-500">Your PDF has been generated successfully.</p>
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
                  onClick={() => { setFiles([]); setResult(null); }}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
