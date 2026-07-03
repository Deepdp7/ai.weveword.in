import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Brain, Sparkles, BookOpen, Trash2, Mic, MicOff, Volume2, Paperclip } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';

const MENTORS = {
  sahadev: {
    id: 'sahadev',
    name: 'Sahadev',
    role: 'Logical & Analytical Mentor',
    provider: 'OpenAI',
    color: 'bg-slate-600',
    lightColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    border: 'border-slate-200',
    icon: Brain
  },
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    role: 'Creative & Friendly Teacher',
    provider: 'Google Gemini',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    border: 'border-amber-200',
    icon: Sparkles
  },
  vedbaash: {
    id: 'vedbaash',
    name: 'Vedbaash',
    role: 'Thoughtful Research Scholar',
    provider: 'Anthropic Claude',
    color: 'bg-emerald-600',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: BookOpen
  }
};
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function AIMentors() {
  const { user } = useAuth();
  const [activeMentor, setActiveMentor] = useState('sahadev');
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState(null);
  const [attachedFileText, setAttachedFileText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [pendingMessageData, setPendingMessageData] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentMentor = MENTORS[activeMentor];
  const currentMessages = messages[activeMentor] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachedFileName(file.name);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        setAttachedFileText(fullText);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setAttachedFileText(text);
      } else {
        alert("Please upload a PDF or TXT file.");
        setAttachedFileName('');
      }
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Error extracting text from file.");
      setAttachedFileName('');
    }
  };

  // Speech Recognition (Mic)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Text to Speech (Speaker)
  const speakText = (text, msgId) => {
    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to assign distinct voices based on mentor
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (activeMentor === 'krishna') {
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('Arthur'));
        if (maleVoice) utterance.voice = maleVoice;
      }
    }
    utterance.onend = () => setIsSpeakingId(null);
    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`${window.location.protocol}//${window.location.hostname}/api/ai/history/${activeMentor}`, {
          withCredentials: true
        });
        
        if (data && data.length > 0) {
          setMessages(prev => ({ ...prev, [activeMentor]: data }));
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    
    if (!messages[activeMentor]) {
      fetchHistory();
    }
  }, [activeMentor]);

  const handleSend = async (e, useCredit = false, retryMessages = null) => {
    if (e) e.preventDefault();
    
    let updatedMessages = retryMessages;
    
    if (!retryMessages) {
      const finalInput = input.trim();
      if ((!finalInput && !attachedFileText) || isLoading) return;

      let promptContent = finalInput;
      if (attachedFileText) {
        promptContent = `[Attached File: ${attachedFileName}]\n${attachedFileText}\n\n${finalInput ? 'User Question: ' + finalInput : 'Please analyze the attached file.'}`;
      }

      const userMessage = { role: 'user', content: promptContent };
      updatedMessages = [...currentMessages, userMessage];
      
      setMessages(prev => ({ ...prev, [activeMentor]: updatedMessages }));
      setInput('');
      setAttachedFileName('');
      setAttachedFileText('');
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${window.location.protocol}//${window.location.hostname}/api/ai/chat`, {
        messages: updatedMessages,
        mentor: activeMentor,
        useCredit
      }, { withCredentials: true });

      const aiMessage = { role: 'assistant', content: response.data.text };
      setMessages(prev => ({
        ...prev,
        [activeMentor]: [...updatedMessages, aiMessage]
      }));
      setShowQuotaModal(false);
      setPendingMessageData(null);
    } catch (error) {
      console.error("AI Chat Error:", error);
      if (error.response?.data?.error === 'QUOTA_EXCEEDED' || error.response?.data?.error === 'INSUFFICIENT_CREDITS') {
        setShowQuotaModal(true);
        setPendingMessageData(updatedMessages);
        // Do not add the error message to the chat
      } else {
        const errorMessage = { role: 'assistant', content: "I'm sorry, I encountered an error connecting to my core processor. Please try again later." };
        setMessages(prev => ({
          ...prev,
          [activeMentor]: [...updatedMessages, errorMessage]
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.delete(`${window.location.protocol}//${window.location.hostname}/api/ai/history/${activeMentor}`, {
        withCredentials: true
      });
      setMessages(prev => ({ ...prev, [activeMentor]: [] }));
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const MentorIcon = currentMentor.icon;

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 md:gap-6 relative">
      
      {/* Quota Modal */}
      {showQuotaModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 rounded-3xl">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Daily Limit Reached</h3>
            <p className="text-gray-500 font-medium mb-6">
              You've used all 5 free daily messages for {currentMentor.name}. Upgrade to PRO for unlimited access, or use 5 Credits to send this message.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/pricing" className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold hover:opacity-90 transition-opacity">
                Upgrade to PRO
              </a>
              <button 
                onClick={() => handleSend(null, true, pendingMessageData)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
              >
                Use 5 Credits
              </button>
              <button 
                onClick={() => { setShowQuotaModal(false); setPendingMessageData(null); }}
                className="text-sm text-gray-400 hover:text-gray-600 font-medium mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: Mentor Selection (Horizontal Row on Mobile, Vertical Sidebar on Desktop) */}
      <div className="w-full md:w-80 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
        
        {/* Sidebar Header - Hidden on Mobile to save space */}
        <div className="hidden md:block p-6 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-600" />
            AI Mentors
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Select a mentor to guide your learning journey.</p>
          
          <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-brand-700 uppercase flex items-center gap-1"><Sparkles className="w-3 h-3" /> Cost Per Chat</span>
              <span className="text-sm font-black text-brand-700">5 Credits</span>
            </div>
            <p className="text-[10px] text-brand-600 font-medium leading-tight mt-1">
              First 5 messages each day are free.
            </p>
          </div>
        </div>

        {/* Mentor Selector Items - Horizontal scroll row on Mobile, Vertical list on Desktop */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-3 md:p-4 gap-2 md:gap-3 shrink-0 scrollbar-none">
          {Object.values(MENTORS).map((mentor) => {
            const Icon = mentor.icon;
            const isActive = activeMentor === mentor.id;
            
            return (
              <button
                key={mentor.id}
                onClick={() => setActiveMentor(mentor.id)}
                className={`flex items-center gap-2 md:gap-4 p-2.5 md:p-4 rounded-xl md:rounded-2xl transition-all shrink-0 ${
                  isActive 
                    ? `${mentor.lightColor} ${mentor.border} border border-2 shadow-sm scale-[1.02]` 
                    : 'border border-2 border-transparent hover:bg-gray-50 text-left'
                }`}
              >
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? mentor.color : 'bg-gray-100 text-gray-400'
                } ${isActive ? 'text-white' : ''}`}>
                  <Icon className="w-4.5 h-4.5 md:w-6 md:h-6" />
                </div>
                <div className="text-left">
                  <h3 className={`text-xs md:text-sm font-bold ${isActive ? mentor.textColor : 'text-gray-900'}`}>{mentor.name}</h3>
                  <p className="hidden md:block text-xs font-medium text-gray-500 mt-0.5">{mentor.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[300px]">
        
        {/* Chat Header */}
        <div className={`p-3 md:p-4 border-b flex items-center justify-between ${currentMentor.lightColor} ${currentMentor.border}`}>
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white ${currentMentor.color} shadow-sm`}>
              <MentorIcon className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </div>
            <div className="text-left">
              <h2 className={`font-black text-sm md:text-lg leading-tight ${currentMentor.textColor}`}>{currentMentor.name}</h2>
              <p className="text-[10px] md:text-xs font-semibold text-gray-500 leading-tight mt-0.5">{currentMentor.role}</p>
            </div>
          </div>
          
          {currentMessages.length > 0 && (
            <button 
              onClick={clearChat}
              className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/30">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60 px-4">
              <MentorIcon className={`w-12 h-12 md:w-16 md:h-16 ${currentMentor.textColor} mb-4`} />
              <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">Start a conversation with {currentMentor.name}</h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Ask questions about mathematics, science, programming, or request help with essays and research.</p>
            </div>
          ) : (
            currentMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-6.5 h-6.5 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${currentMentor.color} text-white shadow-sm mt-1`}>
                    <MentorIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                )}
                
                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-tr-sm' 
                    : `bg-white border border-gray-100 rounded-tl-sm prose prose-sm max-w-none`
                }`}>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakText(msg.content, idx)}
                      className="float-right ml-2 mb-1 p-1 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-lg"
                      title="Read aloud"
                    >
                      <Volume2 className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isSpeakingId === idx ? 'text-indigo-600 animate-pulse' : ''}`} />
                    </button>
                  )}
                  <p className="whitespace-pre-wrap font-medium text-sm md:text-base leading-relaxed">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6.5 h-6.5 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                    <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2.5 md:gap-4 justify-start">
              <div className={`w-6.5 h-6.5 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${currentMentor.color} text-white shadow-sm mt-1`}>
                <MentorIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-3 md:p-4 shadow-sm flex items-center gap-1.5 md:gap-2">
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${currentMentor.color} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${currentMentor.color} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${currentMentor.color} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
          {attachedFileName && (
            <div className="mb-2 text-xs md:text-sm text-indigo-600 flex items-center gap-1.5 md:gap-2">
              <Paperclip className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
              Attached: {attachedFileName} 
              <button onClick={() => { setAttachedFileName(''); setAttachedFileText(''); }} className="text-red-500 hover:text-red-700 ml-2 text-xs">Remove</button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-1.5 md:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="p-2.5 md:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Attach file (.pdf or .txt)"
            >
              <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask your mentor..."}
                className={`w-full pl-3 pr-9 py-2.5 md:pl-4 md:pr-12 md:py-3 text-sm md:text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-${currentMentor.color.split('-')[1]}-500 focus:border-transparent ${isListening ? 'bg-red-50 border-red-200 placeholder-red-400' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isListening ? 'text-red-500 bg-red-100 hover:bg-red-200 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedFileText)}
              className={`p-2.5 md:p-3 rounded-xl text-white transition-all ${
                isLoading || (!input.trim() && !attachedFileText)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : `${currentMentor.color} hover:opacity-90 shadow-lg shadow-${currentMentor.color.split('-')[1]}-500/30`
              }`}
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </form>
          <p className="text-center text-[9px] md:text-[10px] text-gray-400 font-medium mt-2.5 md:mt-3">
            AI Mentors can make mistakes. Consider verifying important information.
          </p>
        </div>

      </div>
    </div>
  );
}
