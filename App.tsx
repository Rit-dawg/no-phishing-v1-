
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Page, BlogArticle, RiskAssessment } from './types';
import { 
  analyzeSituation, 
  generateBlogArticles, 
  checkAdminStatus, 
  fetchAboutPage,
  draftArticleWithAI
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [aboutData, setAboutData] = useState<{title: string, content: string} | null>(null);
  
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('auth_email'));
  const [isAdmin, setIsAdmin] = useState(false);
  
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
    if (userEmail) {
      checkAdminStatus(userEmail).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [userEmail]);

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

  const handleAcceptTOS = () => {
    localStorage.setItem('tos_accepted', 'true');
    setShowTOS(false);
  };

  const handleManualLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    try {
      const authorized = await checkAdminStatus(email);
      if (authorized) {
        setUserEmail(email);
        localStorage.setItem('auth_email', email);
        setShowLoginModal(false);
      } else {
        alert("Access Denied.");
      }
    } catch (err) {
      alert("Auth error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const navigateTo = (p: Page) => {
    setCurrentPage(p);
    if (p !== Page.Blog) setSelectedArticle(null);
    if (p !== Page.Detect) setAssessment(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async () => {
    if (!inputContext.trim() || loading) return;
    const userText = inputContext;
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setInputContext('');
    setLoading(true);
    
    try {
      const result = await analyzeSituation(userText);
      setAssessment(result);
      setChatHistory(prev => [...prev, { role: 'analyst', text: result.summary }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'analyst', text: "Analysis failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const Nav = () => (
    <header className={`border-b border-white/5 transition-colors duration-700 ${assessment && assessment.score > 60 ? 'bg-[#1a0a0a]/80' : 'bg-[#0a0f1a]/80'} backdrop-blur-xl px-8 py-4 sticky top-0 z-50`}>
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigateTo(Page.Home)}>
          <Logo score={assessment?.score || 0} className="w-11 h-10" />
          <span className="font-bold tracking-tight text-xl text-white/90 uppercase">NO-PHISHING</span>
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-widest">
          <button onClick={() => navigateTo(Page.Detect)} className={currentPage === Page.Detect ? (assessment && assessment.score > 60 ? 'text-red-400' : 'text-blue-400') : 'text-zinc-400 hover:text-white transition-colors'}>Verification</button>
          <button onClick={() => navigateTo(Page.Blog)} className={currentPage === Page.Blog ? 'text-blue-400' : 'text-zinc-400 hover:text-white transition-colors'}>Advisories</button>
          <button onClick={() => navigateTo(Page.About)} className={currentPage === Page.About ? 'text-blue-400' : 'text-zinc-400 hover:text-white transition-colors'}>About</button>
          {isAdmin && <button onClick={() => navigateTo(Page.Admin)} className="text-emerald-400">Panel</button>}
        </div>
        <div className="flex items-center gap-6">
           <div className={`w-1.5 h-1.5 rounded-full ${assessment && assessment.score > 60 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'} animate-pulse`}></div>
           <button onClick={() => setShowLoginModal(true)} className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white">
             {userEmail ? userEmail.split('@')[0] : 'Sign In'}
           </button>
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
            <h3 className="text-2xl font-bold text-white mb-6">Service Disclaimer</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              This platform provides AI-driven preliminary risk assessment. It does not constitute legal, financial, or professional security advice.
            </p>
            <button onClick={handleAcceptTOS} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded font-bold transition-all uppercase tracking-widest text-xs">Enter Platform</button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full bg-[#111827] border border-white/5 p-10 rounded-lg shadow-2xl relative">
             <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-zinc-500 text-2xl">{"\u00D7"}</button>
             <h3 className="text-lg font-bold text-white mb-8 uppercase tracking-widest">Auth Required</h3>
             <form onSubmit={handleManualLogin} className="space-y-6">
                <input name="email" type="email" required placeholder="Admin Email" className="w-full bg-black/40 border border-white/10 p-4 rounded text-sm focus:border-blue-500 outline-none" />
                <button disabled={isLoggingIn} className="w-full bg-blue-600 py-4 rounded text-xs font-bold uppercase tracking-widest transition-all">
                  {isLoggingIn ? 'Verifying...' : 'Sign In'}
                </button>
             </form>
          </div>
        </div>
      )}

      <button onClick={() => setShowReportModal(true)} className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-red-600 hover:bg-red-500 text-white px-2 py-6 rounded-l-md shadow-2xl transition-all border border-white/20">
        <span className="[writing-mode:vertical-lr] font-bold text-[10px] uppercase tracking-[0.3em]">Report Fraud</span>
      </button>

      {showReportModal && (
        <div className="fixed inset-0 z-[202] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="max-w-xl w-full bg-[#1c1c1c] p-12 border border-white/10 rounded-lg relative">
             <button onClick={() => setShowReportModal(false)} className="absolute top-6 right-6 text-zinc-500 text-2xl">{"\u00D7"}</button>
             <h3 className="text-3xl font-bold mb-4 uppercase">Emergency Action</h3>
             <p className="text-zinc-400 mb-10 text-sm">If funds are compromised, contact authorities immediately.</p>
             <div className="grid gap-4">
                <a href="tel:1930" className="p-6 bg-red-900/10 border border-red-500/20 rounded-lg text-center hover:border-red-500 transition-all">
                    <span className="block text-[10px] uppercase font-bold text-red-400">Call Helpline</span>
                    <span className="text-2xl font-bold">1930</span>
                </a>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="p-6 bg-zinc-900 border border-white/5 rounded-lg text-sm font-bold text-center hover:bg-zinc-800 transition-all">
                   {"Official Portal \u2197"}
                </a>
             </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {currentPage === Page.Home && (
          <>
            <section className="max-w-7xl mx-auto px-8 py-32 md:py-48 grid md:grid-cols-2 items-center gap-16">
              <div className="space-y-8 text-center md:text-left">
                <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.05]">
                  {"Forensic"} <br/> <span className="text-blue-500 italic">{"Security."}</span>
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                  Neutralize digital threats instantly using professional AI-driven situation analysis.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <button onClick={() => navigateTo(Page.Detect)} className="bg-white text-black px-10 py-5 rounded font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all">Start Analysis</button>
                  <button onClick={() => navigateTo(Page.Blog)} className="border border-white/10 hover:bg-white/5 px-10 py-5 rounded font-bold text-sm uppercase tracking-widest transition-all">Latest Advisories</button>
                </div>
              </div>
              <div className="hidden md:block">
                 <div className="bg-[#111827] border border-white/10 p-1 rounded-lg shadow-2xl">
                    <div className="bg-black/50 p-12 rounded-lg border border-white/5 font-mono text-sm text-blue-400 space-y-4">
                      <p className="opacity-50">{"[SYSTEM] INITIALIZING CORE..."}</p>
                      <p className="opacity-50">{"[SECURE] SCANNING THREAT VECTOR..."}</p>
                      <p className="text-white">{"[STATUS] READY_"}</p>
                    </div>
                 </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="bg-black/20 border-y border-white/5 py-32">
              <div className="max-w-7xl mx-auto px-8">
                <div className="mb-20">
                  <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Ecosystem</span>
                  <h2 className="text-4xl font-bold text-white mt-4 uppercase tracking-tighter">Defense Capabilities</h2>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white/5 border border-white/10 p-10 rounded-lg hover:border-blue-500/50 transition-all">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center mb-8">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">Voice Intelligence</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Transcribe and analyze verbal threats in real-time with Live API integration.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-10 rounded-lg hover:border-blue-500/50 transition-all">
                    <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center mb-8">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">Search Grounding</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Every analysis is cross-referenced with live Google Search data for current trends.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-10 rounded-lg opacity-60 relative group overflow-hidden">
                    <div className="absolute top-4 right-4 bg-zinc-800 text-[8px] font-bold px-2 py-1 rounded text-zinc-400 uppercase tracking-widest">v2.0 Beta</div>
                    <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center mb-8">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">Visual Forensics</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Analyzing screenshots and suspicious URLs for visual anomalies and phishing cues.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-10 rounded-lg opacity-60 relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-zinc-800 text-[8px] font-bold px-2 py-1 rounded text-zinc-400 uppercase tracking-widest">Upcoming</div>
                    <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center mb-8">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">Leak Scanner</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Cross-checking your credentials against recent major database breaches.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* HOW TO USE SECTION */}
            <section className="py-32">
              <div className="max-w-7xl mx-auto px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                  <div className="max-w-xl">
                    <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Operations</span>
                    <h2 className="text-4xl font-bold text-white mt-4 uppercase tracking-tighter">Analysis Protocol</h2>
                  </div>
                  <p className="text-zinc-500 text-sm max-w-xs border-l border-white/10 pl-6">Follow these three steps to secure your digital footprint immediately.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-16 relative">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 hidden md:block -translate-y-1/2 z-0"></div>
                  <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="w-16 h-16 bg-[#0a0f1a] border border-white/10 rounded-full flex items-center justify-center font-bold text-blue-500 mb-8 shadow-xl">01</div>
                    <h3 className="text-xl font-bold text-white mb-4">Describe the Interaction</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Paste text from an email, describe a phone call, or type out a suspicious SMS you received.</p>
                  </div>
                  <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="w-16 h-16 bg-[#0a0f1a] border border-white/10 rounded-full flex items-center justify-center font-bold text-blue-500 mb-8 shadow-xl">02</div>
                    <h3 className="text-xl font-bold text-white mb-4">AI Verification</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Gemini Flash cross-references the input with millions of known scam patterns and live web data.</p>
                  </div>
                  <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="w-16 h-16 bg-[#0a0f1a] border border-white/10 rounded-full flex items-center justify-center font-bold text-blue-500 mb-8 shadow-xl">03</div>
                    <h3 className="text-xl font-bold text-white mb-4">Execute Roadmap</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">Receive a risk score and a step-by-step action plan to protect your assets if compromised.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {currentPage === Page.Detect && (
          <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col md:flex-row gap-12 min-h-[80vh]">
            <div className={`flex-grow flex flex-col bg-black/40 border transition-all duration-700 ${assessment && assessment.score > 60 ? 'border-red-500/20' : 'border-white/5'} rounded-lg overflow-hidden`}>
              <div className="bg-black/40 border-b border-white/5 px-6 py-4 flex justify-between items-center">
                 <h2 className="text-xs font-bold text-white uppercase tracking-widest">Verification Stream</h2>
                 {chatHistory.length > 0 && (
                   <button onClick={() => {setChatHistory([]); setAssessment(null);}} className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white">Reset Case</button>
                 )}
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scroll">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <p className="text-sm">Describe the suspicious interaction or paste the content below.</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] px-5 py-4 rounded-lg text-sm ${msg.role === 'user' ? (assessment && assessment.score > 60 ? 'bg-red-700' : 'bg-blue-600') : 'bg-black/40 border border-white/5 text-zinc-300'} text-white`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-black/20 border-t border-white/5">
                <LiveAssistant 
                  onAssessmentReceived={setAssessment} 
                  externalInput={inputContext} 
                  setExternalInput={setInputContext} 
                  onManualAnalyze={handleAnalyze} 
                  loading={loading} 
                />
              </div>
            </div>

            {assessment && (
              <div className="w-full md:w-[400px] shrink-0 animate-in fade-in slide-in-from-right-5">
                <div className={`bg-black/60 border transition-all duration-700 ${assessment.score > 60 ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10'} p-8 rounded-lg`}>
                   <div className="mb-8">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Detection Score</span>
                     <h3 className="text-3xl font-bold uppercase tracking-tighter" style={{ color: assessment.score > 70 ? '#ef4444' : (assessment.score > 40 ? '#f59e0b' : '#3b82f6') }}>
                       {assessment.threatLevel} ({assessment.score}%)
                     </h3>
                   </div>
                   <div className="space-y-6">
                     <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Urgent Actions</h4>
                     <ul className="space-y-3">
                        {assessment.actionSteps.map((step, i) => (
                          <li key={i} className="text-sm text-zinc-300 flex gap-3">
                            <span className="text-blue-500 font-bold">{"\u2022"}</span>
                            {step}
                          </li>
                        ))}
                     </ul>
                   </div>
                </div>
              </div>
            )}
          </section>
        )}

        {currentPage === Page.Blog && (
          <section className="max-w-6xl mx-auto px-8 py-24">
            {selectedArticle ? (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <button onClick={() => setSelectedArticle(null)} className="text-blue-500 mb-8 uppercase text-[10px] font-bold tracking-widest hover:text-blue-400">{"\u2190 Back to Advisories"}</button>
                <h2 className="text-4xl font-bold text-white mb-6 uppercase tracking-tight leading-tight">{selectedArticle.title}</h2>
                <div className="h-px bg-white/10 mb-8" />
                <div className="prose prose-invert max-w-none text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap">
                   {selectedArticle.content}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white tracking-tighter uppercase mb-12">Security Advisories</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <div key={article.id} className="bg-black/40 border border-white/5 p-8 rounded-lg hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col h-full" onClick={() => setSelectedArticle(article)}>
                      <div className="flex-grow">
                        <span className="text-[10px] font-bold text-blue-500 uppercase mb-4 block tracking-widest">{article.date}</span>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-all">{article.title}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-3 italic leading-relaxed">{article.excerpt}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-zinc-600 group-hover:text-white mt-6">{"Review Findings \u2192"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {currentPage === Page.About && (
          <section className="max-w-4xl mx-auto px-8 py-32 animate-in fade-in slide-in-from-bottom-5">
             <h2 className="text-5xl font-bold text-white mb-12 tracking-tight uppercase">{aboutData?.title || 'Mission Statement'}</h2>
             <div className="prose prose-invert text-zinc-400 space-y-8 text-lg leading-relaxed">
                {aboutData?.content?.split('\n').map((para, i) => <p key={i}>{para}</p>)}
             </div>
          </section>
        )}

        {currentPage === Page.Admin && isAdmin && (
          <section className="max-w-4xl mx-auto px-8 py-32 space-y-12">
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Command Panel</h2>
            <div className="bg-black/40 border border-white/10 p-10 rounded-lg space-y-6">
              <h3 className="text-xs font-bold uppercase text-blue-400 tracking-widest">Publish New Intelligence</h3>
              <input id="draft-topic" placeholder="Threat Topic" className="w-full bg-black/20 border border-white/10 p-4 rounded text-sm focus:border-blue-500 outline-none" />
              <textarea id="draft-points" placeholder="Technical findings" className="w-full h-48 bg-black/20 border border-white/10 p-4 rounded text-sm focus:border-blue-500 outline-none" />
              <button 
                onClick={async () => {
                  const topicInput = document.getElementById('draft-topic') as HTMLInputElement | null;
                  const pointsInput = document.getElementById('draft-points') as HTMLTextAreaElement | null;
                  const topic = topicInput?.value;
                  const points = pointsInput?.value;
                  if (!topic) return;
                  setLoading(true);
                  try {
                    const draft = await draftArticleWithAI(topic, points || '');
                    const newArt: BlogArticle = { 
                      ...draft, 
                      id: Date.now().toString(), 
                      date: new Date().toLocaleDateString(), 
                      author: "System Forensic" 
                    };
                    setArticles([newArt, ...articles]);
                    navigateTo(Page.Blog);
                  } catch (e) { alert("Generation failed."); } finally { setLoading(false); }
                }}
                className="w-full bg-white text-black py-4 rounded font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all"
              >
                {loading ? 'Processing...' : 'Broadcast Intelligence'}
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-40 px-8 py-16 border-t border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">No-Phishing © 2025 • AI-Powered Security Intelligence</p>
      </footer>
    </div>
  );
};

export default App;

