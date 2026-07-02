import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Upload, Download, RefreshCw, AlertCircle, Sparkles, Maximize, Lock, Unlock, Crop, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function ImageResizer() {
  const [originalImage, setOriginalImage] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  
  const [resizedImage, setResizedImage] = useState(null);
  const [error, setError] = useState('');
  
  const [targetSizeKB, setTargetSizeKB] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(1.0);
  
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [resizedFileSize, setResizedFileSize] = useState(0);
  
  const originalUrlRef = useRef(null);
  const resizedUrlRef = useRef(null);

  const revoke = (ref) => {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revoke(originalUrlRef);
      revoke(resizedUrlRef);
    };
  }, []);

  // Update resized image whenever width/height/format/quality changes
  useEffect(() => {
    if (!originalImage || !width || !height) return;
    
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        setResizedFileSize(blob.size);
        revoke(resizedUrlRef);
        const objectUrl = URL.createObjectURL(blob);
        resizedUrlRef.current = objectUrl;
        setResizedImage(objectUrl);
      }, format, quality);
    };
  }, [width, height, format, quality, originalImage]);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
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

    revoke(originalUrlRef);
    setError('');
    setOriginalFileSize(file.size);
    
    const objectUrl = URL.createObjectURL(file);
    originalUrlRef.current = objectUrl;
    setOriginalImage(objectUrl);
    
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setWidth(img.width);
      setHeight(img.height);
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false
  });

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions.width) {
      setHeight(Math.round(newWidth * (originalDimensions.height / originalDimensions.width)));
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions.height) {
      setWidth(Math.round(newHeight * (originalDimensions.width / originalDimensions.height)));
    }
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const link = document.createElement('a');
    link.href = resizedImage;
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    link.download = `resized-${width}x${height}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    revoke(originalUrlRef);
    revoke(resizedUrlRef);
    setOriginalImage(null);
    setResizedImage(null);
    setWidth(0);
    setHeight(0);
    setOriginalFileSize(0);
    setResizedFileSize(0);
    setTargetSizeKB('');
    setFormat('image/png');
    setQuality(1.0);
    setError('');
  };

  const compressToTargetSize = async () => {
    if (!originalImage || !targetSizeKB || targetSizeKB <= 0) return;
    
    setIsCompressing(true);
    setError('');
    
    const getCanvasBlob = (canvas, testQuality) => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', testQuality);
      });
    };

    const targetBytes = targetSizeKB * 1024;
    
    const img = new Image();
    img.src = originalImage;
    
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });

    let currentWidth = originalDimensions.width;
    let currentHeight = originalDimensions.height;
    
    let bestQuality = 1.0;
    let bestWidth = currentWidth;
    let bestHeight = currentHeight;
    let foundMatch = false;
    
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    
    // First, try adjusting quality while keeping original dimensions
    let minQuality = 0.1;
    let maxQuality = 1.0;
    
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
    
    for (let i = 0; i < 7; i++) {
      let testQuality = (minQuality + maxQuality) / 2;
      const blob = await getCanvasBlob(canvas, testQuality);
      
      if (blob.size <= targetBytes) {
        bestQuality = testQuality;
        foundMatch = true;
        minQuality = testQuality; // we can try higher quality to get closer to target
      } else {
        maxQuality = testQuality; // we need lower quality
      }
    }
    
    // If even at 0.1 quality it's too big, scale dimensions down proportionally
    if (!foundMatch) {
      bestQuality = 0.1; // lock quality to minimum
      let scale = 0.9;
      
      for (let i = 0; i < 15; i++) {
        currentWidth = Math.max(1, Math.floor(originalDimensions.width * scale));
        currentHeight = Math.max(1, Math.floor(originalDimensions.height * scale));
        
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        
        const blob = await getCanvasBlob(canvas, bestQuality);
        
        if (blob.size <= targetBytes) {
          bestWidth = currentWidth;
          bestHeight = currentHeight;
          foundMatch = true;
          break;
        }
        
        scale -= 0.05;
        if (scale <= 0.05) break;
      }
    }
    
    if (foundMatch) {
      // Set the states so useEffect picks them up and generates the final preview
      setFormat('image/jpeg');
      setQuality(bestQuality);
      setWidth(bestWidth);
      setHeight(bestHeight);
    } else {
      setError('Target size is too small for this image. Try a larger size.');
    }
    
    setIsCompressing(false);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full flex items-center gap-1 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> 100% Free Tool
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full flex items-center gap-1 border border-blue-200">
              0 Credits Required
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-700 via-purple-600 to-indigo-700 flex items-center gap-3">
            Image Resizer
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl text-sm sm:text-base">
            Resize your images instantly right in your browser. Fast, secure, and preserves high quality without uploading anywhere!
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!originalImage ? (
        <div 
          {...getRootProps()} 
          className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center cursor-pointer transition-all duration-300 ease-in-out ${
            isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 hover:shadow-lg'
          }`}
        >
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 flex flex-col h-fit">
            <h3 className="font-bold text-gray-900 mb-6 flex justify-between items-center text-lg">
              Dimensions
              <button 
                onClick={handleReset}
                className="text-sm text-indigo-600 hover:text-white flex items-center gap-2 font-semibold bg-indigo-50 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width (px)</label>
                <input 
                  type="number"
                  value={width || ''}
                  onChange={handleWidthChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-gray-900"
                  min="1"
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                  className={`p-3 rounded-xl transition-colors ${maintainAspectRatio ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  title={maintainAspectRatio ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                >
                  {maintainAspectRatio ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (px)</label>
                <input 
                  type="number"
                  value={height || ''}
                  onChange={handleHeightChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-gray-900"
                  min="1"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-3">Compress to Target File Size</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      value={targetSizeKB}
                      onChange={(e) => setTargetSizeKB(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-gray-900"
                      min="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">KB</span>
                  </div>
                  <button
                    onClick={compressToTargetSize}
                    disabled={isCompressing || !targetSizeKB}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                  >
                    {isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Automatically adjusts quality and dimensions to hit this exact size.</p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleDownload}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-6 h-6" /> Download Image
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-indigo-100/50 flex flex-col">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Preview</h3>
            
            <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
              <div 
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative flex items-center justify-center"
                style={{
                  backgroundColor: '#ffffff',
                  backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px'
                }}
              >
                {resizedImage ? (
                  <img 
                    src={resizedImage} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-[65vh] object-contain"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center p-16">
                    <ImageIcon className="w-16 h-16 opacity-30 mb-2" />
                    <p>Processing preview...</p>
                  </div>
                )}
              </div>
            </div>
            
            {resizedImage && (
              <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-sm font-bold">
                <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
                  <Maximize className="w-4 h-4" /> {width} × {height} px
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> {resizedFileSize ? formatBytes(resizedFileSize) : 'Calculating...'}
                </span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
