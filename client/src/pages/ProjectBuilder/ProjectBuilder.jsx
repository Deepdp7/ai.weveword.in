import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, FileDown, Edit3, LayoutTemplate, Save, Loader2, CheckCircle } from 'lucide-react';

const API = 'http://localhost:5000/api/studio';
axios.defaults.withCredentials = true;

function SortableItem({ id, section, isActive, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 mb-3 rounded-xl border cursor-pointer transition-all ${
        isActive ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(id)}
    >
      <div className="flex items-center flex-1 overflow-hidden">
        <div {...attributes} {...listeners} className="cursor-grab mr-3 text-gray-400 hover:text-gray-600 outline-none">
          <GripVertical size={18} />
        </div>
        <span className="font-medium text-gray-700 truncate">{section.title}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 ml-2"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ProjectBuilder() {
  const [projectId, setProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState('My Academic Project');
  const [sections, setSections] = useState([
    { id: 'sec-1', title: 'Title Page', content: 'KolomFlow Project Report\n\nSubmitted by:\n[Your Name]' },
    { id: 'sec-2', title: 'Introduction', content: 'Introduce your project here...' }
  ]);
  const [activeSectionId, setActiveSectionId] = useState('sec-1');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/save`, {
        title: projectTitle,
        sections,
        projectId
      });
      setProjectId(data.project._id);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      alert('Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!projectId) {
      alert('Please save the project first!');
      return;
    }
    setExporting(true);
    try {
      const { data } = await axios.post(`${API}/export/${projectId}`);
      window.open(data.url, '_blank');
      alert('Project exported and saved to Cloud Library!');
    } catch (err) {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const addSection = () => {
    const newId = `sec-${Date.now()}`;
    setSections([...sections, { id: newId, title: 'New Section', content: '' }]);
    setActiveSectionId(newId);
  };

  const deleteSection = (id) => {
    const newSections = sections.filter(s => s.id !== id);
    setSections(newSections);
    if (activeSectionId === id) setActiveSectionId(newSections[0]?.id || null);
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col pt-6 pb-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
            <LayoutTemplate size={24} />
          </div>
          <div>
            <input 
              value={projectTitle} 
              onChange={e => setProjectTitle(e.target.value)}
              className="text-3xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 outline-none"
            />
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              {saving ? 'Saving...' : lastSaved ? `Last saved at ${lastSaved}` : 'Not saved yet'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Project
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Sections</h2>
              <button onClick={addSection} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium border border-indigo-100">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                  {sections.map(s => (
                    <SortableItem key={s.id} id={s.id} section={s} isActive={activeSectionId === s.id} onSelect={setActiveSectionId} onDelete={deleteSection} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-1/2 flex flex-col">
            {activeSection ? (
              <>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <Edit3 size={20} className="text-indigo-500 shrink-0" />
                  <input value={activeSection.title} onChange={e => updateSection(activeSection.id, 'title', e.target.value)} className="font-semibold text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-lg flex-1 outline-none" />
                </div>
                <textarea value={activeSection.content} onChange={e => updateSection(activeSection.id, 'content', e.target.value)} className="w-full flex-1 p-4 border border-gray-100 rounded-xl resize-none text-gray-700 leading-relaxed outline-none" placeholder="Content..." />
              </>
            ) : <div className="flex-1 flex items-center justify-center text-gray-400">Select a section</div>}
          </div>
        </div>

        <div className="flex-1 bg-gray-50 rounded-2xl p-8 overflow-y-auto flex justify-center border border-gray-200 shadow-inner relative">
          <div className="bg-white w-full max-w-[794px] min-h-[1123px] shadow-xl rounded-sm p-16 shrink-0 mt-4 mb-8 text-gray-900 transition-all font-serif">
            {sections.map((section, index) => (
              <div key={section.id} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-gray-100 pb-2 inline-block pr-8">{section.title}</h2>
                <div className="text-gray-700 leading-loose text-justify whitespace-pre-wrap">{section.content || '...'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
