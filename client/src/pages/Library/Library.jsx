import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Folder, File, Image as ImageIcon, FileText, Video, Download, Trash2, Share2, Filter, MoreVertical, Upload, RefreshCw, AlertCircle, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

const FOLDERS = [
  { label: 'All', value: 'All' },
  { label: 'Studio', value: 'studio' },
  { label: 'Writing Animator', value: 'animator' },
  { label: 'Signature', value: 'signature' },
  { label: 'PDF Tools', value: 'pdf' },
  { label: 'PPT Maker', value: 'ppt' },
  { label: 'Project Builder', value: 'project' },
];

const TOOL_LABELS = {
  studio: 'Studio',
  animator: 'Writing Animator',
  signature: 'Signature',
  pdf: 'PDF Tools',
  ppt: 'PPT Maker',
  project: 'Project Builder',
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (type) => {
  switch (type) {
    case 'pdf': return <FileText className="text-red-500 w-8 h-8" />;
    case 'png': case 'jpg': case 'svg': return <ImageIcon className="text-blue-500 w-8 h-8" />;
    case 'mp4': return <Video className="text-purple-500 w-8 h-8" />;
    case 'pptx': return <File className="text-orange-500 w-8 h-8" />;
    case 'docx': return <FileText className="text-sky-500 w-8 h-8" />;
    default: return <File className="text-gray-400 w-8 h-8" />;
  }
};

export default function Library() {
  const [activeFolder, setActiveFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [storage, setStorage] = useState({ usedGB: '0', limitGB: '10', percentUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProRequired, setIsProRequired] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeFolder !== 'All') params.source = activeFolder;
      if (searchQuery) params.search = searchQuery;

      const [filesRes, storageRes] = await Promise.all([
        axios.get(`${API}/files/my-files`, { params }),
        axios.get(`${API}/files/storage`),
      ]);

      setFiles(filesRes.data.files || []);
      setStorage(storageRes.data.storage || {});
    } catch (err) {
      if (err.response?.status === 403) {
        setIsProRequired(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load files. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`${API}/files/${fileId}`);
      setFiles(files.filter(f => f._id !== fileId));
    } catch (err) {
      alert('Failed to delete file.');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('toolSource', 'studio'); // Default source for manual uploads

    setUploading(true);
    try {
      await axios.post(`${API}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cloud Library</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">All your generated files in one secure place.</p>
        </div>

        {/* Storage Quota Widget */}
        <div className="bg-white w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Folder className="text-indigo-600 w-5 h-5" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1 font-medium">
              <span className="text-gray-700 mr-4">Storage</span>
              <span className="text-indigo-600">{storage.usedGB} GB / {storage.limitGB} GB</span>
            </div>
            <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(storage.percentUsed || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Sidebar Folders */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Folders</h3>
            <div className="space-y-1">
              {FOLDERS.map(folder => (
                <button
                  key={folder.value}
                  onClick={() => setActiveFolder(folder.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    activeFolder === folder.value
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {folder.label}
                  {folder.value === 'All' && (
                    <span className="bg-white text-gray-500 py-0.5 px-2 rounded-md border border-gray-200 text-xs">
                      {files.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={fetchFiles}
                className="flex-1 sm:flex-none px-4 py-3 bg-white border border-gray-200 rounded-xl flex justify-center items-center gap-2 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <label className="flex-1 sm:flex-none justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 font-medium cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Error State */}
          {error && !isProRequired && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isProRequired ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-indigo-200 border-dashed shadow-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 relative">
                <Folder className="w-8 h-8 opacity-50" />
                <Lock className="w-6 h-6 absolute text-indigo-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud Library is a Pro Feature</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Upgrade to the Pro plan to access unlimited cloud storage, view your generated files anywhere, and unlock all premium tools.
              </p>
              <Link
                to="/credits"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Crown className="w-5 h-5" /> Upgrade to Pro
              </Link>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-100 rounded-xl w-14 h-14"></div>
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : files.length > 0 ? (
            /* Files Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map(file => (
                <div key={file._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      {getFileIcon(file.fileType)}
                    </div>
                    <button className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-gray-900 truncate mb-1" title={file.fileName}>{file.fileName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{TOOL_LABELS[file.toolSource] || file.toolSource}</span>
                    <span>•</span>
                    <span>{formatBytes(file.size)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.fileName}
                      className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
              <Folder className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No files here yet</h3>
              <p className="text-gray-500 text-sm">Upload a file or use a tool to generate one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
