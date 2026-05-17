import React, { useState } from 'react';
import { Presentation, Layout, Plus, Play, Download, Settings, Image as ImageIcon, Type, Square, Columns } from 'lucide-react';

export default function PPTMaker() {
  const [slides, setSlides] = useState([
    { id: 1, type: 'Title', content: 'Project Presentation' },
    { id: 2, type: 'Content', content: 'Introduction and Goals' }
  ]);
  const [activeSlide, setActiveSlide] = useState(1);

  const handleExport = () => {
    alert("Exporting to .pptx... (Mock)");
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-xl text-orange-600">
            <Presentation size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PPT Maker</h1>
            <p className="text-gray-500 mt-1">Design and export beautiful presentations.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium border border-gray-200 transition-colors shadow-sm">
            <Play size={20} className="text-gray-500" />
            Present
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download size={20} />
            Export PPTX
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 px-4">
        {/* Left Sidebar: Slide Thumbnails */}
        <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Slides</h3>
            <button 
              onClick={() => setSlides([...slides, { id: Date.now(), type: 'Blank', content: '' }])}
              className="text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {slides.map((slide, index) => (
              <div 
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`relative group cursor-pointer transition-all ${activeSlide === slide.id ? 'ring-2 ring-orange-500 rounded-lg' : ''}`}
              >
                <div className="absolute top-2 left-2 w-5 h-5 bg-black/50 text-white text-xs flex items-center justify-center rounded backdrop-blur-sm z-10">
                  {index + 1}
                </div>
                <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-2 group-hover:border-orange-300">
                  <Layout className="text-gray-300 mb-2 w-8 h-8" />
                  <span className="text-xs text-gray-500 font-medium">{slide.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Main Canvas */}
        <div className="flex-1 bg-gray-100/50 rounded-2xl border border-gray-200 shadow-inner flex flex-col p-6 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 flex items-center justify-center gap-2 w-max mx-auto">
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Add Text"><Type size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Add Image"><ImageIcon size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Add Shape"><Square size={20} /></button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Layout Options"><Columns size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 tooltip" title="Slide Settings"><Settings size={20} /></button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl aspect-[16/9] bg-white shadow-xl rounded-sm relative flex flex-col items-center justify-center p-12 group hover:ring-1 hover:ring-orange-200 transition-all">
              <div className="absolute top-4 right-4 text-xs text-gray-400">Slide {slides.findIndex(s => s.id === activeSlide) + 1}</div>
              
              <input 
                type="text" 
                value={slides.find(s => s.id === activeSlide)?.content || 'Click to edit title'} 
                onChange={(e) => {
                  setSlides(slides.map(s => s.id === activeSlide ? {...s, content: e.target.value} : s));
                }}
                className="text-4xl font-bold text-gray-800 text-center bg-transparent border-none focus:ring-0 focus:outline-none w-full mb-4"
              />
              <p className="text-xl text-gray-400">Subtitle or content goes here</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Settings */}
        <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-6">Themes</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Minimal', 'Corporate', 'Creative', 'Dark Mode'].map(theme => (
              <div key={theme} className="cursor-pointer group">
                <div className="aspect-video bg-gray-100 rounded-lg border border-gray-200 mb-2 group-hover:border-orange-500 transition-colors flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full ${theme === 'Dark Mode' ? 'bg-gray-800' : 'bg-gradient-to-br from-orange-400 to-pink-500'}`}></div>
                </div>
                <p className="text-xs text-center text-gray-600 font-medium group-hover:text-orange-600">{theme}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
