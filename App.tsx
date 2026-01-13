
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Page, BlogArticle, RiskAssessment } from './types';
import { 
  analyzeSituation, 
  generateBlogArticles, 
  fetchAboutPage,
} from './services/geminiService';
import { LiveAssistant } from './components/LiveAssistant';

interface Message {
  role: 'user' | 'analyst';
  text: string;
}

const Logo: React.FC<{ score: number; className?: string }> = ({ score, className = "" }) => {
  const isHighRisk = score > 60;
  return (
    <div className={`relative transition-all duration-700 flex items-center justify-center font-bold text-lg rounded-sm ${className} ${isHighRisk ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]'} text-white`}>
      N-P
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [inputContext, setInputContext] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [aboutData, setAboutData] = useState<{title: string, content: string} | null>(null);
  const [leakEmail, setLeakEmail] = useState('');
  const [leakStatus, setLeakStatus] = useState<'idle' | 'scanning' | 'clean' | 'leaked'>('idle');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const backgroundStyle = useMemo(() => {
    if (!assessment || currentPage !== Page.Detect) {
      return "from-[#0a0f1a] via-[#0d172b] to-[#0a0f1a]";
    }
    const score = assessment.score || 0;
    if (score < 30) return "from-[#0a0f1a] via-[#0d172b] to-[#0a0f1a]";
    if (score < 60) return "from-[#1a140a] via-[#24170d] to-[#1a0f0a]";
    return "from-[#1a0a0a] via-[#2b0d0d] to-[#1a0a0a]";
  }, [assessment?.score, currentPage]);

  useEffect(() => {
    const accepted = localStorage.getItem('tos_accepted');
    if (!accepted) setShowTOS(true);
    
    const loadStatic = async () => {
      try {
        const [abt, art] = await Promise.all([fetchAboutPage(), generateBlogArticles()]);
        setAboutData(abt);
        setArticles(art);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    loadStatic();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleExportReport = () => {
    if (!assessment) return;
    const report = `
NO-PHISHING FORENSIC ASSESSMENT REPORT
--------------------------------------
Generated: ${new Date().toLocaleString()}
Reference ID: NP-${Math.random().toString(36).substr(2, 9).toUpperCase()}

THREAT ANALYSIS:
Threat Level: ${assessment.threatLevel}
Risk Score: ${assessment.score}%

SUMMARY OF FINDINGS:
${assessment.summary}

FORENSIC REASONING:
${assessment.reasoning}

RECOMMENDED DEFENSE STEPS:
${assessment.actionSteps.map(s => `[ ] ${s}`).join('\n')}

LEGAL DISCLAIMER:
This report is AI-generated for situational awareness.
--------------------------------------
No-Phishing Platform | Intelligence Unit
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NP_Forensic_Report_${Date.now()}.txt`;
    a.click();
  };

  const handleAcceptTOS = () => {
    localStorage.setItem('tos_accepted', 'true');
    setShowTOS(false);
  };

  const navigateTo = (p: Page) => {
    setCurrentPage(p);
    if (p !== Page.Blog) setSelectedArticle(null);
    if (p !== Page.Detect) setAssessment(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async (imageData?: { data: string, mimeType: string }) => {
    if ((!inputContext.trim() && !imageData) || loading) return;
    const userText = inputContext || (imageData ? "Analyzing visual forensics image..." : "");
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setInputContext('');
    setLoading(true);
    try {
      const result = await analyzeSituation(userText, imageData);
      setAssessment(result);
      setChatHistory(prev => [...prev, { role: 'analyst', text: result.summary }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'analyst', text: "Forensic analysis failed. Connectivity error." }]);
    } finally { setLoading(false); }
  };

  const handleLeakScan = async () => {
    if (!leakEmail || leakStatus === 'scanning') return;
    setLeakStatus('scanning');
    try {
      const result = await analyzeSituation(`DATA BREACH SCAN: Check for exposure associated with "${leakEmail}". Look for database dumps and leaked credentials.`);
      setLeakStatus(result.score > 40 ? 'leaked' : 'clean');
      setAssessment(result);
    } catch (e) { 
      setLeakStatus('idle'); 
    }
  };

  const Nav = () => (
    <header className={`border-b border-white/5 transition-colors duration-700 ${assessment && assessment.score > 60 ? 'bg-[#1a0a0a]/80' : 'bg-[#0a0f1a]/80'} backdrop-blur-xl px-8 py-4 sticky top-0 z-50`}>
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigateTo(Page.Home)}>
          <Logo score={assessment?.score || 0} className="w-11 h-10" />
          <span className="font-bold tracking-tight text-xl text-white/90 uppercase leading-none">NO-PHISHING</span>
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-widest">
          <button onClick={() => navigateTo(Page.Detect)} className={currentPage === Page.Detect ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}>Forensic Lab</button>
          <button onClick={() => navigateTo(Page.Blog)} className={currentPage === Page.Blog ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}>Advisories</button>
          <button onClick={() => navigateTo(Page.About)} className={currentPage === Page.About ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}>About</button>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')} className="text-[10px] font-bold border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition-all">{language}</button>
           <div className={`w-1.5 h-1.5 rounded-full ${assessment && assessment.score > 60 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'} animate-pulse`}></div>
        </div>
      </nav>
    </header>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${backgroundStyle} transition-all duration-1000 text-zinc-200 selection:bg-blue-500/30`}>
      <Nav />

      {showTOS && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#050810]/95 backdrop-blur-2xl">
          <div className="max-w-lg w-full bg-zinc-900/50 border border-white/10 p-12 rounded-lg shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Usage Disclaimer</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 italic">This platform utilizes Gemini AI for forensic reasoning. All findings are for information only. If you are a victim of fraud, contact your local authorities immediately.</p>
            <button onClick={handleAcceptTOS} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded font-bold transition-all uppercase tracking-widest text-xs">I Understand</button>
          </div>
        </div>
      )}

      <button onClick={() => setShowReportModal(true)} className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-red-600 hover:bg-red-500 text-white px-2 py-6 rounded-l-md shadow-2xl transition-all border border-white/20 group">
        <span className="[writing-mode:vertical-lr] font-bold text-[10px] uppercase tracking-[0.3em] group-hover:scale-105 transition-transform">Emergency</span>
      </button>

      {showReportModal && (
        <div className="fixed inset-0 z-[202] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="max-w-xl w-full bg-[#1c1c1c] p-12 border border-white/10 rounded-lg relative">
             <button onClick={() => setShowReportModal(false)} className="absolute top-6 right-6 text-zinc-500 text-2xl">✕</button>
             <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Emergency Protocol</h3>
             <p className="text-zinc-400 mb-8">If you suspect financial theft, call your bank's fraud department immediately.</p>
             <div className="grid gap-4 mt-8">
                <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-lg text-center">
                  <span className="block text-[10px] uppercase font-bold text-red-400 mb-1">Global Fraud Support</span>
                  <span className="text-3xl font-bold">CONTACT BANK</span>
                </div>
             </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {currentPage === Page.Home && (
          <>
            <section className="max-w-7xl mx-auto px-8 py-32 md:py-48 grid md:grid-cols-2 items-center gap-16">
              <div className="space-y-8 text-center md:text-left">
                <div className="inline-block border border-blue-500/30 bg-blue-500/5 px-4 py-2 rounded-full">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">AI Forensic Verification</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tight leading-[0.95]">
                  {language === 'EN' ? 'Detect Scams.' : 'घोटाले का पता लगाएं।'} <br/>
                  <span className={`text-blue-500 italic`}>{language === 'EN' ? 'Instant.' : 'तुरंत।'}</span>
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                  {language === 'EN' 
                    ? 'No-Phishing provides instant forensic analysis of suspicious links, voices, and messages using Multi-modal AI.' 
                    : 'नो-फ़िशिंग मल्टी-मॉडल एआई का उपयोग करके संदिग्ध लिंक, आवाज़ और संदेशों का त्वरित फ़ॉरेंसिक विश्लेषण प्रदान करता है।'}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <button onClick={() => navigateTo(Page.Detect)} className="bg-white text-black px-10 py-5 rounded font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">Analyze Evidence</button>
                </div>
              </div>
              <div className="hidden md:block relative">
                 <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-1 rounded-lg shadow-2xl relative z-10">
                    <div className="bg-black/50 p-12 rounded-lg border border-white/5 font-mono text-xs text-blue-400 space-y-4">
                      <p className="text-white font-bold">NP_KERNEL_LOADED</p>
                      <p className="opacity-70 text-zinc-500">Monitoring for adversarial payloads...</p>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-3 bg-blue-500 animate-pulse"></div>
                      </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="max-w-7xl mx-auto px-8 py-24 border-t border-white/5">
              <div className="mb-16">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Capabilities</h2>
                <h3 className="text-4xl font-bold text-white uppercase">Forensic Suite</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Visual Forensics", desc: "Scan screenshots for hidden malicious code, UI spoofing, and invalid SSL indicators.", icon: "📸" },
                  { title: "Voice Behavioral Intel", desc: "Analyze suspicious voice calls for stress patterns and social engineering keywords.", icon: "🎙️" },
                  { title: "Deep-Breach Scan", desc: "Search the dark web for your email/phone to see if your data is being traded.", icon: "🔍" },
                  { title: "Pattern Reasoning", desc: "AI provides the 'Why' behind every risk score, identifying the specific scam methodology.", icon: "🧠" },
                  { title: "Forensic Report", desc: "Export high-fidelity reports for law enforcement or insurance documentation.", icon: "📄" },
                  { title: "Live Grounding", desc: "Connected to Google Search to verify trending scams and fraudulent business identities.", icon: "🌐" }
                ].map((f, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-10 rounded-2xl hover:bg-white/[0.07] transition-all">
                    <div className="text-4xl mb-6">{f.icon}</div>
                    <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-tight">{f.title}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* HOW TO USE SECTION */}
            <section className="bg-white/[0.02] border-y border-white/5 px-8 py-32">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Operation Guide</h2>
                  <h3 className="text-4xl font-bold text-white uppercase">How to Use the Platform</h3>
                </div>
                <div className="grid md:grid-cols-4 gap-12">
                  {[
                    { step: "01", title: "Input Evidence", desc: "Upload a screenshot or type a description of the suspicious call/message." },
                    { step: "02", title: "Initiate Scan", desc: "Click 'Analyze Evidence'. Our AI models perform deep-packet and semantic inspection." },
                    { step: "03", title: "Review Score", desc: "Check the Risk Meter. Scores above 60% indicate highly probable fraudulent activity." },
                    { step: "04", title: "Follow Protocol", desc: "Execute the action steps immediately—block, report, or reset your credentials." }
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className="text-5xl font-black text-blue-500/20 absolute -top-10 -left-4">{s.step}</div>
                      <h4 className="text-lg font-bold text-white mb-4 relative z-10 uppercase tracking-tighter">{s.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {currentPage === Page.Detect && (
          <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col md:flex-row gap-12 min-h-[80vh]">
            <div className={`flex-grow flex flex-col bg-black/40 border transition-all duration-700 ${assessment && assessment.score > 60 ? 'border-red-500/20' : 'border-white/5'} rounded-lg overflow-hidden shadow-2xl`}>
              <div className="bg-black/40 border-b border-white/5 px-6 py-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-spin' : 'bg-blue-500 animate-pulse'}`}></div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-widest">Forensic Lab</h2>
                 </div>
                 <div className="flex gap-4 items-center">
                   {assessment && <button onClick={handleExportReport} className="text-[10px] font-bold uppercase text-blue-400 hover:text-white transition-colors border border-blue-400/20 px-3 py-1.5 rounded bg-blue-400/5">Export Case Report</button>}
                   {chatHistory.length > 0 && <button onClick={() => {setChatHistory([]); setAssessment(null);}} className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors">Reset</button>}
                 </div>
              </div>
              <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scroll">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <p className="max-w-xs text-sm italic font-mono uppercase tracking-widest">Awaiting interaction...<br/>Upload evidence or type context below.</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] px-6 py-5 rounded-2xl text-sm ${msg.role === 'user' ? (assessment && assessment.score > 60 ? 'bg-red-700' : 'bg-blue-600') : 'bg-black/60 border border-white/5 text-zinc-300 font-medium'} text-white shadow-xl`}>
                      {msg.role === 'analyst' && <span className="block text-[9px] uppercase font-bold text-blue-400 mb-2 tracking-widest">Forensic AI:</span>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-black/40 border-t border-white/5">
                <LiveAssistant onAssessmentReceived={setAssessment} externalInput={inputContext} setExternalInput={setInputContext} onManualAnalyze={handleAnalyze} loading={loading} />
              </div>
            </div>

            <div className="w-full md:w-[400px] shrink-0 space-y-6">
              <div className="bg-black/40 border border-emerald-500/20 p-8 rounded-lg shadow-xl relative overflow-hidden group">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Dark Web Leak Check
                </h4>
                <div className="space-y-4">
                  <input 
                    value={leakEmail} 
                    onChange={(e) => setLeakEmail(e.target.value)} 
                    placeholder="Email or Phone Number" 
                    className="w-full bg-black/60 border border-white/10 p-4 rounded-lg text-xs focus:border-emerald-500 outline-none transition-all" 
                  />
                  <button 
                    onClick={handleLeakScan}
                    disabled={leakStatus === 'scanning' || !leakEmail}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(5,150,105,0.2)]"
                  >
                    {leakStatus === 'scanning' ? 'Scanning Leaks...' : 'Run Forensic Scan'}
                  </button>
                  {leakStatus !== 'idle' && leakStatus !== 'scanning' && (
                    <div className={`p-4 rounded-lg text-center text-xs font-bold uppercase animate-in zoom-in-95 ${leakStatus === 'leaked' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {leakStatus === 'leaked' ? 'Exposure Detected' : 'No Leaks Found'}
                    </div>
                  )}
                </div>
              </div>

              {assessment && (
                <div className={`bg-black/60 border transition-all duration-700 ${assessment.score > 60 ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10'} p-8 rounded-lg animate-in fade-in slide-in-from-right-5 space-y-8`}>
                   <div>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Calculated Threat</span>
                     <h3 className="text-4xl font-black uppercase tracking-tighter transition-colors" style={{ color: assessment.score > 70 ? '#ef4444' : (assessment.score > 40 ? '#f59e0b' : '#3b82f6') }}>{assessment.threatLevel} ({assessment.score}%)</h3>
                   </div>
                   <div className="p-5 bg-black/60 border border-white/5 rounded-xl font-mono text-[11px] leading-relaxed relative">
                     <span className="text-blue-500 block mb-3 font-bold uppercase tracking-widest border-b border-blue-500/20 pb-1">AI Reasoning Log:</span>
                     <p className="text-zinc-400 italic">"{assessment.reasoning}"</p>
                   </div>
                   <div className="space-y-3">
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-blue-400">Tactical Defense Plan:</span>
                     <ul className="space-y-2">
                       {assessment.actionSteps.map((step, idx) => (
                         <li key={idx} className="flex gap-3 text-[11px] text-zinc-300 items-start">
                           <span className="text-blue-500 font-bold">»</span>
                           <span className="leading-tight">{step}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>
              )}
            </div>
          </section>
        )}

        {currentPage === Page.Blog && (
          <section className="max-w-6xl mx-auto px-8 py-24">
            <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
              <div>
                <h2 className="text-4xl font-bold text-white uppercase tracking-tight">Security Advisories</h2>
              </div>
            </div>
            {selectedArticle ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl mx-auto">
                <button onClick={() => setSelectedArticle(null)} className="text-blue-500 mb-12 uppercase text-[10px] font-bold tracking-widest hover:text-blue-400 flex items-center gap-2 group">
                   ← Back to Feed
                </button>
                <div className="mb-10">
                   <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedArticle.date}</span>
                   <h2 className="text-5xl font-black text-white mt-4 mb-8 uppercase tracking-tighter leading-none">{selectedArticle.title}</h2>
                </div>
                <div className="prose prose-invert max-w-none text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content}
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <div key={article.id} className="bg-black/40 border border-white/5 p-8 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col h-full shadow-xl" onClick={() => setSelectedArticle(article)}>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">{article.date}</span>
                    <h3 className="text-xl font-bold text-white mb-6 group-hover:text-blue-400 transition-all uppercase leading-tight">{article.title}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-3 italic leading-relaxed flex-grow">"{article.excerpt}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        
        {currentPage === Page.About && (
          <section className="max-w-4xl mx-auto px-8 py-32 text-center">
            <div className="space-y-12">
               <h2 className="text-5xl font-black text-white uppercase tracking-tighter">{aboutData?.title || 'Our Intelligence Mission'}</h2>
               <p className="text-2xl text-zinc-400 leading-relaxed font-light">
                 {aboutData?.content || "No-Phishing provides real-time situational awareness and AI forensic reasoning to protect global citizens."}
               </p>
            </div>
          </section>
        )}
      </main>
      <footer className="mt-40 px-8 py-20 border-t border-white/5 bg-black/40 text-center">
        <div className="flex flex-col items-center gap-6">
           <Logo score={0} className="w-10 h-10 grayscale opacity-20" />
           <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.5em]">No-Phishing 2026 • AI Forensic Division</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
