import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Type, Download, Trash2, CheckCircle2, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';

const API = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const FONTS = [
  { name: 'Alex Brush', family: "'Alex Brush', cursive" },
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Pacifico', family: "'Pacifico', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
  { name: 'Caveat', family: "'Caveat', cursive" }
];

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Navy Blue', value: '#000080' },
  { name: 'Classic Blue', value: '#0047AB' },
  { name: 'Dark Red', value: '#8B0000' }
];

export default function Signature() {
  const [activeTab, setActiveTab] = useState('type'); 
  const [typedName, setTypedName] = useState('John Doe');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].family);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [saving, setSaving] = useState(false);
  const [mySignatures, setMySignatures] = useState([]);
  
  const sigPadRef = useRef(null);
  const typedPreviewRef = useRef(null);

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      const { data } = await axios.get(`${API}/signatures`);
      setMySignatures(data.signatures);
    } catch (err) {
      console.error('Fetch signatures error:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let dataUrl = '';
      if (activeTab === 'type') {
        const canvas = await html2canvas(typedPreviewRef.current, { backgroundColor: null, scale: 3 });
        dataUrl = canvas.toDataURL('image/png');
      } else {
        if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
        dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      }

      await axios.post(`${API}/signatures/save`, { signatureData: dataUrl });
      fetchSignatures();
      alert('Signature saved to your library!');
    } catch (err) {
      alert('Failed to save signature.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSignature = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/signatures/${id}`);
      setMySignatures(mySignatures.filter(s => s._id !== id));
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const downloadSignature = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Signature.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
          <PenTool className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Signature Lab</h1>
          <p className="text-gray-500">Generate and manage your high-quality digital signatures.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Generator Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-2">
            <button 
              onClick={() => setActiveTab('type')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'type' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Type className="inline w-4 h-4 mr-2" /> Type Signature
            </button>
            <button 
              onClick={() => setActiveTab('draw')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <PenTool className="inline w-4 h-4 mr-2" /> Draw Signature
            </button>
          </div>

          <div className="flex-1 p-8 flex flex-col relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9InJnYmEoMCwwLDAsLjAyKSIvPjwvc3ZnPg==')]">
            {activeTab === 'type' ? (
              <div className="flex-1 flex flex-col">
                <input 
                  type="text" 
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full text-center text-2xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none pb-2 mb-8"
                  placeholder="Type your name..."
                />
                <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 pb-24">
                  {FONTS.map(f => (
                    <div 
                      key={f.name}
                      onClick={() => setSelectedFont(f.family)}
                      className={`p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-center min-h-[120px] ${selectedFont === f.family ? 'border-indigo-500 shadow-lg' : 'border-gray-100 hover:border-indigo-200'}`}
                    >
                      <span style={{ fontFamily: f.family, color: selectedColor, fontSize: '2.5rem' }} className="text-center truncate w-full">
                        {typedName || 'Sign'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Hidden Ref */}
                <div className="absolute -left-[9999px] top-0 opacity-0">
                  <div ref={typedPreviewRef} className="p-8 inline-block bg-transparent">
                    <span style={{ fontFamily: selectedFont, color: selectedColor, fontSize: '6rem' }}>{typedName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Draw in the box</span>
                  <button onClick={() => sigPadRef.current.clear()} className="text-red-500 text-xs font-bold hover:underline">Clear Canvas</button>
                </div>
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-3xl bg-white relative">
                  <SignatureCanvas 
                    ref={sigPadRef}
                    penColor={selectedColor}
                    minWidth={strokeWidth * 0.5}
                    maxWidth={strokeWidth * 1.5}
                    canvasProps={{ className: 'w-full h-full' }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-400">THICKNESS</span>
                  <input type="range" min="1" max="10" value={strokeWidth} onChange={e => setStrokeWidth(e.target.value)} className="flex-1 accent-indigo-600" />
                </div>
              </div>
            )}

            <div className="absolute bottom-8 left-8 right-8 flex gap-4">
              <div className="flex gap-2 mr-auto bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                {COLORS.map(c => (
                  <button 
                    key={c.value} 
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c.value ? 'border-indigo-500 scale-110 shadow-md' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <button
                onClick={async () => {
                  let dataUrl = '';
                  if (activeTab === 'type') {
                    const canvas = await html2canvas(typedPreviewRef.current, { backgroundColor: null, scale: 3 });
                    dataUrl = canvas.toDataURL('image/png');
                  } else {
                    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
                    dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
                  }
                  downloadSignature(dataUrl);
                }}
                className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 font-bold py-4 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} /> Download
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save to Cloud
              </button>
            </div>
          </div>
        </div>

        {/* My Signatures Sidebar */}
        <div className="lg:col-span-4 bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden flex flex-col h-[650px]">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="text-indigo-600" /> My Signatures
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mySignatures.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <ImageIcon size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No signatures saved yet. Create one to get started!</p>
              </div>
            ) : (
              mySignatures.map(sig => (
                <div key={sig._id} className="bg-white border border-gray-200 rounded-2xl p-4 group relative hover:shadow-md transition-all">
                  <div className="h-24 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTAgMGg0djRIMHptNCA0aDR2NEg0eiIgZmlsbD0iI2Y4ZjlhYiIvPjwvc3ZnPg==')] rounded-xl overflow-hidden mb-3">
                    <img src={sig.fileUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sig.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => downloadSignature(sig.fileUrl)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Download size={14} /></button>
                      <button onClick={() => deleteSignature(sig._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
