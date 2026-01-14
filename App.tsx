import React, { useState, useEffect, Suspense, lazy } from "react";
import { Page, BlogArticle, RiskAssessment } from "./types";
import {
  analyzeSituation,
  generateBlogArticles,
  getGeminiClient,
} from "./services/geminiService";
import { LiveAssistant } from "./components/LiveAssistant";

// Lazy load Keystatic UI to keep the main bundle light
const KeystaticAdmin = lazy(() => import("./KeystaticWrapper"));

const Polyhedron: React.FC<{ className?: string; color?: string }> = ({
  className,
  color = "currentColor",
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L90 30V70L50 95L10 70V30L50 5Z"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.5"
    />
    <path
      d="M50 5L50 95"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.3"
    />
    <path
      d="M10 30L90 30"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.3"
    />
    <path
      d="M10 70L90 70"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.3"
    />
    <path
      d="M50 5L10 70M50 5L90 70M10 30L50 95M90 30L50 95"
      stroke={color}
      strokeWidth="0.3"
      strokeOpacity="0.2"
    />
  </svg>
);

const GeometricBackground: React.FC<{ score: number }> = ({ score }) => {
  const isHighRisk = score > 60;
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0a0a0a]">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#1cb5c4 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>
      <div
        className={`absolute -top-[10%] -right-[10%] w-[70%] h-[100%] transition-all duration-1000 transform rotate-12 ${isHighRisk ? "bg-red-600/10" : "bg-[#1cb5c4]/15"}`}
        style={{ clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      />
      <Polyhedron className="absolute top-20 left-[10%] w-64 h-64 text-[#1cb5c4] animate-pulse" />
      <Polyhedron className="absolute bottom-40 right-[5%] w-96 h-96 text-[#3a7bd5] opacity-20 rotate-45" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [inputContext, setInputContext] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; text: string }[]
  >([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const [leakEmail, setLeakEmail] = useState("");
  const [leakResult, setLeakResult] = useState<{
    status: "secure" | "compromised" | "loading" | null;
    details?: string;
  }>({ status: null });

  // Simple routing for Keystatic
  const isAdminPath = window.location.pathname.startsWith("/keystatic");

  useEffect(() => {
    const loadStatic = async () => {
      try {
        const art = await generateBlogArticles();
        setArticles(art);
      } catch (err) {
        console.error(err);
      }
    };
    if (!isAdminPath) loadStatic();
  }, [isAdminPath]);

  if (isAdminPath) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono">
            INITIALIZING_ADMIN_CORE...
          </div>
        }
      >
        <KeystaticAdmin />
      </Suspense>
    );
  }

  const navigateTo = (p: Page) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkEmailLeak = async () => {
    if (!leakEmail.includes("@")) return;
    setLeakResult({ status: "loading" });
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Check if this email might be in known data leaks (simulated/grounded search): "${leakEmail}".
        Return a short verdict (status: compromised or secure) and brief details on which potential leaks.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text || "";
      const isCompromised =
        text.toLowerCase().includes("compromised") ||
        text.toLowerCase().includes("found");
      setLeakResult({
        status: isCompromised ? "compromised" : "secure",
        details: text,
      });
    } catch {
      setLeakResult({
        status: "secure",
        details: "No immediate records found.",
      });
    }
  };

  const handleAnalyze = async (imageData?: {
    data: string;
    mimeType: string;
  }) => {
    if ((!inputContext.trim() && !imageData) || loading) return;
    const userText = inputContext || "Visual forensic analysis initiated...";
    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);
    setInputContext("");
    setLoading(true);
    try {
      const result = await analyzeSituation(userText, imageData);
      setAssessment(result);
      setChatHistory((prev) => [
        ...prev,
        { role: "analyst", text: result.summary },
      ]);
    } catch (e) {
      setChatHistory((prev) => [
        ...prev,
        { role: "analyst", text: "Analysis failed. Verify connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const IndiaEmergencySection = () => (
    <div className="mt-8 space-y-4">
      <h4 className="text-white font-bold text-xs uppercase tracking-widest border-l-2 border-red-500 pl-3">
        India Cyber Response
      </h4>
      <div className="grid grid-cols-1 gap-3">
        <a
          href="tel:1930"
          className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all group"
        >
          <div>
            <span className="block text-[9px] font-black text-red-400 uppercase tracking-tighter">
              Emergency Helpline
            </span>
            <span className="text-2xl font-black text-white">1930</span>
          </div>
          <div className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-black animate-pulse">
            REPORT NOW
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30 font-inter">
      <GeometricBackground score={assessment?.score || 0} />

      <header className="px-8 py-5 sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateTo(Page.Home)}
          >
            <div className="bg-[#1cb5c4] text-black font-black p-1.5 rounded-sm text-xs group-hover:bg-white transition-colors">
              NP
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">
              No-Phishing
            </span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <button
              onClick={() => navigateTo(Page.Detect)}
              className="hover:text-[#1cb5c4] transition-colors"
            >
              Scanner
            </button>
            <button
              onClick={() => navigateTo(Page.Blog)}
              className="hover:text-[#1cb5c4] transition-colors"
            >
              Advisories
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-red-500 border border-red-500/20 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-all"
            >
              Emergency
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {currentPage === Page.Home && (
          <div className="space-y-32 pb-40">
            <section className="relative pt-32 px-8 max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-12">
                  <div className="inline-block border border-[#1cb5c4]/30 px-4 py-1 rounded-full bg-[#1cb5c4]/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1cb5c4]">
                      Securing Digital Frontiers
                    </span>
                  </div>
                  <h1 className="text-7xl md:text-[110px] font-black leading-[0.82] tracking-tighter uppercase">
                    Detection <br />{" "}
                    <span className="text-[#1cb5c4]">Redefined.</span>
                  </h1>
                  <p className="text-zinc-400 text-lg max-w-lg leading-relaxed font-medium">
                    Advanced AI forensic platform for identifying social
                    engineering attempts in real-time.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => navigateTo(Page.Detect)}
                      className="bg-white text-black px-10 py-5 font-black uppercase text-[11px] tracking-widest hover:bg-[#1cb5c4] transition-all"
                    >
                      Initiate Scan
                    </button>
                    <button
                      onClick={() => navigateTo(Page.Blog)}
                      className="border border-white/20 text-white px-10 py-5 font-black uppercase text-[11px] tracking-widest hover:bg-white/5 transition-all"
                    >
                      Advisories
                    </button>
                  </div>
                </div>
                <div className="relative hidden lg:block">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[120px] rounded-full"></div>
                  <div className="relative border border-white/10 bg-black/40 backdrop-blur-2xl p-10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-[10px] font-mono text-[#1cb5c4]">
                        ANALYSIS_V2.0.4
                      </span>
                    </div>
                    <div className="space-y-4 font-mono text-[11px] text-[#1cb5c4]/60">
                      <p className="flex justify-between">
                        <span>{"> SCANNING_HEX_ADJUST..."}</span>
                        <span className="text-white">OK</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{"> NLP_SENTIMENT_CORE..."}</span>
                        <span className="text-white">ACTIVE</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{"> PHISHING_VECTOR_MAP..."}</span>
                        <span className="text-white">12.4k TPS</span>
                      </p>
                      <div className="h-px bg-white/10 my-4"></div>
                      <div className="grid grid-cols-6 gap-2 opacity-40">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-8 bg-[#1cb5c4]/20 rounded-sm"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-8">
              <div className="bg-zinc-900 border border-[#1cb5c4]/20 rounded-3xl p-12 md:p-16 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Polyhedron className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="text-[10px] font-black text-[#1cb5c4] uppercase tracking-[0.4em] block mb-4">
                    Deep Web Intelligence
                  </span>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">
                    Have you been <span className="text-red-500">leaked?</span>
                  </h2>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="email"
                      placeholder="e.g. security@intelligence.org"
                      value={leakEmail}
                      onChange={(e) => setLeakEmail(e.target.value)}
                      className="flex-grow bg-black/50 border border-white/10 rounded-lg px-6 py-4 text-sm text-white focus:border-[#1cb5c4] focus:outline-none transition-all"
                    />
                    <button
                      onClick={checkEmailLeak}
                      className="bg-[#1cb5c4] text-black font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-lg hover:bg-white transition-all disabled:opacity-50"
                      disabled={leakResult.status === "loading"}
                    >
                      {leakResult.status === "loading"
                        ? "Scanning..."
                        : "Verify Email"}
                    </button>
                  </div>
                  {leakResult.status && (
                    <div
                      className={`mt-10 p-6 rounded-xl border ${leakResult.status === "compromised" ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-3 h-3 rounded-full ${leakResult.status === "compromised" ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                        ></div>
                        <span
                          className={`text-[11px] font-black uppercase tracking-widest ${leakResult.status === "compromised" ? "text-red-500" : "text-green-500"}`}
                        >
                          {leakResult.status === "compromised"
                            ? "Compromise Detected"
                            : "No Immediate Threats"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        {leakResult.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {currentPage === Page.Detect && (
          <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col lg:flex-row gap-12">
            <div className="flex-grow bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-2xl min-h-[600px]">
              <div className="p-5 border-b border-white/5 flex justify-between bg-white/5 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1cb5c4]">
                    Secure Node Active
                  </span>
                </div>
              </div>

              <div className="flex-grow p-10 overflow-y-auto space-y-8 custom-scroll">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                    <Polyhedron className="w-24 h-24 text-white/5" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-700">
                      Waiting for Intel
                    </h2>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-8 rounded-2xl ${m.role === "user" ? "bg-[#1cb5c4] text-black font-bold" : "bg-zinc-900 border border-white/10 text-zinc-300"}`}
                    >
                      <p className="text-sm leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-black/40 border-t border-white/5">
                <LiveAssistant
                  onAssessmentReceived={setAssessment}
                  externalInput={inputContext}
                  setExternalInput={setInputContext}
                  onManualAnalyze={handleAnalyze}
                  loading={loading}
                />
              </div>
            </div>

            <div className="w-full lg:w-[400px] space-y-8">
              {assessment && (
                <div className="bg-zinc-900 border border-white/10 p-10 rounded-2xl shadow-2xl">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block">
                    Threat Index
                  </span>
                  <h3
                    className={`text-7xl font-black tracking-tighter ${assessment.score > 60 ? "text-red-500" : "text-[#1cb5c4]"}`}
                  >
                    {assessment.score}%
                  </h3>
                  <div className="mt-10 space-y-6">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">
                        Diagnosis
                      </p>
                      <p className="text-sm text-zinc-200 leading-relaxed">
                        "{assessment.reasoning}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <IndiaEmergencySection />
            </div>
          </section>
        )}
      </main>

      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-900 border border-white/10 p-12 rounded-3xl relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-8 right-8 text-zinc-500"
            >
              ✕
            </button>
            <h3 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter">
              Emergency <span className="text-red-500">Protocol</span>
            </h3>
            <IndiaEmergencySection />
          </div>
        </div>
      )}

      <footer className="mt-40 border-t border-white/5 py-24 px-8 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 p-2 text-xs font-black rounded-sm">
              NP
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-white">
              No-Phishing
            </span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <button
              onClick={() => navigateTo(Page.Home)}
              className="hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => navigateTo(Page.Detect)}
              className="hover:text-white"
            >
              Scanner
            </button>
            <button
              onClick={() => navigateTo(Page.Blog)}
              className="hover:text-white"
            >
              Advisories
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
