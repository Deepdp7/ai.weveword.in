import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

export default function VoiceDictationButton({ onTranscription, isDark = false, className = '' }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          // Add a leading space if needed by the parent, but here we just send the raw text
          onTranscription(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscription]);

  const toggleListening = (e) => {
    e.preventDefault();
    if (!recognitionRef.current) {
      alert("Your browser does not support Voice Dictation. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const baseStyle = isDark 
    ? "text-gray-300 hover:text-white hover:bg-gray-700/50" 
    : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50";

  const listeningStyle = "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse ring-2 ring-red-200";

  return (
    <button
      onClick={toggleListening}
      type="button"
      title={isListening ? "Stop listening" : "Start voice dictation"}
      className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm ${isListening ? listeningStyle : baseStyle} ${className}`}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
