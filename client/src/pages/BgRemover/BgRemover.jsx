import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { removeBackground } from '@imgly/background-removal';
import { Image as ImageIcon, Upload, Loader2, Download, RefreshCw, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — keep the browser from choking on huge images

export default function BgRemover() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Guards against a stale async result overwriting a newer upload,
  // and lets us revoke object URLs safely.
  const requestIdRef = useRef(0);
  const originalUrlRef = useRef(null);
  const processedUrlRef = useRef(null);

  const revoke = (ref) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
  };

  // Clean up any outstanding object URLs when the component unmounts
  useEffect(() => {
    return () => {
      revoke(originalUrlRef);
      revoke(processedUrlRef);
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    if (fileRejections?.length) {
      const reason = fileRejections[0].errors?.[0]?.message || 'File was rejected.';
      setError(reason);
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('Image is too large. Please use a file under 20MB.');
      return;
    }

    const thisRequestId = ++requestIdRef.current;

    // Revoke previous URLs before creating new ones
    revoke(originalUrlRef);
    revoke(processedUrlRef);

    setError('');
    setCopied(false);
    setProcessedImage(null);
    setProgress(0);
    setStatusText('Initializing model (may take a moment on first run)...');

    const objectUrl = URL.createObjectURL(file);
    originalUrlRef.current = objectUrl;
    setOriginalImage(objectUrl);
    setIsProcessing(true);

    try {
      const config = {
        model: 'isnet', // swap to 'isnet_fp16' / 'isnet_quint8' depending on the library version installed — check @imgly/background-removal docs for your version's valid model IDs
        progress: (key, current, total) => {
          // Ignore progress from a request that's since been superseded
          if (requestIdRef.current !== thisRequestId) return;
          if (key.includes('fetch:')) {
            setStatusText('Downloading AI model (first time only)...');
            setProgress(Math.round((current / total) * 100));
          } else if (key === 'compute:inference') {
            setStatusText('Removing background...');
            setProgress(Math.round((current / total) * 100));
          }
        },
      };

      const blob = await removeBackground(file, config);

      // If a newer file was dropped while we were working, discard this result
      if (requestIdRef.current !== thisRequestId) return;

      const resultUrl = URL.createObjectURL(blob);
      processedUrlRef.current = resultUrl;
      setProcessedImage(resultUrl);
    } catch (err) {
      if (requestIdRef.current !== thisRequestId) return;
      console.error('Background removal error:', err);
      setError('Failed to remove background. Please try again with a different image.');
    } finally {
      if (requestIdRef.current === thisRequestId) {
        setIsProcessing(false);
        setProgress(0);
        setStatusText('');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
    disabled: isProcessing,
  });

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    revoke(originalUrlRef);
    revoke(processedUrlRef);
    requestIdRef.current++; // invalidate any in-flight request
    setOriginalImage(null);
    setProcessedImage(null);
    setError('');
    setProgress(0);
    setStatusText('');
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!processedImage) return;
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      setError('Copy to clipboard isn\'t supported in this browser. Try downloading instead.');
      return;
    }
    try {
      const response = await fetch(processedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Could not copy image to clipboard.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full flex items-center gap-1 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> 100% Free Tool
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full flex items-center gap-1 border border-blue-200">
              0 Credits Required
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-700 via-purple-600 to-indigo-700 flex items-center gap-3">
            AI Background Remover
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl text-sm sm:text-base">
            Instantly remove backgrounds from images with high precision. Uses local machine learning to process images completely privately in your browser!
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Workspace */}
      {!originalImage ? (
        <div
          {...getRootProps()}
          className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ease-in-out ${isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 hover:shadow-lg'
            }`}
        >
          {/* Decorative background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <input {...getInputProps()} />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload an Image</h3>
            <p className="text-gray-500 mb-6 text-lg">Drag and drop, or click to browse files</p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-400">
              <span className="px-2 py-1 bg-gray-100 rounded-md">PNG</span>
              <span className="px-2 py-1 bg-gray-100 rounded-md">JPG</span>
              <span className="px-2 py-1 bg-gray-100 rounded-md">WEBP</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">Max file size: 20MB</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Image Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 flex flex-col group">
            <h3 className="font-bold text-gray-900 mb-4 flex justify-between items-center text-lg">
              Original Image
              <button
                onClick={handleReset}
                className="text-sm text-indigo-600 hover:text-white flex items-center gap-2 font-semibold bg-indigo-50 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                <RefreshCw className="w-4 h-4" /> Upload New
              </button>
            </h3>
            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative min-h-[350px] sm:min-h-[450px] group-hover:shadow-inner transition-all">
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-contain absolute inset-0"
              />
            </div>
          </div>

          {/* Processed Image Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-indigo-100/50 flex flex-col">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Result (Transparent PNG)</h3>
            <div
              className="flex-1 rounded-2xl overflow-hidden border border-gray-100 relative min-h-[350px] sm:min-h-[450px]"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            >
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-10 rounded-2xl">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur animate-ping opacity-20"></div>
                    <Loader2 className="w-14 h-14 text-indigo-600 animate-spin relative z-10" />
                  </div>
                  <p className="font-bold text-gray-900 text-lg">{statusText}</p>
                  <div className="w-72 h-3 bg-gray-100 rounded-full mt-5 overflow-hidden shadow-inner border border-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-indigo-600 mt-3">{progress}% Complete</p>
                </div>
              ) : processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-full object-contain absolute inset-0 drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-16 h-16 opacity-30 mb-2" />
                  <p>Processing failed. Please retry.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCopy}
                disabled={!processedImage || isProcessing}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Image'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!processedImage || isProcessing}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-6 h-6" /> Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
