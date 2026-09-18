import { useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  Highlighter,
  Loader2,
  Sparkles,
  Upload,
  Target,
  GraduationCap,
  BarChart3,
  UserCircle,
} from "lucide-react";

import logo from "../assets/logo.png";

const API_BASE = "http://127.0.0.1:5000";

export default function Summarizer({ onNavigate }) {
  const [mode, setMode] = useState("Short");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // ============================================================
  // TEXT SUMMARIZATION
  // ============================================================

  const summarize = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setSummary("");

      const response = await fetch(`${API_BASE}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          mode: mode,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not generate summary."
        );
      }

      setSummary(
        data.summary ||
          data.result ||
          data.text ||
          "No summary could be generated."
      );
    } catch (error) {
      console.error("Summarize error:", error);

      setSummary(
        error.message ||
          "Could not connect to the summarization service."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PDF UPLOAD + SUMMARIZATION
  // ============================================================

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];

    // Reset input so the same PDF can be selected again
    event.target.value = "";

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please upload a PDF file.");
      return;
    }

    try {
      setUploading(true);
      setSummary("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch(
        `${API_BASE}/api/summarize-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not summarize the PDF."
        );
      }

      setSummary(
        data.summary ||
          data.result ||
          "No summary could be generated."
      );
    } catch (error) {
      console.error("PDF summarization error:", error);

      alert(
        error.message ||
          "Could not upload and summarize the PDF."
      );
    } finally {
      setUploading(false);
    }
  };

  const modes = [
    "Short",
    "Detailed",
    "ELI5",
    "Exam",
  ];

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[245px] bg-[#003049] flex-col px-4 py-6 z-40">

        <div className="px-3 mb-8">
          <img
            src={logo}
            alt="Sankhyiki Saarthi"
            className="w-[195px] h-auto"
          />
        </div>

        <nav className="space-y-2">

          <SideItem
            icon={BookOpen}
            label="Dashboard"
            onClick={() => onNavigate("dashboard")}
          />

          <SideItem
            icon={BookOpen}
            label="Boonscrolling"
            onClick={() => onNavigate("boonscrolling")}
          />

          <SideItem
            icon={FileText}
            label="My Learning"
            onClick={() => onNavigate("MyLearning")}
          />

          <SideItem
            icon={GraduationCap}
            label="Adaptive Quiz"
            onClick={() => onNavigate("AdaptiveQuiz")}
          />

          <SideItem
            icon={Highlighter}
            label="Notes Desk"
            onClick={() => onNavigate("NotesDesk")}
          />

          <SideItem
            icon={Sparkles}
            label="Summarize"
            active
            onClick={() => onNavigate("Summarize")}
          />

          <SideItem
            icon={Target}
            label="Competencies"
            onClick={() => onNavigate("Competencies")}
          />

          <SideItem
            icon={BarChart3}
            label="Study Materials"
            onClick={() => onNavigate("StudyMaterials")}
          />

        </nav>

        {/* PROFILE AT BOTTOM */}
        <div className="mt-auto pt-4 border-t border-white/10">

          <SideItem
            icon={UserCircle}
            label="Profile"
            onClick={() => onNavigate("Profile")}
          />

        </div>

      </aside>

      {/* MAIN */}
      <main className="md:ml-[245px] min-h-screen">

        {/* TOP BAR */}
        <header className="h-[76px] border-b border-[#003049]/10 flex items-center justify-between px-5 md:px-8 sticky top-0 bg-[#FDF0D5]/95 backdrop-blur z-30">

          <div className="flex items-center gap-3">

            <div className="w-2.5 h-2.5 rounded-full bg-[#669BBC]" />

            <span className="small-serif text-sm text-[#003049]/55">
              AI learning assistant
            </span>

          </div>

          {/* ONLY PFP ON TOP RIGHT */}
          <button
            onClick={() => onNavigate("Profile")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#003049]/5 transition"
            aria-label="Profile"
          >
            <UserCircle size={28} />
          </button>

        </header>

        <div className="px-6 md:px-9 lg:px-12 py-9 max-w-[1450px]">

          {/* TITLE */}
          <div className="flex items-start justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-[#FFB703]/25 flex items-center justify-center">

                  <Sparkles size={22} />

                </div>

                <h1 className="font-mogilte text-5xl">
                  Summarizer
                </h1>

              </div>

              <p className="small-serif text-base text-[#003049]/55 mt-3">
                Paste your learning material and turn it into a focused summary.
              </p>

            </div>

          </div>

          {/* MODE SELECTOR */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-[#003049]/8 max-w-[850px]">

            {modes.map((item) => (

              <button
                key={item}
                onClick={() => setMode(item)}
                className={`py-3 rounded-xl text-sm font-semibold transition ${
                  mode === item
                    ? "bg-[#003049] text-white"
                    : "text-[#003049]/55 hover:bg-white/50"
                }`}
              >
                {item}
              </button>

            ))}

          </div>

          {/* CURRENT MODE */}
          <div className="flex items-center gap-2 mt-4">

            <span className="small-serif text-xs text-[#003049]/50">
              CURRENT MODE:
            </span>

            <span className="px-3 py-1 rounded-lg bg-[#FFB703]/20 text-xs font-semibold">
              {mode}
            </span>

          </div>

          {/* WORK AREA */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">

            {/* INPUT */}
            <div className="bg-white/75 border border-[#003049]/10 rounded-[26px] min-h-[550px] flex flex-col">

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content or type your notes here to summarize..."
                className="flex-1 min-h-[400px] p-7 bg-transparent outline-none resize-none small-serif text-base leading-7 placeholder:text-[#003049]/25"
              />

              {/* HIDDEN PDF INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />

              {/* BOTTOM */}
              <div className="border-t border-[#003049]/10 p-5 flex items-center justify-between">

                <div className="flex gap-2">

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || loading}
                    title="Upload PDF"
                    className="w-11 h-11 rounded-xl border border-[#003049]/10 bg-[#003049]/5 flex items-center justify-center hover:bg-[#003049]/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Upload size={18} />
                    )}
                  </button>

                </div>

                <button
                  onClick={summarize}
                  disabled={
                    loading ||
                    uploading ||
                    !text.trim()
                  }
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#003049] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Summarize
                    </>
                  )}

                </button>

              </div>

            </div>

            {/* OUTPUT */}
            <div className="bg-white/75 border border-[#003049]/10 rounded-[26px] min-h-[550px] p-7 md:p-8">

              {!summary ? (

                <div className="h-full min-h-[480px] flex flex-col items-center justify-center text-center">

                  <div className="w-20 h-20 rounded-full bg-[#FFB703]/20 flex items-center justify-center mb-5">

                    <Sparkles
                      size={32}
                      className="text-[#003049]/55"
                    />

                  </div>

                  <h2 className="font-mogilte text-3xl">
                    Ready to Summarize
                  </h2>

                  <p className="small-serif text-sm text-[#003049]/50 max-w-md mt-3">
                    Paste or type your learning content on the left,
                    choose a summary style, then click Summarize.
                  </p>

                </div>

              ) : (

                <div>

                  <div className="flex items-center justify-between mb-6">

                    <div>

                      <p className="small-serif text-[11px] uppercase tracking-[0.2em] text-[#175C4B]">
                        AI summary
                      </p>

                      <h2 className="font-mogilte text-3xl mt-2">
                        Your {mode.toLowerCase()} summary
                      </h2>

                    </div>

                    <Sparkles size={22} />

                  </div>

                  <div className="rounded-2xl bg-[#FDF0D5] p-6">

                    <p className="small-serif whitespace-pre-line text-base leading-8">
                      {summary}
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

function SideItem({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${
        active
          ? "bg-[#FFB703] text-[#003049]"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      }`}
    >

      <Icon size={18} />

      <span className="small-serif text-sm">
        {label}
      </span>

    </button>
  );
}