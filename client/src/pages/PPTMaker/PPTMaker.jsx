import React, { useState, useEffect } from 'react';
import {
  Presentation, Layout, Plus, Play, Download, Settings, Type, Square,
  Columns, Cloud, ChevronLeft, ChevronRight, Trash2, X, Sparkles,
  ChevronUp, ChevronDown, Copy, RotateCcw, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Underline, Strikethrough, FileText,
  Grid, ArrowLeft, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '../../components/toastStore';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

/* ─────────────────────── TEMPLATE DATA ─────────────────────── */
const TEMPLATE_CATEGORIES = [
  {
    label: 'Recently used templates',
    templates: [
      {
        id: 'blank',
        name: 'Blank presentation',
        isBlank: true,
        accent: '#3b82f6', bg: '#ffffff', text: '#0f172a',
        preview: { type: 'blank' },
        slides: [
          { id: 'b1', type: 'Title', title: 'NEW PRESENTATION', subtitle: 'Click to start editing', content: '', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'big-idea',
        name: 'Your big idea',
        tag: 'by Made to Stick',
        accent: '#ffffff', bg: '#ea580c', text: '#ffffff',
        preview: { type: 'big-idea' },
        slides: [
          { id: 'bi1', type: 'Title', title: 'Making Presentations That Stick', subtitle: 'A guide by Chip Heath & Dan Heath', content: '', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 36, color: '#ffffff', font: 'sans', align: 'center' }, subtitle: { bold: false, size: 14, color: '#ffedd5', font: 'sans', align: 'center' } } }
        ]
      },
      {
        id: 'photo-album',
        name: 'Photo album',
        tag: 'Travel & Memories',
        accent: '#475569', bg: '#f1f5f9', text: '#0f172a',
        preview: { type: 'photo-album' },
        slides: [
          { id: 'pa1', type: 'Title', title: 'PHOTO ALBUM', subtitle: 'San Francisco Trip', content: 'Captured Memories', contentLeft: '', contentRight: '', animation: 'none', formatting: {} },
          { id: 'pa2', type: 'Split', title: 'Golden Gate Bridge', subtitle: 'Vibrant suspension spans', content: '', contentLeft: 'Landmark of SF\nThe bridge is one of the most internationally recognized symbols of San Francisco.', contentRight: 'Historical Legacy\nOpened in 1937, it was the longest suspension bridge span in the world.', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'wedding',
        name: 'Wedding',
        tag: 'Celebration Schedule',
        accent: '#92400e', bg: '#fdfbf7', text: '#78350f',
        preview: { type: 'wedding' },
        slides: [
          { id: 'w1', type: 'Title', title: 'WEDDING CELEBRATION', subtitle: 'Join us for a full weekend of activities!', content: 'Thursday • Friday • Sunday', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 28, color: '#78350f', font: 'serif', align: 'center' } } },
          { id: 'w2', type: 'Split', title: 'Activity Schedule', subtitle: 'Overview of events', content: '', contentLeft: 'Thursday 3pm\nSpa at 3pm. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', contentRight: 'Friday 1pm\nGolf at 1pm. Ut enim ad minim veniam, quis nostrud.', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        tag: 'Design & Code Showcase',
        accent: '#1f2937', bg: '#f3f4f6', text: '#111827',
        preview: { type: 'portfolio' },
        slides: [
          { id: 'pf1', type: 'Title', title: 'CREATIVE PORTFOLIO', subtitle: 'Showcasing premium mobile & web apps', content: 'Designed by Waveword AI Studio', contentLeft: '', contentRight: '', animation: 'none', formatting: {} },
          { id: 'pf2', type: 'Split', title: 'Selected Works', subtitle: 'Mobile & Web Solutions', content: '', contentLeft: 'Web Application\nFullstack React platforms with responsive dashboards.', contentRight: 'Mobile Platforms\nCapacitor & Native iOS/Android builds.', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'lookbook',
        name: 'Lookbook',
        tag: 'Apparel & Fashion',
        accent: '#10b981', bg: '#d1d5db', text: '#111827',
        preview: { type: 'lookbook' },
        slides: [
          { id: 'lb1', type: 'Title', title: "WENDY'S PICKS", subtitle: 'Summer Fashion Collection 2026', content: 'Lookbook Edition', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 32, color: '#111827', font: 'serif', align: 'center' } } },
          { id: 'lb2', type: 'Content', title: 'Gibson Surf Cap', subtitle: 'Premium Apparel', content: '• Raw cotton fabric.\n• Adjustable leather backstrap.\n• Water repellent coating.\n• Embossed brand logo.', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      }
    ]
  },
  {
    label: 'Personal',
    templates: [
      {
        id: 'general-p',
        name: 'General presentation',
        tag: 'Multipurpose Pitch',
        accent: '#2563eb', bg: '#eff6ff', text: '#1e3a8a',
        preview: { type: 'general-presentation' },
        slides: [
          { id: 'gp1', type: 'Title', title: 'GENERAL PRESENTATION', subtitle: 'A clean multipurpose template', content: 'Your name here', contentLeft: '', contentRight: '', animation: 'none', formatting: {} },
          { id: 'gp2', type: 'Content', title: 'Key Points', subtitle: 'What we will cover today', content: '• Introduction and background.\n• Main topic analysis.\n• Summary and next steps.', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'big-idea-p',
        name: 'Your big idea',
        tag: 'by Made to Stick',
        accent: '#ffffff', bg: '#ea580c', text: '#ffffff',
        preview: { type: 'big-idea' },
        slides: [
          { id: 'bi1', type: 'Title', title: 'Making Presentations That Stick', subtitle: 'A guide by Chip Heath & Dan Heath', content: '', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 36, color: '#ffffff', font: 'sans', align: 'center' }, subtitle: { bold: false, size: 14, color: '#ffedd5', font: 'sans', align: 'center' } } }
        ]
      },
      {
        id: 'photo-album-p',
        name: 'Photo album',
        tag: 'Travel & Memories',
        accent: '#475569', bg: '#f1f5f9', text: '#0f172a',
        preview: { type: 'photo-album' },
        slides: [
          { id: 'pa1', type: 'Title', title: 'PHOTO ALBUM', subtitle: 'San Francisco Trip', content: 'Captured Memories', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'wedding-p',
        name: 'Wedding',
        tag: 'Celebration Schedule',
        accent: '#92400e', bg: '#fdfbf7', text: '#78350f',
        preview: { type: 'wedding' },
        slides: [
          { id: 'w1', type: 'Title', title: 'WEDDING CELEBRATION', subtitle: 'Join us for a full weekend of activities!', content: 'Thursday • Friday • Sunday', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 28, color: '#78350f', font: 'serif', align: 'center' } } }
        ]
      },
      {
        id: 'recipe-book',
        name: 'Recipe book',
        tag: 'Food & Cooking',
        accent: '#ef4444', bg: '#fff5f5', text: '#7f1d1d',
        preview: { type: 'recipe-book' },
        slides: [
          { id: 'rc1', type: 'Title', title: 'RECIPE NAME', subtitle: '30 minutes • Serves 4–6', content: 'Homemade Raspberry Bowl', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 32, color: '#ef4444', font: 'serif', align: 'center' } } },
          { id: 'rc2', type: 'Content', title: 'Classic Pasta', subtitle: 'Serves 4 • 30 min', content: '• 400g spaghetti\n• 3 cloves garlic\n• Olive oil, parmesan\n• Fresh basil\n\nBoil pasta. Sauté garlic in oil. Toss together.', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'portfolio-p',
        name: 'Portfolio',
        tag: 'Design & Code Showcase',
        accent: '#1f2937', bg: '#f3f4f6', text: '#111827',
        preview: { type: 'portfolio' },
        slides: [
          { id: 'pf1', type: 'Title', title: 'CREATIVE PORTFOLIO', subtitle: 'Showcasing premium mobile & web apps', content: 'Designed by Waveword AI Studio', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }
        ]
      },
      {
        id: 'lookbook-p',
        name: 'Lookbook',
        tag: 'Apparel & Fashion',
        accent: '#10b981', bg: '#d1d5db', text: '#111827',
        preview: { type: 'lookbook' },
        slides: [
          { id: 'lb1', type: 'Title', title: "WENDY'S PICKS", subtitle: 'Summer Fashion Collection 2026', content: 'Lookbook Edition', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 32, color: '#111827', font: 'serif', align: 'center' } } }
        ]
      },
      {
        id: 'party-invite',
        name: 'Party invite',
        tag: 'Special Invitation',
        accent: '#e11d48', bg: '#fff1f2', text: '#881337',
        preview: { type: 'party-invite' },
        slides: [
          { id: 'pi1', type: 'Title', title: "You're invited", subtitle: "Wendy's 28th Birthday!", content: 'RSVP by Friday', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 28, color: '#be185d', font: 'serif', align: 'center' }, subtitle: { bold: true, size: 32, color: '#9d174d', font: 'serif', align: 'center' } } }
        ]
      },
      {
        id: 'yearbook',
        name: 'Yearbook',
        tag: 'Polaroids & Highlights',
        accent: '#ec4899', bg: '#111827', text: '#f9fafb',
        preview: { type: 'yearbook' },
        slides: [
          { id: 'yb1', type: 'Title', title: 'Yearbook 2026', subtitle: 'Class of graduation and achievements', content: '', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 36, color: '#f472b6', font: 'serif', align: 'center' } } }
        ]
      },
      {
        id: 'family-recipes',
        name: 'Family Recipes',
        tag: 'Kitchen Favorites',
        accent: '#b45309', bg: '#fef3c7', text: '#78350f',
        preview: { type: 'family-recipes' },
        slides: [
          { id: 'fr1', type: 'Title', title: 'Family Recipes', subtitle: 'Homemade secrets from our kitchen to yours', content: '', contentLeft: '', contentRight: '', animation: 'none', formatting: { title: { bold: true, size: 32, color: '#92400e', font: 'serif', align: 'center' } } }
        ]
      }
    ]
  }
];

