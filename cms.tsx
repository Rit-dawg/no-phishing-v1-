import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { githubCms, GithubContent } from "./services/cmsService";
import { GoogleGenAI } from "@google/genai";

const CMS_APP = () => {
  const [token, setToken] = useState(sessionStorage.getItem("gh_token") || "");
  const [repo, setRepo] = useState(sessionStorage.getItem("gh_repo") || "");
  const [isAuth, setIsAuth] = useState(!!token && !!repo);
  const [files, setFiles] = useState<GithubContent[]>([]);
  const [editingFile, setEditingFile] = useState<GithubContent | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const login = () => {
    sessionStorage.setItem("gh_token", token);
    sessionStorage.setItem("gh_repo", repo);
    setIsAuth(true);
    fetchFiles();
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await githubCms.getFiles(repo, "content", token);
      setFiles(data.filter((f) => f.name.endsWith(".md")));
    } catch (e) {
      setStatus("Error: Check token/repo permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (file: GithubContent) => {
    try {
      setLoading(true);
      const data = await githubCms.getFileContent(repo, file.path, token);
      setEditingFile(data);
      setContent(data.content || "");
    } catch (e) {
      setStatus("Failed to load file content");
    } finally {
      setLoading(false);
    }
  };

  const createNew = () => {
    const name = prompt("Enter filename (e.g. advisory-01.md)");
    if (!name) return;
    setEditingFile({ name, path: `content/${name}`, sha: "" });
    setContent(
      "---\ntitle: New Advisory\nauthor: Analyst\ndate: " +
        new Date().toISOString().split("T")[0] +
        "\n---\n\nWrite content here...",
    );
  };

  const save = async () => {
    if (!editingFile) return;
    try {
      setLoading(true);
      setStatus("Committing to GitHub...");
      await githubCms.saveFile(
        repo,
        editingFile.path,
        content,
        editingFile.sha || null,
        token,
      );
      setStatus("Success: Deployment triggered");
      fetchFiles();
    } catch (e: any) {
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setStatus("Error: API_KEY missing");
      return;
    }
    try {
      setLoading(true);
      setStatus("Consulting Gemini Intelligence...");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Refine this security advisory markdown for clarity and forensic accuracy. Keep frontmatter intact: \n\n${content}`,
      });
      if (response.text) setContent(response.text);
      setStatus("Forensic polishing complete");
    } catch (e) {
      setStatus("AI Assistant failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-6 text-cyan-500">
          Forensic Access
        </h1>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="GitHub Personal Access Token"
            className="w-full bg-black border border-white/10 p-3 rounded text-sm mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <input
            type="text"
            placeholder="owner/repo"
            className="w-full bg-black border border-white/10 p-3 rounded text-sm mono"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
          <button
            onClick={login}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-3 rounded uppercase text-xs tracking-widest transition-all"
          >
            Establish Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b border-white/10 bg-black/50 backdrop-blur flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500 text-black font-black px-2 py-1 rounded text-[10px]">
            CMS
          </div>
          <span className="text-xs font-bold mono opacity-50">{repo}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-[10px] mono text-cyan-500">{status}</span>
          <button
            onClick={() => setIsAuth(false)}
            className="text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100"
          >
            Disconnect
          </button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        <aside className="w-64 border-r border-white/10 bg-zinc-900/30 overflow-y-auto p-4">
          <button
            onClick={createNew}
            className="w-full border border-cyan-500/30 text-cyan-500 p-2 rounded text-[10px] font-black uppercase tracking-widest mb-6 hover:bg-cyan-500/10 transition-all"
          >
            + New Advisory
          </button>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Content Objects
            </p>
            {files.map((f) => (
              <button
                key={f.sha}
                onClick={() => loadFile(f)}
                className={`w-full text-left p-2 rounded text-xs mono truncate transition-all ${editingFile?.path === f.path ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 opacity-70"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-grow flex flex-col bg-black">
          {editingFile ? (
            <>
              <div className="p-2 border-b border-white/5 bg-zinc-900/50 flex justify-between px-6">
                <span className="text-[10px] mono text-zinc-500 flex items-center">
                  {editingFile.path}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={askAI}
                    disabled={loading}
                    className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300"
                  >
                    Gemini Assist
                  </button>
                  <button
                    onClick={save}
                    disabled={loading}
                    className="bg-cyan-600 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-50"
                  >
                    Publish
                  </button>
                </div>
              </div>
              <textarea
                className="flex-grow bg-transparent p-10 mono text-sm outline-none resize-none leading-relaxed text-zinc-300"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center opacity-20 flex-col gap-4">
              <div className="w-12 h-12 border border-white/30 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                Select Data Object to Edit
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const rootElement = document.getElementById("cms-root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<CMS_APP />);
}
