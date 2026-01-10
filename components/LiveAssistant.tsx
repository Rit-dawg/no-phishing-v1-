

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { RiskAssessment } from '../types';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface Props {
  onAssessmentReceived: (a: RiskAssessment | null) => void;
  externalInput: string;
  setExternalInput: (s: string | ((prev: string) => string)) => void;
  onManualAnalyze: () => void;
  loading: boolean;
}

export const LiveAssistant: React.FC<Props> = ({ onAssessmentReceived, externalInput, setExternalInput, onManualAnalyze, loading }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [sensitivity, setSensitivity] = useState(0.01);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
  }, []);

  useEffect(() => {
    if (loading && isActive) {
      stopSession();
    }
  }, [loading, isActive, stopSession]);

  const startVoiceCapture = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("System API Key unavailable.");
      return;
    }
    
    setIsConnecting(true);
    try {
      // Use named parameter for GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              
              if (rms > sensitivityRef.current) {
                if (silenceTimerRef.current) {
                  window.clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
              }

              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              // Ensure sessionPromise resolves before sending input
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setExternalInput((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + text);
            }
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          },
          onerror: (e) => {
            console.error("Live session error", e);
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are a forensic security assistant. Accurately transcribe and analyze user speech regarding suspicious digital activities.",
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Voice capture failed", err);
      setIsConnecting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onManualAnalyze();
    }
  };

  return (
    <div className="flex items-end gap-3 p-2 bg-black/40 border border-white/5 rounded-lg focus-within:border-blue-500/50 transition-all">
      <button 
        onClick={isActive ? stopSession : startVoiceCapture}
        disabled={isConnecting}
        className={`p-3 rounded-full transition-all ${isActive ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-500 hover:text-white'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      <textarea 
        value={externalInput} 
        onChange={(e) => setExternalInput(e.target.value)} 
        onKeyDown={handleKeyDown}
        placeholder={isActive ? "Capturing voice..." : "Type suspicious content or describe scenario..."}
        className="flex-grow bg-transparent border-none py-3 px-1 text-sm text-zinc-200 outline-none resize-none max-h-32 min-h-[44px] custom-scroll font-medium placeholder:text-zinc-600"
        rows={1}
      />

      <button 
        onClick={onManualAnalyze} 
        disabled={loading || !externalInput.trim()} 
        className="p-3 text-blue-500 disabled:text-zinc-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
};