const LAYOUTS = [
  { name: 'Title Slide', type: 'Title', icon: Type },
  { name: 'Title & Content', type: 'Content', icon: Layout },
  { name: 'Split Columns', type: 'Split', icon: Columns },
  { name: 'Big Quote', type: 'Quote', icon: Square }
];

const BACKGROUND_PRESETS = [
  { name: 'Clean Light', bg: '#f8fafc', text: '#0f172a' },
  { name: 'Dark Space', bg: '#0f172a', text: '#f8fafc' },
  { name: 'Warm Sunset', bg: '#fffbeb', text: '#78350f' },
  { name: 'Mint Breeze', bg: '#f0fdf4', text: '#166534' },
  { name: 'Blue Slate', bg: '#e0f2fe', text: '#0369a1' },
];

const GRADIENTS = [
  { name: 'None', value: 'none' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 100%)' },
  { name: 'Golden Hour', value: 'linear-gradient(135deg, #fef3c7 0%, #fde047 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)' },
  { name: 'Mint Mint', value: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' },
  { name: 'Cosmo Dark', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
];

const TRANSITIONS = ['None', 'Fade', 'Slide', 'Zoom', 'Wipe', 'Push', 'Split', 'Morph', 'Reveal', 'Fall Over', 'Curtains', 'Flash'];
const ANIMATIONS = ['None', 'Appear', 'Fade', 'Fly In', 'Float In', 'Grow & Turn', 'Zoom', 'Wipe'];

/* ─────────────────────── TEMPLATE PREVIEW CARD ─────────────────────── */
function TemplatePreviewCard({ template, onClick }) {
  const { preview, accent, bg, text } = template;

  const renderPreview = () => {
    if (template.isBlank) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-xl">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Plus size={20} className="text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Blank presentation</span>
          </div>
        </div>
      );
    }

    if (preview?.type === 'big-idea') {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-between text-white" style={{ backgroundColor: '#ea580c' }}>
          <div className="text-[9px] font-black text-center mt-2 leading-tight uppercase">Making Presentations That Stick</div>
          <div className="text-[6px] opacity-75 text-center mb-1">A guide by Chip Heath & Dan Heath</div>
        </div>
      );
    }

    if (preview?.type === 'photo-album') {
      return (
        <div className="w-full h-full p-2 flex bg-[#f1f5f9] flex-col justify-between">
          <div className="flex gap-1.5 h-10 items-stretch">
            <div className="w-1/3 bg-slate-400 rounded" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex-1 bg-slate-300 rounded" />
              <div className="flex-1 bg-slate-300 rounded" />
            </div>
          </div>
          <div className="text-[8px] font-extrabold text-slate-700 mt-1 truncate">Lorem Ipsum Photo</div>
        </div>
      );
    }

    if (preview?.type === 'wedding') {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-between text-[#78350f]" style={{ backgroundColor: '#fdfbf7' }}>
          <div className="text-[7px] font-black text-center leading-tight">Join us for a full weekend of activities!</div>
          <div className="grid grid-cols-3 gap-1 mt-1 text-[5px] text-center">
            <div className="border border-[#78350f]/20 p-0.5 rounded bg-amber-50/50">
              <span className="font-bold block">Thurs</span>
              <span>3pm</span>
            </div>
            <div className="border border-[#78350f]/20 p-0.5 rounded bg-amber-50/50">
              <span className="font-bold block">Fri</span>
              <span>1pm</span>
            </div>
            <div className="border border-[#78350f]/20 p-0.5 rounded bg-amber-50/50">
              <span className="font-bold block">Sun</span>
              <span>Noon</span>
            </div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'portfolio') {
      return (
        <div className="w-full h-full p-2 flex bg-white gap-2 items-center justify-between">
          <div className="flex flex-col gap-1 w-2/5">
            <div className="text-[7px] font-black leading-tight text-slate-800">Project name</div>
            <div className="h-0.5 w-3 bg-slate-400 rounded" />
            <div className="h-0.5 w-4 bg-slate-200 rounded" />
          </div>
          <div className="flex-1 border border-slate-200 rounded-lg p-1 bg-slate-50 flex items-center justify-center relative shadow-sm h-12">
            <div className="w-full h-full bg-slate-200 rounded flex flex-col justify-center items-center">
              <div className="w-4 h-3 bg-white rounded-sm shadow-sm" />
              <div className="w-6 h-0.5 bg-slate-400 mt-1 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'lookbook') {
      return (
        <div className="w-full h-full flex bg-[#e5e7eb] relative p-1">
          <div className="w-1/2 bg-[#1f2937] p-1 flex flex-col justify-between text-white rounded-l">
            <span className="bg-[#10b981] text-[4px] px-1 py-0.5 rounded text-center text-white font-extrabold tracking-widest leading-none self-start uppercase">Wendy's Picks</span>
          </div>
          <div className="flex-1 p-1 flex flex-col justify-center gap-0.5">
            <div className="text-[6px] font-black text-slate-800 uppercase leading-none">Gibson Surf Cap</div>
            <div className="text-[4px] text-slate-400 leading-none">Rancher Vest</div>
            <div className="text-[4px] text-slate-400 leading-none">Parker High-Tops</div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'recipe-book') {
      return (
        <div className="w-full h-full p-2.5 flex bg-[#f87171] relative justify-center items-center">
          <div className="w-full h-full bg-white rounded-lg flex items-center p-1.5 gap-2 shadow">
            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[12px]">🍓</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-black text-red-600 leading-tight">RECIPE NAME</div>
              <div className="text-[4px] text-slate-400 mt-0.5">30 minutes • Serves 4-6</div>
            </div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'party-invite') {
      return (
        <div className="w-full h-full p-2 flex bg-[#fda4af] relative justify-center items-center">
          <div className="w-[90%] h-[90%] bg-white rounded flex flex-col justify-center items-center p-1 text-center shadow border border-rose-200">
            <div className="text-[6px] text-slate-400 leading-none">You're invited</div>
            <div className="text-[9px] font-black text-[#be185d] leading-tight mt-1">Wendy's 28th Birthday!</div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'yearbook') {
      return (
        <div className="w-full h-full bg-[#111827] p-2 flex gap-1 items-stretch">
          <div className="w-1/2 p-1 flex flex-col justify-center text-left">
            <span className="text-[8px] font-black text-rose-300">Yearbook</span>
            <div className="h-0.5 w-6 bg-rose-400 mt-1 rounded-full" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1 p-0.5">
            <div className="bg-slate-700 rounded border border-white/10" />
            <div className="bg-slate-700 rounded border border-white/10" />
            <div className="bg-slate-700 rounded border border-white/10" />
            <div className="bg-slate-700 rounded border border-white/10" />
          </div>
        </div>
      );
    }

    if (preview?.type === 'family-recipes') {
      return (
        <div className="w-full h-full bg-[#fef08a] p-2.5 flex flex-col justify-between text-[#713f12]">
          <div className="text-[9px] font-black leading-none mt-1">Family Recipes</div>
          <div className="flex gap-1 items-center justify-center mt-1">
            <div className="w-7 h-7 bg-white rounded p-0.5 shadow-sm transform -rotate-6">
              <div className="w-full h-full bg-amber-100 rounded-sm" />
            </div>
            <div className="w-7 h-7 bg-white rounded p-0.5 shadow-sm transform rotate-6">
              <div className="w-full h-full bg-amber-200 rounded-sm" />
            </div>
          </div>
        </div>
      );
    }

    if (preview?.type === 'general-presentation') {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-between" style={{ backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
          <div className="text-[8px] font-black uppercase leading-tight bg-blue-600 text-white px-1 py-0.5 rounded self-start">First point</div>
          <div className="mt-1 space-y-0.5">
            <div className="h-1 bg-blue-300 w-full rounded-full" />
            <div className="h-1 bg-blue-200 w-3/4 rounded-full" />
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full rounded-xl overflow-hidden relative"
        style={{ backgroundColor: bg }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: accent }} />
        <div className="p-3 flex flex-col h-full justify-center">
          <div
            className="text-[9px] font-black uppercase tracking-wider leading-tight mb-1"
            style={{ color: accent }}
          >
            {preview?.label || template.name}
          </div>
          <div className="text-[7px] font-medium leading-relaxed" style={{ color: text, opacity: 0.7 }}>
            {preview?.sub || ''}
          </div>
        </div>
      </div>
    );
  };


  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 text-left focus:outline-none"
    >
      <div
        className="w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-brand-400 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-brand-100 group-hover:scale-[1.02]"
        style={{ backgroundColor: bg }}
      >
        {renderPreview()}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-700 transition-colors leading-tight">
          {template.name}
        </p>
        {template.tag && (
          <p className="text-[10px] text-slate-400 mt-0.5">{template.tag}</p>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────── TEMPLATE GALLERY ─────────────────────── */
function TemplateGallery({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-xl border border-brand-100">
            <Presentation size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Choose a Template</h1>
            <p className="text-xs text-slate-500">Start with a professional design</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Editor
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {TEMPLATE_CATEGORIES.map(category => (
          <div key={category.label} className="mb-10">
            <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
              {category.label}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
              {category.templates.map(tmpl => (
                <TemplatePreviewCard
                  key={tmpl.id}
                  template={tmpl}
                  onClick={() => onSelect(tmpl)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function PPTMaker() {
  const [showGallery, setShowGallery] = useState(false);

  const [slides, setSlides] = useState(() => {
    const saved = localStorage.getItem('waveword-ai_ppt_slides');
    return saved ? JSON.parse(saved) : [
      {
        id: 'default-1',
        type: 'Title',
        title: 'WAVEWORD AI PRESENTATION',
        subtitle: 'Build stunning presentations instantly',
        content: 'Click anywhere to edit or apply a template from the right panel.',
        contentLeft: '',
        contentRight: '',
        animation: 'none',
        formatting: {}
      }
    ];
  });

  const [activeSlideId, setActiveSlideId] = useState(() => slides[0]?.id || 'default-1');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('waveword-ai_ppt_accent') || '#0284c7');
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('waveword-ai_ppt_bg') || '#f8fafc');
  const [textColor, setTextColor] = useState(() => localStorage.getItem('waveword-ai_ppt_text') || '#0f172a');
  const [bgGradient, setBgGradient] = useState(() => localStorage.getItem('waveword-ai_ppt_gradient') || 'none');
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('waveword-ai_ppt_aspect') || '16/10');
  const [transition, setTransition] = useState(() => localStorage.getItem('waveword-ai_ppt_transition') || 'fade');

  const [activeRibbonTab, setActiveRibbonTab] = useState('home');
  const [selectedField, setSelectedField] = useState('title');

  const [isPresenting, setIsPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const { addToast, clearToasts } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!showDownloadDropdown) return;
    const handleClose = () => setShowDownloadDropdown(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [showDownloadDropdown]);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0] || {};

  /* ── Auto-save ── */
  useEffect(() => {
    localStorage.setItem('waveword-ai_ppt_slides', JSON.stringify(slides));
    localStorage.setItem('waveword-ai_ppt_accent', accentColor);
    localStorage.setItem('waveword-ai_ppt_bg', bgColor);
    localStorage.setItem('waveword-ai_ppt_text', textColor);
    localStorage.setItem('waveword-ai_ppt_gradient', bgGradient);
    localStorage.setItem('waveword-ai_ppt_aspect', aspectRatio);
    localStorage.setItem('waveword-ai_ppt_transition', transition);
  }, [slides, accentColor, bgColor, textColor, bgGradient, aspectRatio, transition]);

  /* ── Keyboard navigation in present mode ── */
  useEffect(() => {
    const onKey = (e) => {
      if (!isPresenting) return;
      if (e.key === 'ArrowRight' || e.key === ' ') setPresentIndex(i => Math.min(i + 1, slides.length - 1));
      else if (e.key === 'ArrowLeft') setPresentIndex(i => Math.max(i - 1, 0));
      else if (e.key === 'Escape') setIsPresenting(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPresenting, slides.length]);

  const triggerConfetti = () => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

  /* ── Formatting helpers ── */
  const getFieldFormat = (slide, field) => {
    const s = slide || {};
    const defaults = {
      title: { bold: s.type === 'Title', italic: false, underline: false, strikethrough: false, shadow: false, color: accentColor, size: s.type === 'Title' ? 36 : 24, font: 'sans', align: s.type === 'Title' ? 'center' : 'left' },
      subtitle: { bold: false, italic: false, underline: false, strikethrough: false, shadow: false, color: '#64748b', size: 14, font: 'sans', align: s.type === 'Title' ? 'center' : 'left' },
      content: { bold: false, italic: s.type === 'Quote', underline: false, strikethrough: false, shadow: false, color: textColor, size: s.type === 'Quote' ? 20 : 12, font: s.type === 'Quote' ? 'serif' : 'sans', align: s.type === 'Quote' ? 'center' : 'left' },
      contentLeft: { bold: false, italic: false, underline: false, strikethrough: false, shadow: false, color: textColor, size: 12, font: 'sans', align: 'left' },
      contentRight: { bold: false, italic: false, underline: false, strikethrough: false, shadow: false, color: textColor, size: 12, font: 'sans', align: 'left' },
    };
    return s?.formatting?.[field] || defaults[field] || defaults.content;
  };

  const getFontFamily = (font) => {
    if (font === 'serif') return 'Georgia, serif';
    if (font === 'mono') return 'Courier New, monospace';
    return 'system-ui, -apple-system, sans-serif';
  };

  const getInputStyle = (field, slide = activeSlide, scale = 1) => {
    if (!slide) return {};
    const fmt = getFieldFormat(slide, field);
    return {
      fontWeight: fmt.bold ? 'bold' : 'normal',
      fontStyle: fmt.italic ? 'italic' : 'normal',
      textDecoration: [fmt.underline && 'underline', fmt.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
      textShadow: fmt.shadow ? '2px 2px 4px rgba(0,0,0,0.15)' : 'none',
      color: fmt.color || textColor,
      fontSize: `${Math.round(fmt.size * scale)}px`,
      textAlign: fmt.align || 'left',
      fontFamily: getFontFamily(fmt.font),
    };
  };

  const updateFormatValue = (field, key, value) => {
    const fmt = getFieldFormat(activeSlide, field);
    const updated = { ...fmt, [key]: value };
    setSlides(slides.map(s => s.id === activeSlide.id
      ? { ...s, formatting: { ...(s.formatting || {}), [field]: updated } }
      : s
    ));
  };

  const toggleFormatStyle = (field, key) => {
    const fmt = getFieldFormat(activeSlide, field);
    updateFormatValue(field, key, !fmt[key]);
  };

  /* ── Slide management ── */
  const updateSlideField = (id, field, value) =>
    setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addSlide = (type = 'Content') => {
    const id = Date.now().toString();
    const newSlide = {
      id, type,
      title: type === 'Title' ? 'NEW SLIDE TITLE' : 'Section Heading',
      subtitle: 'Optional subtitle text here',
      content: type === 'Quote' ? '"Add quote here."' : '• Point one\n• Point two',
      contentLeft: 'Left column text...',
      contentRight: 'Right column text...',
      animation: 'none',
      formatting: {}
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(id);
  };

  const duplicateSlide = (id) => {
    const src = slides.find(s => s.id === id);
    if (!src) return;
    const clone = { ...src, id: Date.now().toString() + Math.random().toString(36).slice(2, 6), formatting: JSON.parse(JSON.stringify(src.formatting || {})) };
    const idx = slides.findIndex(s => s.id === id);
    const next = [...slides];
    next.splice(idx + 1, 0, clone);
    setSlides(next);
    setActiveSlideId(clone.id);
    addToast('Slide duplicated!', 'success');
  };

  const deleteSlide = (id) => {
    if (slides.length <= 1) { addToast('Cannot delete the last slide.', 'error'); return; }
    const idx = slides.findIndex(s => s.id === id);
    const next = slides.filter(s => s.id !== id);
    setSlides(next);
    if (activeSlideId === id) setActiveSlideId(next[Math.max(0, idx - 1)].id);
  };

  const moveSlide = (idx, dir) => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
  };

  const applyTemplate = (template) => {
    setAccentColor(template.accent);
    setBgColor(template.bg);
    setTextColor(template.text);
    setBgGradient('none');
    const newSlides = template.slides.map(s => ({
      ...s,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      animation: 'none',
      formatting: {}
    }));
    setSlides(newSlides);
    setActiveSlideId(newSlides[0].id);
    setShowGallery(false);
    addToast(`Template "${template.name}" applied!`, 'success');
  };

  const resetDeck = () => {
    if (!window.confirm('Reset all slides?')) return;
    const def = [{ id: 'default-1', type: 'Title', title: 'NEW PRESENTATION', subtitle: 'Double click to start building', content: 'Add details here.', contentLeft: '', contentRight: '', animation: 'none', formatting: {} }];
    setSlides(def);
    setActiveSlideId('default-1');
    setBgColor('#f8fafc'); setTextColor('#0f172a'); setBgGradient('none'); setAccentColor('#0284c7');
    addToast('Reset complete', 'success');
  };

  /* ── CSS animation classes ── */
  const getTransitionClass = () => {
    const map = { fade: 'ppt-trans-fade', slide: 'ppt-trans-slide', zoom: 'ppt-trans-zoom', wipe: 'ppt-trans-wipe', push: 'ppt-trans-push', split: 'ppt-trans-split', morph: 'ppt-trans-morph', reveal: 'ppt-trans-reveal', 'fall-over': 'ppt-trans-fall-over' };
    return map[transition.toLowerCase().replace(' ', '-')] || '';
  };

  const getAnimationClass = (slide) => {
    const anim = (slide?.animation || 'none').toLowerCase().replace(' ', '-').replace('&', '');
    const map = { appear: 'ppt-anim-appear', fade: 'ppt-anim-fade', 'fly-in': 'ppt-anim-fly-in', 'float-in': 'ppt-anim-float-in', 'grow-turn': 'ppt-anim-grow-turn', zoom: 'ppt-anim-zoom' };
    return map[anim] || '';
  };

  /* ── PDF export ── */
  const applyPDFFont = (pdf, fmt, defaultSize) => {
    const family = fmt.font === 'serif' ? 'times' : fmt.font === 'mono' ? 'courier' : 'helvetica';
    const style = fmt.bold && fmt.italic ? 'bolditalic' : fmt.bold ? 'bold' : fmt.italic ? 'italic' : 'normal';
    pdf.setFont(family, style);
    pdf.setFontSize(fmt.size || defaultSize);
    if (fmt.color) {
      const hex = fmt.color.replace('#', '');
      pdf.setTextColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    } else {
      pdf.setTextColor(textColor);
    }
  };

  const buildPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    slides.forEach((slide, i) => {
      if (i > 0) pdf.addPage();
      pdf.setFillColor(bgColor);
      pdf.rect(0, 0, W, H, 'F');
      pdf.setFillColor(accentColor);
      pdf.rect(0, 0, W, 5, 'F');

      if (slide.type === 'Title') {
        const tf = getFieldFormat(slide, 'title');
        applyPDFFont(pdf, tf, 36);
        const tl = pdf.splitTextToSize((slide.title || '').toUpperCase(), W - 60);
        pdf.text(tl, W / 2, 85, { align: tf.align === 'left' ? 'left' : tf.align === 'right' ? 'right' : 'center' });
        const sf = getFieldFormat(slide, 'subtitle');
        applyPDFFont(pdf, sf, 18);
        pdf.text(slide.subtitle || '', W / 2, 115, { align: 'center' });
        const cf = getFieldFormat(slide, 'content');
        applyPDFFont(pdf, cf, 14);
        pdf.text(slide.content || '', W / 2, 140, { align: 'center' });
      } else if (slide.type === 'Quote') {
        const cf = getFieldFormat(slide, 'content');
        applyPDFFont(pdf, cf, 24);
        const ql = pdf.splitTextToSize(slide.content || '', W - 80);
        pdf.text(ql, W / 2, 90, { align: 'center' });
        const tf = getFieldFormat(slide, 'title');
        applyPDFFont(pdf, tf, 14);
        pdf.text((slide.title || '').toUpperCase(), W / 2, 140, { align: 'center' });
      } else if (slide.type === 'Split') {
        const tf = getFieldFormat(slide, 'title');
        applyPDFFont(pdf, tf, 22);
        pdf.text((slide.title || '').toUpperCase(), 25, 28);
        const sf = getFieldFormat(slide, 'subtitle');
        applyPDFFont(pdf, sf, 12);
        pdf.text(slide.subtitle || '', 25, 36);
        pdf.setFillColor(accentColor); pdf.rect(25, 42, 40, 2, 'F');
        const lf = getFieldFormat(slide, 'contentLeft');
        applyPDFFont(pdf, lf, 11);
        const ll = pdf.splitTextToSize(slide.contentLeft || '', W / 2 - 35);
        pdf.text(ll, 25, 58);
        const rf = getFieldFormat(slide, 'contentRight');
        applyPDFFont(pdf, rf, 11);
        const rl = pdf.splitTextToSize(slide.contentRight || '', W / 2 - 35);
        pdf.text(rl, W / 2 + 10, 58);
      } else {
        const tf = getFieldFormat(slide, 'title');
        applyPDFFont(pdf, tf, 24);
        pdf.text((slide.title || '').toUpperCase(), 25, 30);
        const sf = getFieldFormat(slide, 'subtitle');
        applyPDFFont(pdf, sf, 12);
        pdf.text(slide.subtitle || '', 25, 38);
        pdf.setFillColor(accentColor); pdf.rect(25, 44, 50, 2.5, 'F');
        const cf = getFieldFormat(slide, 'content');
        applyPDFFont(pdf, cf, 13);
        const cl = pdf.splitTextToSize(slide.content || '', W - 50);
        pdf.text(cl, 25, 60);
      }
      pdf.setFontSize(9); pdf.setTextColor(148, 163, 184);
      pdf.text(`${i + 1} / ${slides.length}`, W - 20, H - 10);
    });
    return pdf;
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    addToast('Verifying credits...', 'loading');
    try {
      await axios.post(`${API}/payments/credits/deduct`, { toolKey: 'ppt' });
      addToast('Generating PDF...', 'loading');
      buildPDF().save('Presentation.pdf');
      clearToasts(); addToast('Downloaded!', 'success'); triggerConfetti();
    } catch (e) { 
      clearToasts(); 
      addToast(e.response?.data?.message || 'Export failed.', 'error'); 
    }
    finally { setIsGenerating(false); }
  };

  const handleDownloadPPTX = async () => {
    setIsGenerating(true);
    addToast('Verifying credits...', 'loading');
    try {
      await axios.post(`${API}/payments/credits/deduct`, { toolKey: 'ppt' });
      addToast('Preparing PowerPoint...', 'loading');
      
      let pptxgen = window.pptxgen || window.PptxGenJS;
      if (!pptxgen) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
          script.onload = () => resolve();
          script.onerror = (err) => reject(err);
          document.body.appendChild(script);
        });
        pptxgen = window.pptxgen || window.PptxGenJS;
      }

      if (!pptxgen) {
        throw new Error('PptxGenJS library failed to load');
      }

      const pptx = new pptxgen();
      pptx.layout = aspectRatio === '16/10' ? 'LAYOUT_16x9' : 'LAYOUT_4x3';

      slides.forEach((slide) => {
        const pptSlide = pptx.addSlide();
        // Convert backgrounds
        pptSlide.background = { color: bgColor.replace('#', '') };

        // Accent line on top of each slide
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: 0.1,
          fill: { color: accentColor.replace('#', '') }
        });

        const tf = getFieldFormat(slide, 'title');
        const sf = getFieldFormat(slide, 'subtitle');
        const cf = getFieldFormat(slide, 'content');

        const mapFont = (fontFamily) => {
          if (fontFamily === 'serif') return 'Georgia';
          if (fontFamily === 'mono') return 'Courier New';
          return 'Arial';
        };

        if (slide.type === 'Title') {
          pptSlide.addText(slide.title || '', {
            x: '5%', y: '25%', w: '90%', h: '20%',
            align: tf.align || 'center',
            fontSize: tf.size || 32,
            color: tf.color ? tf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(tf.font),
            bold: !!tf.bold,
            italic: !!tf.italic,
            underline: !!tf.underline,
            strike: !!tf.strikethrough
          });

          pptSlide.addText(slide.subtitle || '', {
            x: '5%', y: '48%', w: '90%', h: '12%',
            align: sf.align || 'center',
            fontSize: sf.size || 16,
            color: sf.color ? sf.color.replace('#', '') : '64748b',
            fontFace: mapFont(sf.font),
            bold: !!sf.bold,
            italic: !!sf.italic,
            underline: !!sf.underline,
            strike: !!sf.strikethrough
          });

          if (slide.content) {
            pptSlide.addText(slide.content, {
              x: '5%', y: '63%', w: '90%', h: '25%',
              align: cf.align || 'center',
              fontSize: cf.size || 12,
              color: cf.color ? cf.color.replace('#', '') : textColor.replace('#', ''),
              fontFace: mapFont(cf.font),
              bold: !!cf.bold,
              italic: !!cf.italic,
              underline: !!cf.underline,
              strike: !!cf.strikethrough
            });
          }
        } else if (slide.type === 'Quote') {
          pptSlide.addText(slide.content || '', {
            x: '10%', y: '20%', w: '80%', h: '40%',
            align: cf.align || 'center',
            fontSize: cf.size || 22,
            color: cf.color ? cf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(cf.font),
            bold: !!cf.bold,
            italic: !!cf.italic,
            underline: !!cf.underline,
            strike: !!cf.strikethrough
          });

          pptSlide.addText(slide.title || '', {
            x: '10%', y: '65%', w: '80%', h: '10%',
            align: tf.align || 'center',
            fontSize: tf.size || 14,
            color: tf.color ? tf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(tf.font),
            bold: !!tf.bold,
            italic: !!tf.italic,
            underline: !!tf.underline,
            strike: !!tf.strikethrough
          });

          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: '10%', y: '75%', w: '80%', h: '10%',
              align: sf.align || 'center',
              fontSize: sf.size || 12,
              color: sf.color ? sf.color.replace('#', '') : '64748b',
              fontFace: mapFont(sf.font),
              bold: !!sf.bold,
              italic: !!sf.italic,
              underline: !!sf.underline,
              strike: !!sf.strikethrough
            });
          }
        } else if (slide.type === 'Split') {
          pptSlide.addText(slide.title || '', {
            x: '5%', y: '8%', w: '90%', h: '10%',
            align: tf.align || 'left',
            fontSize: tf.size || 24,
            color: tf.color ? tf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(tf.font),
            bold: !!tf.bold,
            italic: !!tf.italic,
            underline: !!tf.underline,
            strike: !!tf.strikethrough
          });

          pptSlide.addText(slide.subtitle || '', {
            x: '5%', y: '18%', w: '90%', h: '8%',
            align: sf.align || 'left',
            fontSize: sf.size || 12,
            color: sf.color ? sf.color.replace('#', '') : '64748b',
            fontFace: mapFont(sf.font),
            bold: !!sf.bold,
            italic: !!sf.italic,
            underline: !!sf.underline,
            strike: !!sf.strikethrough
          });

          pptSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 1.6, w: 1.5, h: 0.05,
            fill: { color: accentColor.replace('#', '') }
          });

          const lf = getFieldFormat(slide, 'contentLeft');
          const rf = getFieldFormat(slide, 'contentRight');

          pptSlide.addText(slide.contentLeft || '', {
            x: '5%', y: '30%', w: '42%', h: '60%',
            align: lf.align || 'left',
            fontSize: lf.size || 12,
            color: lf.color ? lf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(lf.font),
            bold: !!lf.bold,
            italic: !!lf.italic,
            underline: !!lf.underline,
            strike: !!lf.strikethrough
          });

          pptSlide.addText(slide.contentRight || '', {
            x: '53%', y: '30%', w: '42%', h: '60%',
            align: rf.align || 'left',
            fontSize: rf.size || 12,
            color: rf.color ? rf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(rf.font),
            bold: !!rf.bold,
            italic: !!rf.italic,
            underline: !!rf.underline,
            strike: !!rf.strikethrough
          });
        } else {
          pptSlide.addText(slide.title || '', {
            x: '5%', y: '8%', w: '90%', h: '10%',
            align: tf.align || 'left',
            fontSize: tf.size || 24,
            color: tf.color ? tf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(tf.font),
            bold: !!tf.bold,
            italic: !!tf.italic,
            underline: !!tf.underline,
            strike: !!tf.strikethrough
          });

          pptSlide.addText(slide.subtitle || '', {
            x: '5%', y: '18%', w: '90%', h: '8%',
            align: sf.align || 'left',
            fontSize: sf.size || 12,
            color: sf.color ? sf.color.replace('#', '') : '64748b',
            fontFace: mapFont(sf.font),
            bold: !!sf.bold,
            italic: !!sf.italic,
            underline: !!sf.underline,
            strike: !!sf.strikethrough
          });

          pptSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 1.6, w: 2.0, h: 0.05,
            fill: { color: accentColor.replace('#', '') }
          });

          pptSlide.addText(slide.content || '', {
            x: '5%', y: '30%', w: '90%', h: '60%',
            align: cf.align || 'left',
            fontSize: cf.size || 13,
            color: cf.color ? cf.color.replace('#', '') : textColor.replace('#', ''),
            fontFace: mapFont(cf.font),
            bold: !!cf.bold,
            italic: !!cf.italic,
            underline: !!cf.underline,
            strike: !!cf.strikethrough
          });
        }
      });

      await pptx.writeFile({ fileName: 'Presentation.pptx' });
      clearToasts(); addToast('PowerPoint downloaded!', 'success'); triggerConfetti();
    } catch (e) {
      console.error(e);
      clearToasts(); addToast('PPTX export failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCloud = async () => {
    setIsSavingCloud(true);
    addToast('Verifying credits...', 'loading');
    try {
      await axios.post(`${API}/payments/credits/deduct`, { toolKey: 'ppt' });
      addToast('Saving to cloud...', 'loading');
      const blob = buildPDF().output('blob');
      const fd = new FormData();
      fd.append('file', new File([blob], `Presentation_${Date.now()}.pdf`, { type: 'application/pdf' }));
      fd.append('toolSource', 'ppt');
      await axios.post(`${API}/files/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearToasts(); addToast('Saved to Cloud!', 'success'); triggerConfetti();
    } catch (e) { 
      clearToasts(); 
      addToast(e.response?.data?.message || 'Save failed.', 'error'); 
    }
    finally { setIsSavingCloud(false); }
  };

  /* ─────────────────────── SLIDE CANVAS RENDERER ─────────────────────── */
  const renderSlideContent = (slide, isPresenter = false) => {
    const scale = isPresenter ? 1.3 : 1;
    if (!slide) return null;

    if (slide.type === 'Title') {
      return (
        <div key={`${slide.id}-${slide.animation}`} className={`flex-1 flex flex-col justify-center items-center text-center px-4 ${getAnimationClass(slide)}`}>
          {isPresenter ? (
            <>
              <h1 style={getInputStyle('title', slide, scale)} className="w-full uppercase tracking-tight mb-3">{slide.title}</h1>
              <p style={getInputStyle('subtitle', slide, scale)} className="w-full mb-6">{slide.subtitle}</p>
              <p style={getInputStyle('content', slide, scale)} className="w-full whitespace-pre-line">{slide.content}</p>
            </>
          ) : (
            <>
              <input type="text" value={slide.title} onFocus={() => setSelectedField('title')} onChange={e => updateSlideField(slide.id, 'title', e.target.value)} placeholder="CLICK TO ADD TITLE" className="bg-transparent border-none focus:ring-0 focus:outline-none w-full uppercase tracking-tight mb-2" style={getInputStyle('title', slide)} />
              <input type="text" value={slide.subtitle} onFocus={() => setSelectedField('subtitle')} onChange={e => updateSlideField(slide.id, 'subtitle', e.target.value)} placeholder="Add subtitle..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full mb-4" style={getInputStyle('subtitle', slide)} />
              <textarea value={slide.content} onFocus={() => setSelectedField('content')} onChange={e => updateSlideField(slide.id, 'content', e.target.value)} placeholder="Presenter notes or body text..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full resize-none h-14" style={getInputStyle('content', slide)} />
            </>
          )}
        </div>
      );
    }

    if (slide.type === 'Quote') {
      return (
        <div key={`${slide.id}-${slide.animation}`} className={`flex-1 flex flex-col justify-center items-center text-center px-8 ${getAnimationClass(slide)}`}>
          {isPresenter ? (
            <>
              <p style={getInputStyle('content', slide, scale)} className="w-full leading-relaxed mb-5">{slide.content}</p>
              <p style={getInputStyle('title', slide, scale)} className="w-full uppercase tracking-widest">{slide.title}</p>
              <p style={getInputStyle('subtitle', slide, scale)} className="w-full">{slide.subtitle}</p>
            </>
          ) : (
            <>
              <textarea value={slide.content} onFocus={() => setSelectedField('content')} onChange={e => updateSlideField(slide.id, 'content', e.target.value)} placeholder='"Enter your quote here..."' className="bg-transparent border-none focus:ring-0 focus:outline-none w-full resize-none h-24 mb-3 leading-relaxed" style={getInputStyle('content', slide)} />
              <input type="text" value={slide.title} onFocus={() => setSelectedField('title')} onChange={e => updateSlideField(slide.id, 'title', e.target.value)} placeholder="Author Name" className="bg-transparent border-none focus:ring-0 focus:outline-none w-full uppercase tracking-wider" style={getInputStyle('title', slide)} />
              <input type="text" value={slide.subtitle} onFocus={() => setSelectedField('subtitle')} onChange={e => updateSlideField(slide.id, 'subtitle', e.target.value)} placeholder="Author Title / Context" className="bg-transparent border-none focus:ring-0 focus:outline-none w-full" style={getInputStyle('subtitle', slide)} />
            </>
          )}
        </div>
      );
    }

    if (slide.type === 'Split') {
      return (
        <div key={`${slide.id}-${slide.animation}`} className={`flex flex-col h-full justify-between ${getAnimationClass(slide)}`}>
          <div>
            {isPresenter ? (
              <>
                <h2 style={getInputStyle('title', slide, scale)} className="w-full uppercase tracking-tight">{slide.title}</h2>
                <p style={getInputStyle('subtitle', slide, scale)} className="w-full mt-1">{slide.subtitle}</p>
              </>
            ) : (
              <>
                <input type="text" value={slide.title} onFocus={() => setSelectedField('title')} onChange={e => updateSlideField(slide.id, 'title', e.target.value)} placeholder="SPLIT TITLE" className="bg-transparent border-none focus:ring-0 focus:outline-none w-full uppercase tracking-tight" style={getInputStyle('title', slide)} />
                <input type="text" value={slide.subtitle} onFocus={() => setSelectedField('subtitle')} onChange={e => updateSlideField(slide.id, 'subtitle', e.target.value)} placeholder="Add description..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full mt-0.5" style={getInputStyle('subtitle', slide)} />
              </>
            )}
            <div className="h-[2px] w-12 my-2" style={{ backgroundColor: accentColor }} />
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1 mt-2">
            <div className="border-r border-slate-200/50 pr-4">
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Column Left</span>
              {isPresenter ? (
                <p style={getInputStyle('contentLeft', slide, scale)} className="w-full mt-2 leading-relaxed whitespace-pre-line">{slide.contentLeft}</p>
              ) : (
                <textarea value={slide.contentLeft} onFocus={() => setSelectedField('contentLeft')} onChange={e => updateSlideField(slide.id, 'contentLeft', e.target.value)} placeholder="Left column content..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full h-full resize-none mt-2 leading-relaxed" style={getInputStyle('contentLeft', slide)} />
              )}
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Column Right</span>
              {isPresenter ? (
                <p style={getInputStyle('contentRight', slide, scale)} className="w-full mt-2 leading-relaxed whitespace-pre-line">{slide.contentRight}</p>
              ) : (
                <textarea value={slide.contentRight} onFocus={() => setSelectedField('contentRight')} onChange={e => updateSlideField(slide.id, 'contentRight', e.target.value)} placeholder="Right column content..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full h-full resize-none mt-2 leading-relaxed" style={getInputStyle('contentRight', slide)} />
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default: Title + Content
    return (
      <div key={`${slide.id}-${slide.animation}`} className={`flex flex-col h-full justify-between ${getAnimationClass(slide)}`}>
        <div>
          {isPresenter ? (
            <>
              <h2 style={getInputStyle('title', slide, scale)} className="w-full uppercase tracking-tight">{slide.title}</h2>
              <p style={getInputStyle('subtitle', slide, scale)} className="w-full mt-0.5">{slide.subtitle}</p>
            </>
          ) : (
            <>
              <input type="text" value={slide.title} onFocus={() => setSelectedField('title')} onChange={e => updateSlideField(slide.id, 'title', e.target.value)} placeholder="SLIDE TITLE" className="bg-transparent border-none focus:ring-0 focus:outline-none w-full uppercase tracking-tight" style={getInputStyle('title', slide)} />
              <input type="text" value={slide.subtitle} onFocus={() => setSelectedField('subtitle')} onChange={e => updateSlideField(slide.id, 'subtitle', e.target.value)} placeholder="Add description..." className="bg-transparent border-none focus:ring-0 focus:outline-none w-full mt-0.5" style={getInputStyle('subtitle', slide)} />
            </>
          )}
          <div className="h-[3px] w-14 my-2" style={{ backgroundColor: accentColor }} />
        </div>
        {isPresenter ? (
          <p style={getInputStyle('content', slide, scale)} className="flex-1 leading-relaxed whitespace-pre-line mt-2">{slide.content}</p>
        ) : (
          <textarea value={slide.content} onFocus={() => setSelectedField('content')} onChange={e => updateSlideField(slide.id, 'content', e.target.value)} placeholder="Start typing content..." className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none w-full resize-none mt-2 leading-relaxed" style={getInputStyle('content', slide)} />
        )}
      </div>
    );
  };

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col p-4 md:p-5 bg-slate-50/50">
      <style>{`
        @keyframes ppt-fade { from{opacity:0}to{opacity:1} }
        @keyframes ppt-slide-in { from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1} }
        @keyframes ppt-zoom-in { from{transform:scale(0.88);opacity:0}to{transform:scale(1);opacity:1} }
        @keyframes ppt-wipe { from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)} }
        @keyframes ppt-push { from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes ppt-split { from{clip-path:inset(0 50% 0 50%)}to{clip-path:inset(0 0 0 0)} }
        @keyframes ppt-morph { from{opacity:0;filter:blur(8px)}to{opacity:1;filter:blur(0)} }
        @keyframes ppt-reveal { from{opacity:0;transform:scale(0.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ppt-fall { from{transform:rotate(-5deg) translateY(-20px);opacity:0;transform-origin:top left}to{transform:rotate(0) translateY(0);opacity:1} }
        @keyframes ppt-fly-in { from{transform:translateY(35px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes ppt-float-in { from{transform:translateY(-25px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes ppt-grow-turn { from{transform:scale(0.65) rotate(-8deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1} }
        .ppt-trans-fade{animation:ppt-fade 0.45s ease-out both}
        .ppt-trans-slide{animation:ppt-slide-in 0.45s cubic-bezier(.16,1,.3,1) both}
        .ppt-trans-zoom{animation:ppt-zoom-in 0.45s cubic-bezier(.34,1.56,.64,1) both}
        .ppt-trans-wipe{animation:ppt-wipe 0.5s ease-in-out both}
        .ppt-trans-push{animation:ppt-push 0.45s cubic-bezier(.16,1,.3,1) both}
        .ppt-trans-split{animation:ppt-split 0.5s ease-in-out both}
        .ppt-trans-morph{animation:ppt-morph 0.55s ease-out both}
        .ppt-trans-reveal{animation:ppt-reveal 0.5s cubic-bezier(.16,1,.3,1) both}
        .ppt-trans-fall-over{animation:ppt-fall 0.55s cubic-bezier(.175,.885,.32,1.275) both}
        .ppt-anim-appear{animation:ppt-fade 0.15s ease-out both}
        .ppt-anim-fade{animation:ppt-fade 0.6s ease-out both}
        .ppt-anim-fly-in{animation:ppt-fly-in 0.5s cubic-bezier(.16,1,.3,1) both}
        .ppt-anim-float-in{animation:ppt-float-in 0.55s ease-out both}
        .ppt-anim-grow-turn{animation:ppt-grow-turn 0.55s cubic-bezier(.34,1.56,.64,1) both}
        .ppt-anim-zoom{animation:ppt-zoom-in 0.45s cubic-bezier(.34,1.56,.64,1) both}
      `}</style>

      {/* Template Gallery overlay */}
      {showGallery && <TemplateGallery onSelect={applyTemplate} onClose={() => setShowGallery(false)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl border border-brand-100 shadow-sm">
            <Presentation size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              PowerSlide <span className="text-brand-600">Studio</span>
              <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full border border-brand-100">PRO</span>
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full border border-yellow-100 shadow-sm ml-2">
                <Zap size={10} className="fill-current" />
                <span className="text-[10px] font-black tracking-tight uppercase">Cost: 20 Credits</span>
              </div>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">Hybrid of PowerPoint + Google Slides</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button onClick={() => setShowGallery(true)} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all active:scale-95">
            <Grid size={14} /> Templates
          </button>
          <button onClick={resetDeck} className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all active:scale-95">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={() => { setPresentIndex(0); setIsPresenting(true); }} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-sm active:scale-95">
            <Play size={14} className="text-slate-500" /> Present
          </button>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} disabled={isGenerating} className="flex items-center gap-2 bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50">
              <Download size={14} /> Download
            </button>
            {showDownloadDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                <button
                  onClick={() => {
                    setShowDownloadDropdown(false);
                    handleDownload();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors"
                >
                  <FileText size={14} className="text-slate-400" />
                  PDF Document (.pdf)
                </button>
                <button
                  onClick={() => {
                    setShowDownloadDropdown(false);
                    handleDownloadPPTX();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Presentation size={14} className="text-slate-400" />
                  PowerPoint Presentation (.pptx)
                </button>
              </div>
            )}
          </div>
          <button onClick={handleSaveCloud} disabled={isSavingCloud} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
            <Cloud size={14} /> Save Cloud
          </button>
        </div>
      </div>

      {/* ── Ribbon ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 overflow-hidden shrink-0">
        <div className="flex bg-slate-50 border-b border-slate-200 px-4 overflow-x-auto whitespace-nowrap custom-scrollbar">
          {[
            { id: 'home', label: 'Home (Font)' },
            { id: 'design', label: 'Design (Theme)' },
            { id: 'transitions', label: 'Transitions' },
            { id: 'animations', label: 'Animations' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveRibbonTab(tab.id)}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeRibbonTab === tab.id ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-2.5 bg-white flex items-center flex-wrap gap-3 min-h-[52px]">

          {/* HOME TAB */}
          {activeRibbonTab === 'home' && (
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Font Family */}
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <select value={getFieldFormat(activeSlide, selectedField).font}
                  onChange={e => updateFormatValue(selectedField, 'font', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 border-none focus:ring-0 focus:outline-none py-1.5 px-2 pr-6">
                  <option value="sans">Segoe UI (Sans)</option>
                  <option value="serif">Georgia (Serif)</option>
                  <option value="mono">Courier (Mono)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <select value={getFieldFormat(activeSlide, selectedField).size}
                  onChange={e => updateFormatValue(selectedField, 'size', parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 border-none focus:ring-0 focus:outline-none py-1.5 px-2 pr-6">
                  {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64].map(sz => (
                    <option key={sz} value={sz}>{sz}px</option>
                  ))}
                </select>
                <button onClick={() => updateFormatValue(selectedField, 'size', Math.min(96, getFieldFormat(activeSlide, selectedField).size + 2))} className="px-1.5 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-extrabold border-l border-slate-200">A⁺</button>
                <button onClick={() => updateFormatValue(selectedField, 'size', Math.max(8, getFieldFormat(activeSlide, selectedField).size - 2))} className="px-1.5 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-extrabold border-l border-slate-200">A⁻</button>
              </div>

              {/* Style toggles */}
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-x divide-slate-200">
                {[
                  { key: 'bold', label: 'B', cls: 'font-black' },
                  { key: 'italic', label: 'I', cls: 'italic' },
                  { key: 'underline', label: 'U', cls: 'underline' },
                  { key: 'strikethrough', label: 'S', cls: 'line-through' },
                  { key: 'shadow', label: 'Sh', cls: '' },
                ].map(({ key, label, cls }) => (
                  <button key={key} onClick={() => toggleFormatStyle(selectedField, key)}
                    className={`px-2.5 py-1.5 text-xs ${cls} transition-colors ${getFieldFormat(activeSlide, selectedField)[key] ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    title={key}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Alignment */}
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-x divide-slate-200">
                {[
                  { val: 'left', icon: <AlignLeft size={13} /> },
                  { val: 'center', icon: <AlignCenter size={13} /> },
                  { val: 'right', icon: <AlignRight size={13} /> },
                ].map(({ val, icon }) => (
                  <button key={val} onClick={() => updateFormatValue(selectedField, 'align', val)}
                    className={`px-2.5 py-1.5 transition-colors ${getFieldFormat(activeSlide, selectedField).align === val ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {icon}
                  </button>
                ))}
              </div>

              {/* Color */}
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl border border-slate-200 px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-500">Color:</span>
                <input type="color" value={getFieldFormat(activeSlide, selectedField).color || textColor}
                  onChange={e => updateFormatValue(selectedField, 'color', e.target.value)}
                  className="w-5 h-5 border-none cursor-pointer rounded bg-transparent" />
              </div>

              <div className="text-[10px] text-slate-400 border-l border-slate-200 pl-3 font-semibold">
                Editing: <span className="text-brand-600 font-black uppercase">{selectedField}</span>
              </div>
            </div>
          )}

          {/* DESIGN TAB */}
          {activeRibbonTab === 'design' && (
            <div className="flex items-center flex-wrap gap-4 w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 mr-1">Themes:</span>
                {BACKGROUND_PRESETS.map(p => (
                  <button key={p.bg} onClick={() => { setBgColor(p.bg); setTextColor(p.text); setBgGradient('none'); }}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${bgColor === p.bg && bgGradient === 'none' ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 mr-1">Gradients:</span>
                {GRADIENTS.map(g => (
                  <button key={g.name} onClick={() => { setBgGradient(g.value); if (g.value !== 'none' && g.name === 'Cosmo Dark') setTextColor('#f8fafc'); else if (g.value !== 'none') setTextColor('#0f172a'); }}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${bgGradient === g.value ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                    style={{ backgroundImage: g.value !== 'none' ? g.value : 'none', color: g.value !== 'none' && g.name !== 'Cosmo Dark' ? '#1e293b' : undefined }}>
                    {g.name}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 mr-1">Accent:</span>
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-6 h-6 border border-slate-200 rounded cursor-pointer" />
              </div>
            </div>
          )}

          {/* TRANSITIONS TAB */}
          {activeRibbonTab === 'transitions' && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Select Transition:</span>
              {TRANSITIONS.map(t => (
                <button key={t} onClick={() => { setTransition(t.toLowerCase().replace(' ', '-')); addToast(`Transition: ${t}`, 'success'); }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${transition === t.toLowerCase().replace(' ', '-') ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* ANIMATIONS TAB */}
          {activeRibbonTab === 'animations' && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Enter Animation:</span>
              {ANIMATIONS.map(a => {
                const val = a.toLowerCase().replace(/ & /g, '-').replace(' ', '-');
                return (
                  <button key={a} onClick={() => { updateSlideField(activeSlide.id, 'animation', val); addToast(`Animation: ${a}`, 'success'); }}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${activeSlide.animation === val ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden min-h-0 custom-scrollbar">

        {/* Left: Slide Panel */}
        <div className="w-full lg:w-48 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col shrink-0 lg:overflow-hidden h-[200px] lg:h-auto">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 shrink-0">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Slides ({slides.length})</span>
            <button onClick={() => addSlide('Content')} className="p-1 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-brand-100" title="Add Slide">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto flex-1 p-2 custom-scrollbar">
            {slides.map((slide, idx) => (
              <div key={slide.id} onClick={() => setActiveSlideId(slide.id)}
                className={`relative group cursor-pointer rounded-xl transition-all min-w-[140px] lg:min-w-0 ${activeSlideId === slide.id ? 'ring-2 ring-brand-500' : 'hover:bg-slate-50'}`}>
                <div className="w-full aspect-[16/10] rounded-xl flex flex-col p-2 relative justify-center overflow-hidden border border-slate-200/60"
                  style={{ backgroundColor: bgColor, backgroundImage: bgGradient !== 'none' ? bgGradient : 'none' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accentColor }} />
                  <span className="absolute top-1 left-1 bg-slate-900/60 text-white text-[7px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded">{idx + 1}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wide text-center truncate px-3" style={{ color: accentColor }}>{slide.title || 'Untitled'}</span>
                  <span className="text-[6px] text-center truncate px-3 mt-0.5" style={{ color: textColor, opacity: 0.5 }}>{slide.type}</span>
                </div>
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); moveSlide(idx, 'up'); }} disabled={idx === 0} className="p-0.5 bg-white border border-slate-200 rounded text-slate-500 disabled:opacity-30"><ChevronUp size={8} /></button>
                  <button onClick={e => { e.stopPropagation(); moveSlide(idx, 'down'); }} disabled={idx === slides.length - 1} className="p-0.5 bg-white border border-slate-200 rounded text-slate-500 disabled:opacity-30"><ChevronDown size={8} /></button>
                  <button onClick={e => { e.stopPropagation(); duplicateSlide(slide.id); }} className="p-0.5 bg-white border border-slate-200 rounded text-brand-600"><Copy size={8} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteSlide(slide.id); }} className="p-0.5 bg-white border border-slate-200 rounded text-red-500"><Trash2 size={8} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-slate-200/50 rounded-3xl border border-slate-100 shadow-inner flex flex-col p-2 sm:p-4 overflow-hidden min-h-[400px]">
          {/* Layout bar */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-2 mb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-2 shrink-0">Layout:</span>
              {LAYOUTS.map(lay => {
                const Icon = lay.icon;
                return (
                  <button key={lay.type} onClick={() => updateSlideField(activeSlide.id, 'type', lay.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 uppercase tracking-widest ${activeSlide.type === lay.type ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'hover:bg-slate-100 text-slate-600 border border-transparent'}`}>
                    <Icon size={11} />{lay.name}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {['16/10', '4/3'].map(r => (
                <button key={r} onClick={() => setAspectRatio(r)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${aspectRatio === r ? 'border-brand-400 text-brand-600 bg-brand-50' : 'border-slate-200 text-slate-500'}`}>
                  {r === '16/10' ? '16:10' : '4:3'}
                </button>
              ))}
              <span className="text-[9px] font-medium text-slate-400 hidden sm:block ml-1">Click to edit inline</span>
            </div>
          </div>

          {/* Slide canvas */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            <div
              key={`${activeSlide.id}-${transition}`}
              className={`w-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-3xl border border-slate-200/60 relative p-8 md:p-10 overflow-hidden flex flex-col justify-between ${getTransitionClass()}`}
              style={{
                aspectRatio: aspectRatio === '16/10' ? '16/10' : '4/3',
                maxWidth: aspectRatio === '16/10' ? 'min(100%, calc((100vh - 340px) * 1.6))' : 'min(100%, calc((100vh - 340px) * 1.33))',
                backgroundColor: bgColor,
                backgroundImage: bgGradient !== 'none' ? bgGradient : 'none',
                color: textColor,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ backgroundColor: accentColor }} />
              {renderSlideContent(activeSlide, false)}
              <div className="flex justify-between items-center text-[8px] text-slate-400 mt-2 border-t border-slate-100/50 pt-2 shrink-0">
                <span>{activeSlide.type} layout</span>
                <span>Slide {slides.findIndex(s => s.id === activeSlide.id) + 1} of {slides.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Templates quick panel */}
        <div className="w-full lg:w-64 bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col gap-4 shrink-0 lg:overflow-y-auto">
          <div>
            <h3 className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest mb-3">
              <Sparkles size={13} className="text-brand-500" /> Quick Templates
            </h3>
            <button onClick={() => setShowGallery(true)}
              className="w-full py-2.5 px-3 mb-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center">
              <Grid size={13} /> Browse All Templates
            </button>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATE_CATEGORIES[0].templates.filter(t => !t.isBlank).slice(0, 5).map(tmpl => (
                <button key={tmpl.id} onClick={() => applyTemplate(tmpl)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-brand-50/40 rounded-xl border border-slate-200/60 hover:border-brand-200 text-left transition-all group flex items-center gap-2.5">
                  <div className="w-8 h-6 rounded-lg shrink-0 overflow-hidden border border-slate-200 flex items-end" style={{ backgroundColor: tmpl.bg }}>
                    <div className="w-full h-1" style={{ backgroundColor: tmpl.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-brand-700 truncate">{tmpl.name}</p>
                    <p className="text-[9px] text-slate-400">{tmpl.slides.length} slides</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest mb-3">
              <Settings size={13} className="text-brand-500" /> Slide Config
            </h3>
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-2">Size</label>
            <div className="grid grid-cols-2 gap-2">
              {['16/10', '4/3'].map(r => (
                <button key={r} onClick={() => setAspectRatio(r)}
                  className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${aspectRatio === r ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
                  {r === '16/10' ? '16:10 Wide' : '4:3 Std'}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Fullscreen Presentation Mode ── */}
      {isPresenting && (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-slate-400 shrink-0">
            <span className="text-xs font-black tracking-widest uppercase text-brand-400">
              SLIDESHOW — {slides[presentIndex]?.type || 'Content'} Layout
            </span>
            <button onClick={() => setIsPresenting(false)} className="p-2 hover:bg-slate-800 rounded-xl text-white transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <div
              key={`present-${presentIndex}-${transition}`}
              className={`w-full max-w-5xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between ${getTransitionClass()}`}
              style={{
                aspectRatio: aspectRatio === '16/10' ? '16/10' : '4/3',
                padding: '5%',
                backgroundColor: bgColor,
                backgroundImage: bgGradient !== 'none' ? bgGradient : 'none',
                color: textColor,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />
              {renderSlideContent(slides[presentIndex], true)}
              <div className="flex justify-end text-xs text-slate-400 mt-4 border-t border-slate-200/30 pt-3 shrink-0">
                Slide {presentIndex + 1} of {slides.length}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-white shrink-0 px-4">
            <span className="text-xs text-slate-400 hidden sm:block">← → Space to navigate • Esc to exit</span>
            <div className="flex gap-4 mx-auto sm:mx-0">
              <button onClick={() => setPresentIndex(i => Math.max(0, i - 1))} disabled={presentIndex === 0}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all disabled:opacity-30"><ChevronLeft size={20} /></button>
              <span className="flex items-center text-sm font-bold">{presentIndex + 1} / {slides.length}</span>
              <button onClick={() => setPresentIndex(i => Math.min(slides.length - 1, i + 1))} disabled={presentIndex === slides.length - 1}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all disabled:opacity-30"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
