import { useState } from 'react';
import { Card, Button } from '../../components/ui';
import {
  Cloud,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Layout,
  FileText,
  Calendar,
  User,
  Book,
  Hash,
  School,
  Loader2,
  Settings,
  Edit3,
  Eye,
  Zap,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '../../components/toastStore';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

export default function ProjectBuilder() {
  const [info, setInfo] = useState({
    title: 'Modern AI Research',
    subject: 'Computer Science',
    studentName: 'John Doe',
    rollNo: '2024-CS-01',
    teacherName: 'Dr. Sarah Wilson',
    schoolName: 'Oxford University',
    date: new Date().toISOString().split('T')[0],
  });

  const [pages, setPages] = useState([
    {
      id: '1',
      title: 'Introduction',
      content:
        'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. The field of AI has grown exponentially in recent years, with breakthroughs in machine learning, natural language processing, and computer vision.',
    },
    {
      id: '2',
      title: 'Problem Statement',
      content:
        'The rapid advancement of Large Language Models (LLMs) has created a need for specialized document processing pipelines that can handle complex academic and professional documents efficiently and accurately.',
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const { addToast, clearToasts } = useToast();
  const { user } = useAuth();

  const [coverImage, setCoverImage] = useState(null);
  const [accentColor, setAccentColor] = useState('#0284c7');
  const [activeTab, setActiveTab] = useState('settings');
  const [layout, setLayout] = useState('modern');

  const triggerSuccessEffect = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const addPage = () => {
    setPages([...pages, { id: Date.now().toString(), title: 'New Chapter', content: '' }]);
  };

  const removePage = (id) => {
    setPages(pages.filter((p) => p.id !== id));
  };

  const updatePage = (id, field, value) => {
    setPages(pages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getLineHeight = (pdf, multiplier = 1.4) => pdf.getFontSize() * multiplier;

  const getTextBlockHeight = (pdf, lines, multiplier = 1.4) => {
    const count = Array.isArray(lines) ? lines.length : 1;
    return count * getLineHeight(pdf, multiplier);
  };

  const ctxWidth = (pdf, text) =>
    (pdf.getStringUnitWidth(text) * pdf.internal.getFontSize()) / pdf.internal.scaleFactor;

  const generateAssignment = async (action = 'download') => {
    if (action === 'cloud') setIsSavingCloud(true);
    else setIsGenerating(true);

    addToast('Verifying credits...', 'loading');

    try {
      await axios.post(`${API}/payments/credits/deduct`, { toolKey: 'project' });
      
      addToast(action === 'cloud' ? 'Saving to cloud...' : 'Generating your assignment PDF...', 'loading');
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const mainFont = layout === 'classic' ? 'times' : layout === 'minimal' ? 'courier' : 'helvetica';

      // --- PAGE 1: COVER PAGE ---
      if (layout === 'modern') {
        pdf.setFillColor(accentColor);
        pdf.rect(0, 0, 5, pageHeight, 'F');
      }

      // School Name at top
      pdf.setFont(mainFont, 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(accentColor);
      pdf.text(info.schoolName.toUpperCase(), pageWidth / 2, 28, { align: 'center' });
      pdf.setDrawColor(accentColor);
      pdf.setLineWidth(1.5);
      pdf.line(pageWidth / 2 - 30, 33, pageWidth / 2 + 30, 33);

      // Photo/Logo: Box shape big and adjust (landscape rectangle 76 x 48 centered horizontally)
      if (coverImage) {
        try {
          pdf.addImage(coverImage, 'PNG', pageWidth / 2 - 38, 42, 76, 48);
        } catch (e) {
          console.error('Logo failed to load');
        }
      }

      // Subject (Big & Highlighted) & Title in the middle (vertically centered around 140)
      pdf.setFont(mainFont, 'bold');
      pdf.setTextColor(accentColor);
      pdf.setFontSize(layout === 'minimal' ? 24 : 32);
      const subjectLines = pdf.splitTextToSize(info.subject.toUpperCase(), pageWidth - 50);
      const subjectHeight = getTextBlockHeight(pdf, subjectLines, 1.25);
      const middleY = 140; 
      const subjectY = middleY - (subjectHeight / 2);
      pdf.text(subjectLines, pageWidth / 2, subjectY, { align: 'center' });

      // Title below Subject
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(14);
      pdf.setFont(mainFont, 'normal');
      const titleLines = pdf.splitTextToSize(info.title, pageWidth - 60);
      pdf.text(titleLines, pageWidth / 2, subjectY + subjectHeight + 10, { align: 'center' });

      // --- Beautiful Info Panel at bottom (Bigger Card Style) ---
      const panelY = 200;
      const panelH = 75;

      // Card Background with light background fill
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, panelY, pageWidth - 40, panelH, 'F');

      // Top colored border stripe
      pdf.setFillColor(accentColor);
      pdf.rect(20, panelY, pageWidth - 40, 4, 'F');

      // Border outline
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.rect(20, panelY, pageWidth - 40, panelH, 'D');

      // Left column: Submitted By
      pdf.setFontSize(8);
      pdf.setFont(mainFont, 'bold');
      pdf.setTextColor(accentColor);
      pdf.text('SUBMITTED BY', 32, panelY + 18);
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(13);
      pdf.text(info.studentName, 32, panelY + 28);
      pdf.setFontSize(10);
      pdf.setFont(mainFont, 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Roll No: ${info.rollNo}`, 32, panelY + 37);

      // Right column: Submitted To
      pdf.setFontSize(8);
      pdf.setFont(mainFont, 'bold');
      pdf.setTextColor(accentColor);
      pdf.text('SUBMITTED TO', pageWidth - 32, panelY + 18, { align: 'right' });
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(13);
      pdf.text(info.teacherName, pageWidth - 32, panelY + 28, { align: 'right' });

      // Divider line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(32, panelY + 48, pageWidth - 32, panelY + 48);

      // Date centered
      pdf.setFontSize(10);
      pdf.setFont(mainFont, 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Submission Date: ${info.date}`, pageWidth / 2, panelY + 60, { align: 'center' });

      // --- PAGE 2: INDEX ---
      pdf.addPage();
      pdf.setFontSize(30);
      pdf.setFont(mainFont, 'bold');
      pdf.setTextColor(accentColor);
      pdf.text('INDEX', pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('S.No', 30, 50);
      pdf.text('Chapter Title', 60, 50);
      pdf.text('Page No', pageWidth - 40, 50, { align: 'right' });
      pdf.setDrawColor(30, 41, 59);
      pdf.line(30, 55, pageWidth - 30, 55);

      let indexY = 65;
      const indexLineHeight = 16;
      const indexMaxY = pageHeight - 35;

      pages.forEach((p, i) => {
        if (indexY + indexLineHeight > indexMaxY) {
          pdf.addPage();
          indexY = 30;
        }
        pdf.setFont(mainFont, 'normal');
        pdf.setTextColor(30, 41, 59);
        pdf.text(`${i + 1}.`, 30, indexY);
        pdf.text(p.title, 60, indexY);
        pdf.text(`${i + 3}`, pageWidth - 40, indexY, { align: 'right' });
        pdf.setLineDashPattern([1, 1], 0);
        pdf.line(ctxWidth(pdf, p.title) + 65, indexY - 1, pageWidth - 50, indexY - 1);
        pdf.setLineDashPattern([], 0);
        indexY += indexLineHeight;
      });

      // --- PAGES 3+: CONTENT ---
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        pdf.addPage();
        let currentPageNumber = i + 3;

        const drawContentHeader = () => {
          pdf.setFontSize(10);
          pdf.setFont(mainFont, 'italic');
          pdf.setTextColor(100, 116, 139);
          pdf.text(info.title, 20, 15);
          pdf.text(info.subject, pageWidth - 20, 15, { align: 'right' });
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, 18, pageWidth - 20, 18);
          pdf.setFontSize(24);
          pdf.setFont(mainFont, 'bold');
          pdf.setTextColor(accentColor);
          pdf.text(`${i + 1}. ${p.title}`, 20, 35);
          pdf.setFontSize(12);
          pdf.setFont(mainFont, 'normal');
          pdf.setTextColor(30, 41, 59);
        };

        const drawPageFooter = () => {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Page ${currentPageNumber}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        };

        drawContentHeader();

        const rawContent = p.content.replace(/\r\n/g, '\n');
        const paragraphs = rawContent.split(/\n\n+/);
        const lineHeight = getLineHeight(pdf, 1.5);
        const paragraphSpacing = lineHeight * 0.75;
        const maxTextY = pageHeight - 25;
        let textY = 50;

        for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
          const paragraph = paragraphs[pIdx].trim();
          if (!paragraph) { textY += lineHeight; continue; }

          const paragraphLines = pdf.splitTextToSize(paragraph, pageWidth - 40);
          paragraphLines.forEach((line) => {
            if (textY + lineHeight > maxTextY) {
              drawPageFooter();
              pdf.addPage();
              currentPageNumber += 1;
              drawContentHeader();
              textY = 50;
            }
            pdf.text(line, 20, textY);
            textY += lineHeight;
          });

          if (pIdx < paragraphs.length - 1) textY += paragraphSpacing;
        }

        drawPageFooter();
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      const fileName = `${info.title.replace(/\s+/g, '_')}_Assignment.pdf`;
      const blob = pdf.output('blob');

      if (action === 'cloud') {
        const uploadData = new FormData();
        uploadData.append('file', new File([blob], fileName, { type: 'application/pdf' }));
        uploadData.append('toolSource', 'project');
        await axios.post(`${API}/files/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        clearToasts();
        addToast('Saved to Cloud Library!', 'success');
        triggerSuccessEffect();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        clearToasts();
        addToast('PDF Downloaded!', 'success');
        triggerSuccessEffect();
      }
    } catch (err) {
      console.error('Assignment generation failed:', err);
      clearToasts();
      addToast(err.response?.data?.message || (action === 'cloud' ? 'Failed to save to cloud.' : 'Failed to build assignment.'), 'error');
    } finally {
      setIsGenerating(false);
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-24 lg:pb-20 px-4 py-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black tracking-widest uppercase border border-brand-100">
          <Sparkles className="w-3 h-3" /> AI ACADEMIC STUDIO
          <div className="ml-2 pl-2 border-l border-brand-200 flex items-center gap-1 text-yellow-600">
            <Zap className="w-3 h-3 fill-current" /> COST: 15 CREDITS
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
          Assignment <span className="text-brand-600">Builder</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Design beautiful academic assignments with auto-generated cover pages, index, and chapter layouts.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 bg-slate-100/80 border border-slate-200/50 rounded-full gap-1">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'content', label: 'Write Content', icon: Edit3 },
            { id: 'preview', label: 'Live Preview', icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300',
                activeTab === id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ──────────── SETTINGS TAB ──────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Card className="p-8 bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] space-y-8">

              {/* Pro Design Options */}
              <div className="space-y-5">
                <h3 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Layout className="w-4 h-4 text-brand-500" /> Pro Design Options
                </h3>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">
                    School Logo / Cover Image
                  </label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="logo-upload" />
                  <div
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-brand-50 hover:border-brand-300 transition-all cursor-pointer overflow-hidden"
                  >
                    {coverImage ? (
                      <img src={coverImage} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 text-brand-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Click to Upload Logo</span>
                      </>
                    )}
                  </div>
                  {coverImage && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-xl">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-200 shrink-0">
                        <img src={coverImage} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Logo uploaded — auto-sized on cover page</span>
                    </div>
                  )}
                </div>

                {/* Layout & Color */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Theme Color</label>
                    <div className="flex flex-wrap gap-3">
                      {['#0284c7', '#0891b2', '#059669', '#dc2626', '#1e293b'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c)}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 transition-all',
                            accentColor === c ? 'border-brand-500 scale-125 shadow-lg' : 'border-transparent hover:scale-110'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Layout Style</label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border-none rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="modern">Modern Pro</option>
                      <option value="classic">Classic University</option>
                      <option value="minimal">Minimalist</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              {/* Cover Page Info */}
              <div className="space-y-5">
                <h3 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <FileText className="w-4 h-4 text-brand-500" /> Cover Page Information
                </h3>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Subject</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" value={info.subject} onChange={(e) => setInfo({ ...info, subject: e.target.value })}
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Project Title</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">School / University</label>
                    <div className="relative">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" value={info.schoolName} onChange={(e) => setInfo({ ...info, schoolName: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Student Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" value={info.studentName} onChange={(e) => setInfo({ ...info, studentName: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Roll Number</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" value={info.rollNo} onChange={(e) => setInfo({ ...info, rollNo: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teacher Name</label>
                    <input type="text" value={info.teacherName} onChange={(e) => setInfo({ ...info, teacherName: e.target.value })}
                      className="w-full h-12 px-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Submission Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="date" value={info.date} onChange={(e) => setInfo({ ...info, date: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all text-sm font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('content')}
                className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 hover:-translate-y-0.5 active:scale-95 text-sm uppercase tracking-widest flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Continue to Content →
              </button>
            </div>
          </div>
        )}

        {/* ──────────── CONTENT TAB ──────────── */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Assignment Content</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Add and edit chapters for your assignment.</p>
              </div>
              <Button
                onClick={addPage}
                className="rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-100 gap-2 h-10 px-4 font-black text-xs uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Chapter
              </Button>
            </div>

            <div className="space-y-6">
              {pages.map((page, index) => (
                <Card key={page.id} className="p-8 bg-white border border-slate-100 shadow-xl rounded-[2.5rem] space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center font-black shrink-0 text-sm">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={page.title}
                        onChange={(e) => updatePage(page.id, 'title', e.target.value)}
                        className="text-xl font-black text-slate-900 border-none bg-transparent focus:ring-0 outline-none w-full"
                        placeholder="Chapter Title..."
                      />
                    </div>
                    <button onClick={() => removePage(page.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    value={page.content}
                    onChange={(e) => updatePage(page.id, 'content', e.target.value)}
                    className="w-full min-h-[250px] p-6 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-200 focus:bg-white outline-none transition-all text-sm font-medium leading-relaxed resize-y"
                    placeholder="Start writing this chapter..."
                  />
                </Card>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => generateAssignment('download')}
                disabled={isGenerating || isSavingCloud}
                className="flex-1 sm:flex-none h-16 px-12 rounded-[2rem] bg-brand-600 text-white hover:bg-brand-700 shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 text-xl font-black hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                Build &amp; Download
              </button>
              <button
                onClick={() => generateAssignment('cloud')}
                disabled={isGenerating || isSavingCloud}
                className="flex-1 sm:flex-none h-16 px-12 rounded-[2rem] bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-4 text-xl font-black hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 border-2 border-slate-200"
              >
                {isSavingCloud ? <Loader2 className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />}
                Save to Cloud
              </button>
            </div>
          </div>
        )}

        {/* ──────────── PREVIEW TAB ──────────── */}
        {activeTab === 'preview' && (
          <div className="space-y-8 pb-12 animate-in fade-in duration-400 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
            <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">Live Preview — All Pages</p>

            {/* Cover Page */}
            <div className="flex justify-center">
              <div
                className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] w-full max-w-[480px] relative overflow-hidden transition-all duration-300 rounded-sm"
                style={{
                  aspectRatio: '210/297',
                  fontFamily: layout === 'classic' ? 'Times New Roman, serif' : layout === 'minimal' ? 'Courier New, monospace' : 'Helvetica, Arial, sans-serif',
                }}
              >
                {layout === 'modern' && (
                  <div className="absolute left-0 top-0 bottom-0 w-[10px]" style={{ backgroundColor: accentColor }} />
                )}
                <div className="w-full h-full flex flex-col justify-between pt-[8%] pb-4 px-[8%] text-center">
                  {/* Top: School Info + Logo (Adjusted Box shape) */}
                  <div className="flex flex-col items-center">
                    {coverImage && (
                      <div className="w-40 h-28 rounded-xl overflow-hidden border-2 mb-4 shrink-0 shadow-sm" style={{ borderColor: accentColor }}>
                        <img src={coverImage} alt="logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h2 className="text-[14px] font-black tracking-widest uppercase transition-colors" style={{ color: accentColor }}>
                      {info.schoolName}
                    </h2>
                    <div className="flex items-center gap-2 my-1.5 w-[50%]">
                      <div className="flex-1 h-[1.5px]" style={{ backgroundColor: accentColor }} />
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                      <div className="flex-1 h-[1.5px]" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>

                  {/* Middle: Subject (Big Highlighted) & Title Centered */}
                  <div className="flex-1 flex flex-col justify-center items-center py-6">
                    <h1 className="font-black leading-tight mb-3 transition-colors uppercase tracking-widest" style={{ color: accentColor, fontSize: layout === 'minimal' ? '22px' : '28px' }}>
                      {info.subject}
                    </h1>
                    <div className="text-[13px] font-medium text-slate-500 max-w-[85%] leading-relaxed">
                      {info.title}
                    </div>
                  </div>

                  {/* Bottom: Student Details Box (Big Card style) */}
                  <div className="w-full overflow-hidden rounded-xl border-t-4 border-2 border-slate-100 shadow-md bg-slate-50/80" style={{ borderTopColor: accentColor }}>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>Submitted By</p>
                          <p className="text-[13px] font-black text-slate-800">{info.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">Roll: {info.rollNo}</p>
                        </div>
                        <div className="border-l border-slate-200 pl-4 text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>Submitted To</p>
                          <p className="text-[13px] font-black text-slate-800">{info.teacherName}</p>
                        </div>
                      </div>
                      <div className="w-full h-[1px] bg-slate-200 my-3" />
                      <p className="text-[9px] text-slate-400 text-center font-bold tracking-widest uppercase">Date: {info.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Index Page */}
            <div className="flex justify-center">
              <div
                className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] w-full max-w-[480px] relative overflow-hidden flex flex-col pt-10 px-10 rounded-sm"
                style={{
                  aspectRatio: '210/297',
                  fontFamily: layout === 'classic' ? 'Times New Roman, serif' : layout === 'minimal' ? 'Courier New, monospace' : 'Helvetica, Arial, sans-serif',
                }}
              >
                <h1 className="text-2xl font-bold text-center mb-8 transition-colors" style={{ color: accentColor }}>INDEX</h1>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                  <span className="w-6">No.</span>
                  <span className="flex-1">Chapter Title</span>
                  <span>Page</span>
                </div>
                <div className="w-full h-[1px] bg-slate-300 mb-4" />
                <div className="space-y-3">
                  {pages.map((p, i) => (
                    <div key={p.id} className="flex items-center text-[11px]">
                      <span className="w-6 font-bold">{i + 1}.</span>
                      <span className="font-medium pr-2 bg-white z-10">{p.title || 'Untitled Chapter'}</span>
                      <span className="flex-1 border-b border-dotted border-slate-300 mx-2 mb-1" />
                      <span className="font-black z-10" style={{ color: accentColor }}>{i + 3}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Pages */}
            {pages.map((p, i) => (
              <div key={p.id} className="flex justify-center">
                <div
                  className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] w-full max-w-[480px] flex flex-col pt-8 px-10 rounded-sm overflow-hidden"
                  style={{
                    aspectRatio: '210/297',
                    fontFamily: layout === 'classic' ? 'Times New Roman, serif' : layout === 'minimal' ? 'Courier New, monospace' : 'Helvetica, Arial, sans-serif',
                  }}
                >
                  <div className="flex justify-between text-[7px] italic text-slate-400 mb-1.5">
                    <span>{info.title}</span>
                    <span>{info.subject}</span>
                  </div>
                  <div className="w-full h-[1px] bg-slate-200 mb-6" />
                  <h2 className="text-[18px] font-bold mb-5 transition-colors" style={{ color: accentColor }}>
                    {i + 1}. {p.title || 'Untitled Chapter'}
                  </h2>
                  <div className="text-[9px] leading-[1.9] text-justify text-slate-700 whitespace-pre-wrap break-words overflow-hidden">
                    {p.content || 'Write your chapter content here...'}
                  </div>
                  <div className="mt-auto pb-5 text-center text-[8px] font-bold text-slate-400">Page {i + 3}</div>
                </div>
              </div>
            ))}

            {/* Export Buttons in Preview */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                onClick={() => generateAssignment('download')}
                disabled={isGenerating || isSavingCloud}
                className="h-14 px-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:-translate-y-1 active:scale-95 transition-all shadow-lg shadow-brand-200 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Build &amp; Download
              </button>
              <button
                onClick={() => generateAssignment('cloud')}
                disabled={isGenerating || isSavingCloud}
                className="h-14 px-10 rounded-2xl bg-slate-100 text-slate-700 border-2 border-slate-200 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 hover:bg-slate-200"
              >
                {isSavingCloud ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                Save to Cloud
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
