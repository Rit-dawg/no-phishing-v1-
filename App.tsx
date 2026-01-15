import React, { useState, useEffect } from "react";
import { Page, BlogArticle, RiskAssessment, PhishingChallenge } from "./types";
import {
  analyzeSituation,
  fetchAdvisories,
  generateLabChallenges,
} from "./services/geminiService";
import { LiveAssistant } from "./components/LiveAssistant";

/**
 * Logo Component
 * Using the custom pixel-accurate path data provided.
 */
const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 1600 1600"
    className={`${className} transition-transform duration-300 group-hover:scale-110`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0 C137.28 0 274.56 0 416 0 C416 52.8 416 105.6 416 160 C489.92 160 563.84 160 640 160 C640 107.2 640 54.4 640 0 C756.16 0 872.32 0 992 0 C992 47.52 992 95.04 992 144 C1013.12 144 1034.24 144 1056 144 C1056 170.4 1056 196.8 1056 224 C1034.88 224 1013.76 224 992 224 C992 250.4 992 276.8 992 304 C986.72 304 981.44 304 976 304 C976 325.12 976 346.24 976 368 C933.76 368 891.52 368 848 368 C848 426.08 848 484.16 848 544 C784.64 544 721.28 544 656 544 C656 522.88 656 501.76 656 480 C650.72 480 645.44 480 640 480 C640 443.04 640 406.08 640 368 C566.08 368 492.16 368 416 368 C416 426.08 416 484.16 416 544 C278.72 544 141.44 544 0 544 C0 364.48 0 184.96 0 0 Z "
      fill="#4D6DF3"
      transform="translate(224,448)"
    />
    <path
      d="M0 0 C73.92 0 147.84 0 224 0 C224 26.4 224 52.8 224 80 C176.48 80 128.96 80 80 80 C80 106.4 80 132.8 80 160 C127.52 160 175.04 160 224 160 C224 186.4 224 212.8 224 240 C176.48 240 128.96 240 80 240 C80 298.08 80 356.16 80 416 C53.6 416 27.2 416 0 416 C0 278.72 0 141.44 0 0 Z "
      fill="#FFFFFF"
      transform="translate(928,512)"
    />
    <path
      d="M0 0 C26.4 0 52.8 0 80 0 C80 137.28 80 274.56 80 416 C53.6 416 27.2 416 0 416 C0 357.92 0 299.84 0 240 C-21.12 240 -42.24 240 -64 240 C-64 213.6 -64 187.2 -64 160 C-42.88 160 -21.76 160 0 160 C0 107.2 0 54.4 0 0 Z "
      fill="#FFFFFF"
      transform="translate(496,512)"
    />
    <path
      d="M0 0 C21.12 0 42.24 0 64 0 C64 26.4 64 52.8 64 80 C90.4 80 116.8 80 144 80 C144 106.4 144 132.8 144 160 C117.6 160 91.2 160 64 160 C64 223.36 64 286.72 64 352 C69.28 352 74.56 352 80 352 C80 373.12 80 394.24 80 416 C53.6 416 27.2 416 0 416 C0 278.72 0 141.44 0 0 Z "
      fill="#FFFFFF"
      transform="translate(288,512)"
    />
    <path
      d="M0 0 C73.92 0 147.84 0 224 0 C224 26.4 224 52.8 224 80 C150.08 80 76.16 80 0 80 C0 53.6 0 27.2 0 0 Z "
      fill="#FFFFFF"
      transform="translate(640,672)"
    />
    <path
      d="M0 0 C21.12 0 42.24 0 64 0 C64 26.4 64 52.8 64 80 C42.88 80 21.76 80 0 80 C0 53.6 0 27.2 0 0 Z "
      fill="#FFFFFF"
      transform="translate(1152,592)"
    />
  </svg>
);

const RadarPing: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className={`relative w-48 h-48 mx-auto flex items-center justify-center ${active ? "opacity-100" : "opacity-20 transition-opacity"}`}
  >
    <div className="absolute inset-0 border border-cyan-500/30 rounded-full"></div>
    <div className="absolute inset-[25%] border border-cyan-500/20 rounded-full"></div>
    <div className="absolute inset-[50%] border border-cyan-500/10 rounded-full"></div>
    <div
      className={`absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-t from-cyan-500 to-transparent origin-bottom ${active ? "animate-spin-slow" : ""}`}
    ></div>
    <div className="w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,1)]"></div>
  </div>
);

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
      <Polyhedron
        className={`absolute top-20 left-[10%] w-64 h-64 text-[#1cb5c4] ${score > 0 ? "animate-spin-slow" : "animate-pulse"}`}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [challenges, setChallenges] = useState<PhishingChallenge[]>([]);
  const [inputContext, setInputContext] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; text: string }[]
  >([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [labLoading, setLabLoading] = useState(false);
  const [revealedLab, setRevealedLab] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    const init = async () => {
      try {
        const art = await fetchAdvisories();
        setArticles(art);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const startLab = async () => {
    setLabLoading(true);
    setRevealedLab([]);
    try {
      const ch = await generateLabChallenges();
      setChallenges(ch);
      setCurrentPage(Page.Lab);
    } finally {
      setLabLoading(false);
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
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
    setAssessment(null);
    setCompletedSteps({});
    try {
      const result = await analyzeSituation(userText, imageData);
      setAssessment(result);
      setChatHistory((prev) => [
        ...prev,
        { role: "analyst", text: result.summary },
      ]);
    } catch (e: any) {
      let errorMessage = "Forensic engine encountered an unexpected error.";
      if (e?.message?.includes("429")) {
        errorMessage =
          "System overloaded. Using fallback nodes. Please retry in 30s.";
      }
      setChatHistory((prev) => [
        ...prev,
        { role: "analyst", text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const IndiaEmergencySection = () => (
    <div className="mt-8 space-y-6">
      <div className="space-y-4">
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
              REPORT SCAM
            </div>
          </a>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-center py-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest underline"
          >
            cybercrime.gov.in
          </a>
        </div>
      </div>

      <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
        <h5 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Legal Disclaimer
        </h5>
        <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-tight">
          AI analysis is for guidance only.{" "}
          <span className="text-zinc-200">
            False reporting to authorities is a punishable offense
          </span>{" "}
          under the IT Act and IPC. Ensure all claims are verified before filing
          a formal police complaint.
        </p>
      </div>
    </div>
  );

  const HowToUseSection = () => (
    <section className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
      <div className="text-center mb-20">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
          Operational <span className="text-[#1cb5c4]">Protocol</span>
        </h2>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto uppercase tracking-widest font-bold">
          Standard Operating Procedure for Threat Identification
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {[
          {
            phase: "01",
            title: "Evidence Input",
            desc: "Paste the suspicious message, link, or upload a screenshot of the interaction.",
            icon: (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ),
          },
          {
            phase: "02",
            title: "Voice Analysis",
            desc: "Use the microphone icon to transcribe a live conversation or describe a phone scam.",
            icon: (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            ),
          },
          {
            phase: "03",
            title: "Forensic Audit",
            desc: "Gemini AI audits linguistic patterns, urgency levels, and technical spoofing indicators.",
            icon: (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            ),
          },
          {
            phase: "04",
            title: "Secure Response",
            desc: "Follow the generated Action Steps immediately to block threats and protect data.",
            icon: (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ),
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="relative group p-8 bg-zinc-900/40 border border-white/5 rounded-2xl hover:border-cyan-500/40 transition-all"
          >
            <div className="absolute top-4 right-4 text-xs font-black text-cyan-500/20 group-hover:text-cyan-500 transition-colors mono">
              PHASE {item.phase}
            </div>
            <div className="text-cyan-500 mb-6 bg-cyan-500/10 w-fit p-3 rounded-xl">
              {item.icon}
            </div>
            <h3 className="text-white font-black uppercase tracking-tighter text-lg mb-3">
              {item.title}
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30 font-inter text-zinc-100">
      <GeometricBackground score={assessment?.score || 0} />

      <header className="px-8 py-5 sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setCurrentPage(Page.Home)}
          >
            <Logo className="w-10 h-10" />
            <span className="font-black text-xl tracking-tighter uppercase">
              NO-PHISHING
            </span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <button
              onClick={() => setCurrentPage(Page.Detect)}
              className={`hover:text-[#1cb5c4] transition-colors ${currentPage === Page.Detect ? "text-white" : ""}`}
            >
              Scanner
            </button>
            <button
              onClick={startLab}
              className={`hover:text-[#1cb5c4] transition-colors ${currentPage === Page.Lab ? "text-white" : ""}`}
            >
              Lab
            </button>
            <button
              onClick={() => setCurrentPage(Page.Blog)}
              className={`hover:text-[#1cb5c4] transition-colors ${currentPage === Page.Blog ? "text-white" : ""}`}
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
          <div className="space-y-0 pb-40">
            <section className="relative pt-32 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
              <div className="inline-block border border-[#1cb5c4]/30 px-4 py-1 rounded-full bg-[#1cb5c4]/5 mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1cb5c4]">
                  Multi-Modal Threat Detection
                </span>
              </div>
              <h1 className="text-6xl md:text-[100px] font-black leading-[0.85] tracking-tighter uppercase mb-12">
                Scams <br /> Have{" "}
                <span className="text-[#1cb5c4]">No Room.</span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-lg mb-12">
                Dismantle social engineering attempts instantly using AI
                forensic reasoning. Verify messages, emails, and calls in
                real-time.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentPage(Page.Detect)}
                  className="bg-white text-black px-10 py-5 font-black uppercase text-[11px] tracking-widest hover:bg-[#1cb5c4] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  Start Scanner
                </button>
                <button
                  onClick={startLab}
                  className="border border-white/20 text-white px-10 py-5 font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Simulation Lab
                </button>
              </div>
            </section>

            <HowToUseSection />
          </div>
        )}

        {currentPage === Page.Detect && (
          <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col lg:flex-row gap-12">
            <div className="flex-grow bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-2xl">
              <div className="p-5 border-b border-white/5 flex justify-between bg-white/5 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1cb5c4]">
                    Forensic HUD
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-black tracking-widest text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  NEURAL RESILIENCY ACTIVE (3 NODES)
                </div>
              </div>

              <div className="flex-grow p-6 lg:p-10 overflow-y-auto space-y-8 min-h-[500px] custom-scroll">
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl mb-4 text-center">
                  <p className="text-[9px] text-yellow-500/80 font-bold uppercase tracking-widest">
                    NOTICE: AI analyses may contain inaccuracies. Verify all
                    forensic results manually. False reports to authorities
                    carry legal penalties.
                  </p>
                </div>
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                    <RadarPing active={loading} />
                    <p className="text-xs font-mono uppercase tracking-[0.3em]">
                      Awaiting Forensic Input
                    </p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-6 rounded-2xl ${m.role === "user" ? "bg-[#1cb5c4] text-black font-bold" : "bg-zinc-900 border border-white/10 text-zinc-300"}`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl animate-pulse flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-500/20"></div>
                    </div>
                  </div>
                )}
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
              {assessment ? (
                <div
                  className={`border p-10 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 ${assessment.score > 60 ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900 border-white/10"}`}
                >
                  <div className="flex items-baseline gap-4 mb-8">
                    <h3
                      className={`text-6xl font-black tracking-tighter ${assessment.score > 60 ? "text-red-500" : "text-[#1cb5c4]"}`}
                    >
                      {assessment.score}%
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${assessment.score > 60 ? "bg-red-500 text-white" : "bg-[#1cb5c4] text-black"}`}
                    >
                      {assessment.threatLevel} RISK
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-widest">
                        Reasoning
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {assessment.reasoning}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        Courses of Action
                      </p>
                      <div className="space-y-2">
                        {assessment.actionSteps.map((step, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleStep(idx)}
                            className={`flex gap-3 text-xs p-3 rounded-lg border cursor-pointer transition-all ${completedSteps[idx] ? "bg-green-500/20 border-green-500/40 opacity-50" : "bg-white/5 border-white/10 hover:border-[#1cb5c4]/50"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${completedSteps[idx] ? "bg-green-500 border-green-500" : "border-zinc-600"}`}
                            >
                              {completedSteps[idx] && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <p
                              className={
                                completedSteps[idx]
                                  ? "line-through text-zinc-500"
                                  : "text-zinc-300"
                              }
                            >
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 p-10 rounded-2xl text-center">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Forensic Reports will appear here
                  </p>
                </div>
              )}
              <IndiaEmergencySection />
            </div>
          </section>
        )}

        {currentPage === Page.Lab && (
          <section className="max-w-5xl mx-auto px-8 py-20">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
              Simulation <span className="text-cyan-500">Lab</span>
            </h2>
            <p className="text-zinc-500 text-sm mb-12">
              Practice identifying deceptive links. Click a challenge to reveal
              its forensic truth.
            </p>

            <div className="grid gap-6">
              {challenges.map((c, i) => (
                <div
                  key={i}
                  className={`p-8 bg-zinc-900 border border-white/10 rounded-2xl transition-all cursor-pointer ${revealedLab.includes(i) ? "border-cyan-500/50" : "hover:bg-white/5"}`}
                  onClick={() =>
                    !revealedLab.includes(i) && setRevealedLab((p) => [...p, i])
                  }
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {c.label}
                      </span>
                      <p className="text-xl font-mono text-white break-all">
                        {c.url}
                      </p>
                    </div>
                    {!revealedLab.includes(i) ? (
                      <div className="bg-cyan-500 text-black text-[9px] font-black px-4 py-2 rounded uppercase tracking-widest">
                        Investigate
                      </div>
                    ) : (
                      <div
                        className={`text-[9px] font-black px-4 py-2 rounded uppercase tracking-widest ${c.isPhishing ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
                      >
                        {c.isPhishing ? "SCAM DETECTED" : "LEGITIMATE"}
                      </div>
                    )}
                  </div>
                  {revealedLab.includes(i) && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {c.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={startLab}
                className="mt-8 text-cyan-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15"
                  />
                </svg>
                Regenerate Lab Challenges
              </button>
            </div>
          </section>
        )}

        {currentPage === Page.Blog && (
          <section className="max-w-7xl mx-auto px-8 py-20">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">
              Security <span className="text-[#1cb5c4]">Advisories</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="bg-zinc-900 border border-white/5 p-8 rounded-2xl hover:border-[#1cb5c4]/30 transition-all group"
                >
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-4">
                    {art.date}
                  </span>
                  <h3 className="text-xl font-black uppercase leading-tight mb-4 group-hover:text-[#1cb5c4]">
                    {art.title}
                  </h3>
                  <div
                    className="text-zinc-500 text-sm leading-relaxed mb-8 prose prose-invert"
                    dangerouslySetInnerHTML={{ __html: art.content }}
                  />
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white">Author:</span>
                    <span className="text-[#1cb5c4]">{art.author}</span>
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-30 uppercase tracking-[0.5em] text-xs">
                  No entries found in CMS
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="px-8 py-10 border-t border-white/5 text-center">
        <div className="flex justify-center items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <span> 2026 NO_PHISHING</span>
          <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
          <Logo></Logo>
          <a href="cms.html" className="hover:text-cyan-500 transition-colors">
            Forensic Portal
          </a>
        </div>
      </footer>

      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-2xl w-full bg-zinc-900 border border-white/10 p-12 rounded-3xl relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-8 right-8 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">
              Emergency <span className="text-red-500">Protocol</span>
            </h3>
            <IndiaEmergencySection />
          </div>
        </div>
      )}

      {labLoading && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">
              Fabricating Challenges...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
