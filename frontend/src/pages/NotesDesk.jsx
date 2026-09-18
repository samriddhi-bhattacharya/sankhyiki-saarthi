import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bold,
  CheckSquare,
  Circle,
  Code2,
  Eraser,
  FileText,
  Folder,
  Highlighter,
  Italic,
  Library,
  List,
  LayoutDashboard,
  MousePointer2,
  Pen,
  Plus,
  Quote,
  Search,
  Sparkles,
  Target,
  Trash2,
  Type,
  UserRound,
  Square,
  Minus,
  GraduationCap,
  Undo2,
  Redo2,
  Upload,
  File,
  FolderOpen,
  ChevronRight,
} from "lucide-react";

import logo from "../assets/logo.png";

const API_BASE = "http://127.0.0.1:5000";

const tools = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pen", icon: Pen, label: "Pen" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "text", icon: Type, label: "Text" },
];

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
        active
          ? "bg-[#FFB703] text-[#003049]"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={19} strokeWidth={1.8} />

      <span className="small-serif text-sm">{label}</span>

      {active && <ArrowRight size={15} className="ml-auto" />}
    </button>
  );
}

function TopSidebar({ onNavigate }) {
  return (
    <aside className="hidden md:flex w-[245px] bg-[#003049] min-h-screen fixed left-0 top-0 bottom-0 flex-col px-4 py-6 z-40">
      <div className="px-3 mb-8">
        <img
          src={logo}
          alt="Sankhyiki Saarthi"
          className="w-[195px] h-auto object-contain"
        />
      </div>

      <nav className="space-y-2">
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={() => onNavigate("dashboard")}
        />

        <SidebarItem
          icon={Sparkles}
          label="Boonscrolling"
          onClick={() => onNavigate("boonscrolling")}
        />

        <SidebarItem
          icon={GraduationCap}
          label="My Learning"
          onClick={() => onNavigate("MyLearning")}
        />

        <SidebarItem
          icon={Target}
          label="Adaptive Quiz"
          onClick={() => onNavigate("AdaptiveQuiz")}
        />

        <SidebarItem
          icon={FileText}
          label="Notes Desk"
          active
          onClick={() => onNavigate("NotesDesk")}
        />

        <SidebarItem
          icon={Highlighter}
          label="Summarize"
          onClick={() => onNavigate("Summarize")}
        />

        <SidebarItem
          icon={Target}
          label="Competencies"
          onClick={() => onNavigate("Competencies")}
        />

        <SidebarItem
          icon={Library}
          label="Study Materials"
          onClick={() => onNavigate("StudyMaterials")}
        />
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <SidebarItem
          icon={UserRound}
          label="Profile"
          onClick={() => onNavigate("Profile")}
        />
      </div>
    </aside>
  );
}

export default function NotesDesk({ onNavigate }) {
  const [screen, setScreen] = useState("notes");

  const [notes, setNotes] = useState([]);

  const [selectedNote, setSelectedNote] = useState(null);

  const [search, setSearch] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(true);

  const [organizerFilter, setOrganizerFilter] = useState("all");

  const [organizerSearch, setOrganizerSearch] = useState("");

  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const userId = Number(
  localStorage.getItem("sankhyiki_user_id")
);

  /* =========================================================
     LOAD NOTES
  ========================================================= */

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);

      const response = await fetch(
        `${API_BASE}/api/notes/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await response.json();

      const backendNotes =
        Array.isArray(data)
          ? data
          : data.notes || [];

      const formattedNotes = backendNotes.map((note) => ({
        ...note,

        category:
          note.category ||
          "Uncategorized",

        note_type:
          note.note_type ||
          (note.file_name ||
          note.original_file_name
            ? "pdf"
            : "written"),

        updated:
          note.updated ||
          (note.created_at
            ? formatDate(note.created_at)
            : "just now"),
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error("Load notes error:", error);
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  /* =========================================================
     CREATE NEW NOTE
  ========================================================= */

  const createNote = () => {
    const newNote = {
      id: null,
      title: "Untitled Note",
      category: "Uncategorized",
      content: "",
      drawing_data: "",
      updated: "just now",
      note_type: "written",
      isNew: true,
    };

    setSelectedNote(newNote);
    setScreen("editor");
  };

  /* =========================================================
     OPEN EXISTING NOTE
  ========================================================= */

  const openEditor = (note) => {
    if (
      note.note_type === "pdf" &&
      note.file_url
    ) {
      window.open(
        note.file_url.startsWith("http")
          ? note.file_url
          : `${API_BASE}${note.file_url}`,
        "_blank"
      );

      return;
    }

    setSelectedNote(note);
    setScreen("editor");
  };

  /* =========================================================
     AFTER SAVE
  ========================================================= */

  const handleSaved = (savedNote) => {
    if (!savedNote) return;

    const formattedNote = {
      ...savedNote,

      category:
        savedNote.category ||
        "Uncategorized",

      note_type:
        savedNote.note_type ||
        "written",

      updated:
        savedNote.updated ||
        "just now",
    };

    setNotes((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          String(item.id) ===
          String(formattedNote.id)
      );

      if (existingIndex !== -1) {
        const updated = [...prev];

        updated[existingIndex] =
          formattedNote;

        return updated;
      }

      return [
        formattedNote,
        ...prev,
      ];
    });

    setSelectedNote(formattedNote);
  };

  /* =========================================================
     DELETE NOTE
  ========================================================= */

  const deleteNote = async (noteId) => {
    if (!noteId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete note"
        );
      }

      setNotes((prev) =>
        prev.filter(
          (note) =>
            String(note.id) !==
            String(noteId)
        )
      );

      setSelectedNote(null);
      setScreen("notes");
    } catch (error) {
      console.error(
        "Delete note error:",
        error
      );

      alert(
        "Could not delete the note."
      );
    }
  };

  /* =========================================================
     PDF UPLOAD
  ========================================================= */

  const handlePdfUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      file.type !==
        "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      alert("Please upload a PDF file.");
      return;
    }

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "user_id",
        userId
      );

      const response =
        await fetch(
          `${API_BASE}/api/notes/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "PDF upload failed"
        );
      }

      await loadNotes();

      alert(
        "PDF uploaded successfully."
      );
    } catch (error) {
      console.error(
        "PDF upload error:",
        error
      );

      alert(
        error.message ||
          "Could not upload PDF."
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     FILTERED NOTES
  ========================================================= */

  const filteredNotes =
    notes.filter(
      (note) =>
        (note.title || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  /* =========================================================
     ORGANIZER DATA
  ========================================================= */

  const writtenNotes =
    notes.filter(
      (note) =>
        note.note_type !== "pdf"
    );

  const uploadedNotes =
    notes.filter(
      (note) =>
        note.note_type === "pdf"
    );

  const organizerNotes =
    notes.filter((note) => {
      const matchesSearch =
        (note.title || "")
          .toLowerCase()
          .includes(
            organizerSearch.toLowerCase()
          );

      if (
        organizerFilter ===
        "written"
      ) {
        return (
          matchesSearch &&
          note.note_type !== "pdf"
        );
      }

      if (
        organizerFilter ===
        "pdf"
      ) {
        return (
          matchesSearch &&
          note.note_type === "pdf"
        );
      }

      return matchesSearch;
    });

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">
      <TopSidebar onNavigate={onNavigate} />

      <main className="md:ml-[245px] min-h-screen">
        <header className="h-[76px] border-b border-[#003049]/10 bg-[#FDF0D5]/95 backdrop-blur flex items-center justify-between px-5 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#669BBC]" />

            <span className="small-serif text-sm text-[#003049]/55">
              Your private learning desk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="w-10 h-10 rounded-full border border-[#003049]/10 bg-white/50 flex items-center justify-center"
            >
              <Search size={17} />
            </button>

            <button
              onClick={() =>
                onNavigate("Profile")
              }
              className="w-10 h-10 rounded-full border border-[#003049]/10 bg-[#FFB703] flex items-center justify-center hover:scale-105 transition"
              title="Profile"
            >
              <UserRound size={18} />
            </button>
          </div>
        </header>

        {screen === "notes" && (
          <NotesHome
            notes={filteredNotes}
            search={search}
            setSearch={setSearch}
            createNote={createNote}
            openEditor={openEditor}
            onNavigate={onNavigate}
            loadingNotes={loadingNotes}
            onOpenFolders={() =>
              setScreen("organizer")
            }
          />
        )}

        {screen === "organizer" && (
          <NotesOrganizer
            notes={organizerNotes}
            writtenNotes={writtenNotes}
            uploadedNotes={uploadedNotes}
            filter={organizerFilter}
            setFilter={setOrganizerFilter}
            search={organizerSearch}
            setSearch={setOrganizerSearch}
            createNote={createNote}
            openEditor={openEditor}
            onBack={() =>
              setScreen("notes")
            }
            onUpload={() =>
              fileInputRef.current?.click()
            }
            uploading={uploading}
          />
        )}

        {screen === "editor" && (
          <NoteEditor
            note={selectedNote}
            userId={userId}
            onBack={() => {
              setScreen("notes");
              loadNotes();
            }}
            onSaved={handleSaved}
            onDelete={deleteNote}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handlePdfUpload}
          className="hidden"
        />
      </main>
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {
  if (!dateString) return "just now";

  const date = new Date(
    dateString.replace(" ", "T")
  );

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  const now = new Date();

  const diff =
    now.getTime() -
    date.getTime();

  const minutes = Math.floor(
    diff / 60000
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

/* =========================================================
   NOTES HOME
========================================================= */

function NotesHome({
  notes,
  search,
  setSearch,
  createNote,
  openEditor,
  onNavigate,
  loadingNotes,
  onOpenFolders,
}) {
  return (
    <div className="px-6 md:px-9 lg:px-12 py-9 max-w-[1450px]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="small-serif text-xs tracking-[0.2em] uppercase text-[#175C4B]">
            Notes Desk
          </p>

          <h1 className="font-mogilte text-5xl mt-2">
            My Notes
          </h1>

          <p className="small-serif text-base text-[#003049]/55 mt-2">
            {loadingNotes
              ? "Loading..."
              : `${notes.length} ${
                  notes.length === 1
                    ? "note"
                    : "notes"
                }`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenFolders}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-[#003049]/10 bg-white/60 hover:bg-white transition"
          >
            <Folder size={17} />

            <span className="small-serif text-sm">
              Folders
            </span>
          </button>

          <button
            onClick={() =>
              onNavigate(
                "StudyMaterials"
              )
            }
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-[#003049]/10 bg-white/60"
          >
            <Library size={17} />

            <span className="small-serif text-sm">
              Study Materials
            </span>
          </button>

          <button
            onClick={createNote}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#003049] text-white shadow-[0_8px_20px_rgba(0,48,73,0.15)] hover:-translate-y-0.5 transition"
          >
            <Plus size={18} />

            <span className="font-semibold text-sm">
              New note
            </span>
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-[600px] relative">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/40"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search notes by title..."
          className="w-full h-13 pl-12 pr-5 rounded-2xl border border-[#003049]/10 bg-white/60 outline-none focus:border-[#669BBC] small-serif text-sm"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() =>
              openEditor(note)
            }
            className="text-left rounded-[24px] overflow-hidden border border-[#003049]/10 bg-white/75 hover:-translate-y-1 transition shadow-[0_8px_25px_rgba(0,48,73,0.05)]"
          >
            <div className="h-[175px] bg-[#003049]/5 flex items-center justify-center">
              <FileText
                size={42}
                strokeWidth={1.2}
                className="text-[#669BBC]"
              />
            </div>

            <div className="p-5 border-t border-[#003049]/10">
              <h3 className="font-semibold text-base">
                {note.title ||
                  "Untitled Note"}
              </h3>

              <div className="flex items-center justify-between mt-3">
                <span className="small-serif text-xs text-[#003049]/50">
                  {note.category ||
                    "Uncategorized"}
                </span>

                <span className="small-serif text-xs text-[#003049]/45">
                  {note.updated ||
                    "just now"}
                </span>
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={createNote}
          className="min-h-[250px] rounded-[24px] border-2 border-dashed border-[#003049]/15 bg-white/30 hover:bg-white/50 transition flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFB703]/25 flex items-center justify-center mb-3">
            <Plus size={22} />
          </div>

          <span className="font-semibold text-sm">
            Create a new note
          </span>

          <span className="small-serif text-xs text-[#003049]/45 mt-1">
            Write, draw or organize
          </span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   NOTES ORGANIZER
========================================================= */

function NotesOrganizer({
  notes,
  writtenNotes,
  uploadedNotes,
  filter,
  setFilter,
  search,
  setSearch,
  createNote,
  openEditor,
  onBack,
  onUpload,
  uploading,
}) {
  return (
    <div className="px-6 md:px-9 lg:px-12 py-9 max-w-[1450px]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 small-serif text-sm text-[#003049]/55 hover:text-[#003049] mb-4"
          >
            <ArrowLeft size={16} />
            Back to Notes Desk
          </button>

          <p className="small-serif text-xs tracking-[0.2em] uppercase text-[#175C4B]">
            Notes Library
          </p>

          <h1 className="font-mogilte text-5xl mt-2">
            Organize
          </h1>

          <p className="small-serif text-base text-[#003049]/55 mt-2">
            Keep your written notes and study PDFs together.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#FFB703] text-[#003049] font-semibold hover:-translate-y-0.5 transition disabled:opacity-60"
          >
            <Upload size={17} />

            <span className="text-sm">
              {uploading
                ? "Uploading..."
                : "Upload PDF"}
            </span>
          </button>

          <button
            onClick={createNote}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#003049] text-white shadow-[0_8px_20px_rgba(0,48,73,0.15)] hover:-translate-y-0.5 transition"
          >
            <Plus size={18} />

            <span className="font-semibold text-sm">
              New note
            </span>
          </button>
        </div>
      </div>

      {/* ORGANIZER SUMMARY */}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() =>
            setFilter("all")
          }
          className={`rounded-[22px] border p-5 text-left transition ${
            filter === "all"
              ? "bg-[#003049] text-white border-[#003049]"
              : "bg-white/60 border-[#003049]/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <FolderOpen size={22} />

            <span className="text-2xl font-semibold">
              {writtenNotes.length +
                uploadedNotes.length}
            </span>
          </div>

          <p className="small-serif text-sm mt-4 opacity-70">
            All materials
          </p>
        </button>

        <button
          onClick={() =>
            setFilter("written")
          }
          className={`rounded-[22px] border p-5 text-left transition ${
            filter === "written"
              ? "bg-[#FFB703] border-[#FFB703]"
              : "bg-white/60 border-[#003049]/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <FileText size={22} />

            <span className="text-2xl font-semibold">
              {writtenNotes.length}
            </span>
          </div>

          <p className="small-serif text-sm mt-4 opacity-70">
            My written notes
          </p>
        </button>

        <button
          onClick={() =>
            setFilter("pdf")
          }
          className={`rounded-[22px] border p-5 text-left transition ${
            filter === "pdf"
              ? "bg-[#669BBC] text-[#003049] border-[#669BBC]"
              : "bg-white/60 border-[#003049]/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <File size={22} />

            <span className="text-2xl font-semibold">
              {uploadedNotes.length}
            </span>
          </div>

          <p className="small-serif text-sm mt-4 opacity-70">
            Uploaded PDFs
          </p>
        </button>
      </div>

      {/* SEARCH */}

      <div className="mt-8 max-w-[650px] relative">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/40"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search your notes and PDFs..."
          className="w-full h-13 pl-12 pr-5 rounded-2xl border border-[#003049]/10 bg-white/60 outline-none focus:border-[#669BBC] small-serif text-sm"
        />
      </div>

      {/* MATERIALS */}

      <div className="mt-8">
        {notes.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-[#003049]/15 bg-white/40 min-h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFB703]/25 flex items-center justify-center mb-4">
              <FolderOpen size={25} />
            </div>

            <h3 className="font-semibold text-lg">
              Your library is empty
            </h3>

            <p className="small-serif text-sm text-[#003049]/50 mt-2">
              Create a note or upload your first PDF.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {notes.map((note) => {
              const isPdf =
                note.note_type === "pdf";

              return (
                <button
                  key={note.id}
                  onClick={() =>
                    openEditor(note)
                  }
                  className="text-left rounded-[24px] overflow-hidden border border-[#003049]/10 bg-white/75 hover:-translate-y-1 transition shadow-[0_8px_25px_rgba(0,48,73,0.05)]"
                >
                  <div
                    className={`h-[175px] flex items-center justify-center ${
                      isPdf
                        ? "bg-[#669BBC]/15"
                        : "bg-[#003049]/5"
                    }`}
                  >
                    {isPdf ? (
                      <File
                        size={46}
                        strokeWidth={1.2}
                        className="text-[#669BBC]"
                      />
                    ) : (
                      <FileText
                        size={46}
                        strokeWidth={1.2}
                        className="text-[#669BBC]"
                      />
                    )}
                  </div>

                  <div className="p-5 border-t border-[#003049]/10">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base line-clamp-2">
                        {note.title ||
                          "Untitled Note"}
                      </h3>

                      <ChevronRight
                        size={17}
                        className="shrink-0 mt-0.5 text-[#003049]/35"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="small-serif text-xs text-[#003049]/50">
                        {isPdf
                          ? "PDF"
                          : note.category ||
                            "Uncategorized"}
                      </span>

                      <span className="small-serif text-xs text-[#003049]/45">
                        {note.updated ||
                          "just now"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NOTE EDITOR
========================================================= */

function NoteEditor({
  note,
  userId,
  onBack,
  onSaved,
  onDelete,
}) {
  const canvasRef = useRef(null);

  const baseCanvasRef = useRef(null);

  const drawingRef = useRef(false);

  const startPointRef = useRef(null);

  const activeToolRef =
    useRef("select");

  const colorRef =
    useRef("#003049");

  const sizeRef =
    useRef(4);

  const editorRef =
    useRef(null);

  const titleRef =
    useRef(null);

  const [activeTool, setActiveTool] =
    useState("select");

  const [color, setColor] =
    useState("#003049");

  const [fontSize, setFontSize] =
    useState(4);

  const [history, setHistory] =
    useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  const [noteId, setNoteId] =
    useState(note?.id || null);

  const [noteTitle, setNoteTitle] =
    useState(
      note?.title ||
        "Untitled Note"
    );

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  /* =======================================================
     LOAD NOTE CONTENT
  ======================================================= */

  useEffect(() => {
    setNoteId(
      note?.id || null
    );

    setNoteTitle(
      note?.title ||
        "Untitled Note"
    );

    setSaveMessage("");

    setLoaded(false);
  }, [note]);

  useEffect(() => {
    if (
      !editorRef.current ||
      loaded
    ) {
      return;
    }

    editorRef.current.innerHTML =
      note?.content || "";

    setLoaded(true);
  }, [note, loaded]);

  /* =======================================================
     LOAD DRAWING
  ======================================================= */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (
      note?.drawing_data
    ) {
      const img =
        new Image();

      img.onload = () => {
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const initial =
          canvas.toDataURL(
            "image/png"
          );

        setHistory([
          initial,
        ]);

        setHistoryIndex(0);
      };

      img.src =
        note.drawing_data;
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [note]);

  /* =======================================================
     ACTIVE SETTINGS
  ======================================================= */

  useEffect(() => {
    activeToolRef.current =
      activeTool;
  }, [activeTool]);

  useEffect(() => {
    colorRef.current =
      color;
  }, [color]);

  useEffect(() => {
    sizeRef.current =
      fontSize;
  }, [fontSize]);

  /* =======================================================
     POSITION
  ======================================================= */

  const getPosition = (
    event
  ) => {
    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width /
      rect.width;

    const scaleY =
      canvas.height /
      rect.height;

    return {
      x:
        (event.clientX -
          rect.left) *
        scaleX,

      y:
        (event.clientY -
          rect.top) *
        scaleY,
    };
  };

  /* =======================================================
     HISTORY
  ======================================================= */

  const pushHistory = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const image =
      canvas.toDataURL(
        "image/png"
      );

    setHistory((prev) => {
      const trimmed =
        prev.slice(
          0,
          historyIndex + 1
        );

      return [
        ...trimmed,
        image,
      ].slice(-30);
    });

    setHistoryIndex(
      (prev) => prev + 1
    );
  };

  const restoreImage = (
    image
  ) => {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !image
    ) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    const img =
      new Image();

    img.onload = () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    img.src = image;
  };

  const undo = () => {
    if (
      historyIndex < 0
    ) {
      return;
    }

    const newIndex =
      historyIndex - 1;

    setHistoryIndex(
      newIndex
    );

    if (newIndex < 0) {
      const canvas =
        canvasRef.current;

      const ctx =
        canvas.getContext("2d");

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      return;
    }

    restoreImage(
      history[newIndex]
    );
  };

  const redo = () => {
    if (
      historyIndex >=
      history.length - 1
    ) {
      return;
    }

    const newIndex =
      historyIndex + 1;

    setHistoryIndex(
      newIndex
    );

    restoreImage(
      history[newIndex]
    );
  };

  /* =======================================================
     TEXT FORMATTING
  ======================================================= */

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const updateEditorContent = () => {
    if (!editorRef.current) {
      return;
    }

    return editorRef.current
      .innerHTML;
  };

  const formatText = (
    command,
    value = null
  ) => {
    focusEditor();

    document.execCommand(
      command,
      false,
      value
    );

    updateEditorContent();

    editorRef.current?.focus();
  };

  const applyHeading = (
    level
  ) => {
    focusEditor();

    document.execCommand(
      "formatBlock",
      false,
      level
    );

    editorRef.current?.focus();
  };

  const applyBulletList = () => {
    formatText(
      "insertUnorderedList"
    );
  };

  const applyChecklist = () => {
    focusEditor();

    document.execCommand(
      "insertUnorderedList"
    );

    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return;
    }

    const range =
      selection.getRangeAt(0);

    let node =
      range.startContainer;

    while (
      node &&
      node !==
        editorRef.current &&
      node.nodeName !== "LI"
    ) {
      node =
        node.parentNode;
    }

    if (
      node &&
      node.nodeName === "LI"
    ) {
      if (
        !node.innerHTML
          .trim()
          .startsWith("☐")
      ) {
        node.innerHTML =
          `☐ ${node.innerHTML}`;
      }
    }

    editorRef.current?.focus();
  };

  const applyQuote = () => {
    focusEditor();

    document.execCommand(
      "formatBlock",
      false,
      "blockquote"
    );

    editorRef.current?.focus();
  };

  const applyCode = () => {
    focusEditor();

    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return;
    }

    const selectedText =
      selection.toString();

    if (!selectedText) {
      document.execCommand(
        "formatBlock",
        false,
        "pre"
      );
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<code>${escapeHtml(
          selectedText
        )}</code>`
      );
    }

    editorRef.current?.focus();
  };

  const applyHighlight = () => {
    focusEditor();

    document.execCommand(
      "hiliteColor",
      false,
      "#FFB703"
    );

    editorRef.current?.focus();
  };

  const escapeHtml = (
    text
  ) => {
    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      text;

    return div.innerHTML;
  };

  /* =======================================================
     DRAWING HELPERS
  ======================================================= */

  const createBaseCanvas = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const base =
      document.createElement(
        "canvas"
      );

    base.width =
      canvas.width;

    base.height =
      canvas.height;

    const baseCtx =
      base.getContext("2d");

    baseCtx.clearRect(
      0,
      0,
      base.width,
      base.height
    );

    baseCtx.drawImage(
      canvas,
      0,
      0
    );

    baseCanvasRef.current =
      base;
  };

  const restoreBaseCanvas = () => {
    const canvas =
      canvasRef.current;

    const base =
      baseCanvasRef.current;

    if (
      !canvas ||
      !base
    ) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      base,
      0,
      0
    );
  };

  const drawArrowHead = (
    ctx,
    fromX,
    fromY,
    toX,
    toY
  ) => {
    const angle =
      Math.atan2(
        toY - fromY,
        toX - fromX
      );

    const headLength = 18;

    ctx.beginPath();

    ctx.moveTo(
      toX,
      toY
    );

    ctx.lineTo(
      toX -
        headLength *
          Math.cos(
            angle -
              Math.PI / 6
          ),
      toY -
        headLength *
          Math.sin(
            angle -
              Math.PI / 6
          )
    );

    ctx.moveTo(
      toX,
      toY
    );

    ctx.lineTo(
      toX -
        headLength *
          Math.cos(
            angle +
              Math.PI / 6
          ),
      toY -
        headLength *
          Math.sin(
            angle +
              Math.PI / 6
          )
    );

    ctx.stroke();
  };

  const drawShape = (
    event
  ) => {
    const canvas =
      canvasRef.current;

    const start =
      startPointRef.current;

    if (
      !canvas ||
      !start
    ) {
      return;
    }

    restoreBaseCanvas();

    const ctx =
      canvas.getContext("2d");

    const end =
      getPosition(event);

    const width =
      end.x - start.x;

    const height =
      end.y - start.y;

    ctx.globalCompositeOperation =
      "source-over";

    ctx.strokeStyle =
      colorRef.current;

    ctx.lineWidth =
      sizeRef.current;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";

    if (
      activeToolRef.current ===
      "rectangle"
    ) {
      ctx.strokeRect(
        start.x,
        start.y,
        width,
        height
      );
    } else if (
      activeToolRef.current ===
      "circle"
    ) {
      const centerX =
        start.x +
        width / 2;

      const centerY =
        start.y +
        height / 2;

      const radiusX =
        Math.abs(width) / 2;

      const radiusY =
        Math.abs(height) / 2;

      ctx.beginPath();

      ctx.ellipse(
        centerX,
        centerY,
        radiusX,
        radiusY,
        0,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    } else if (
      activeToolRef.current ===
      "line"
    ) {
      ctx.beginPath();

      ctx.moveTo(
        start.x,
        start.y
      );

      ctx.lineTo(
        end.x,
        end.y
      );

      ctx.stroke();
    } else if (
      activeToolRef.current ===
      "arrow"
    ) {
      ctx.beginPath();

      ctx.moveTo(
        start.x,
        start.y
      );

      ctx.lineTo(
        end.x,
        end.y
      );

      ctx.stroke();

      drawArrowHead(
        ctx,
        start.x,
        start.y,
        end.x,
        end.y
      );
    }
  };

  /* =======================================================
     POINTER DOWN
  ======================================================= */

  const startDrawing = (
    event
  ) => {
    const tool =
      activeToolRef.current;

    if (
      tool === "select"
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const pos =
      getPosition(event);

    if (
      tool === "text"
    ) {
      const text =
        window.prompt(
          "Enter text:"
        );

      if (
        text &&
        text.trim()
      ) {
        const ctx =
          canvas.getContext(
            "2d"
          );

        ctx.globalCompositeOperation =
          "source-over";

        ctx.fillStyle =
          colorRef.current;

        ctx.font =
          `${Math.max(
            sizeRef.current * 5,
            18
          )}px Arial`;

        ctx.fillText(
          text,
          pos.x,
          pos.y
        );

        pushHistory();
      }

      return;
    }

    canvas.setPointerCapture(
      event.pointerId
    );

    drawingRef.current =
      true;

    startPointRef.current =
      pos;

    if (
      tool === "rectangle" ||
      tool === "circle" ||
      tool === "line" ||
      tool === "arrow"
    ) {
      createBaseCanvas();
      return;
    }

    const ctx =
      canvas.getContext("2d");

    ctx.beginPath();

    ctx.moveTo(
      pos.x,
      pos.y
    );

    ctx.lineWidth =
      sizeRef.current;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";

    if (
      tool === "eraser"
    ) {
      ctx.globalCompositeOperation =
        "destination-out";

      ctx.strokeStyle =
        "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation =
        "source-over";

      ctx.strokeStyle =
        colorRef.current;
    }
  };

  /* =======================================================
     POINTER MOVE
  ======================================================= */

  const draw = (
    event
  ) => {
    if (
      !drawingRef.current
    ) {
      return;
    }

    const tool =
      activeToolRef.current;

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    if (
      tool === "rectangle" ||
      tool === "circle" ||
      tool === "line" ||
      tool === "arrow"
    ) {
      drawShape(event);
      return;
    }

    if (
      tool === "pen" ||
      tool === "eraser"
    ) {
      const ctx =
        canvas.getContext(
          "2d"
        );

      const pos =
        getPosition(event);

      ctx.lineTo(
        pos.x,
        pos.y
      );

      ctx.stroke();
    }
  };

  /* =======================================================
     POINTER UP
  ======================================================= */

  const stopDrawing = (
    event
  ) => {
    if (
      !drawingRef.current
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    const tool =
      activeToolRef.current;

    if (
      tool === "rectangle" ||
      tool === "circle" ||
      tool === "line" ||
      tool === "arrow"
    ) {
      if (event) {
        drawShape(event);
      }
    }

    if (canvas) {
      const ctx =
        canvas.getContext(
          "2d"
        );

      ctx.closePath();

      ctx.globalCompositeOperation =
        "source-over";
    }

    drawingRef.current =
      false;

    startPointRef.current =
      null;

    pushHistory();

    if (
      event &&
      canvas?.hasPointerCapture(
        event.pointerId
      )
    ) {
      canvas.releasePointerCapture(
        event.pointerId
      );
    }
  };

  /* =======================================================
     CLEAR
  ======================================================= */

  const clearBoard = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext(
        "2d"
      );

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    pushHistory();
  };

  /* =======================================================
     SAVE NOTE
  ======================================================= */

  const saveNote = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setSaveMessage("");

      const content =
        editorRef.current
          ? editorRef.current
              .innerHTML
          : "";

      const canvas =
        canvasRef.current;

      const drawingData =
        canvas
          ? canvas.toDataURL(
              "image/png"
            )
          : "";

      const title =
        noteTitle.trim() ||
        "Untitled Note";

      const payload = {
        user_id: userId,
        title,
        content,
        drawing_data:
          drawingData,
      };

      let response;

      if (noteId) {
        response =
          await fetch(
            `${API_BASE}/api/notes/${noteId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                payload
              ),
            }
          );
      } else {
        response =
          await fetch(
            `${API_BASE}/api/notes`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                payload
              ),
            }
          );
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save note"
        );
      }

      const savedId =
        data.id ||
        data.note_id ||
        data.note?.id ||
        noteId;

      const savedNote = {
        id: savedId,
        user_id: userId,
        title,
        content,
        drawing_data:
          drawingData,
        category:
          "Uncategorized",
        note_type:
          "written",
        updated:
          "just now",
      };

      setNoteId(savedId);

      setNoteTitle(title);

      setSaveMessage(
        "Saved successfully"
      );

      onSaved(savedNote);

      setTimeout(() => {
        setSaveMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Save note error:",
        error
      );

      setSaveMessage(
        error.message ||
          "Could not save note"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE CONFIRMATION
  ======================================================= */

  const handleDelete = () => {
    if (!noteId) {
      onBack();
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this note permanently?"
      );

    if (confirmed) {
      onDelete(noteId);
    }
  };

  return (
    <div className="px-4 md:px-7 py-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-[#003049]/10 bg-white/60 flex items-center justify-center hover:bg-white"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <input
              ref={titleRef}
              value={noteTitle}
              onChange={(e) =>
                setNoteTitle(
                  e.target.value
                )
              }
              className="bg-transparent outline-none font-mogilte text-3xl w-[230px] md:w-[330px]"
            />

            <p className="small-serif text-xs text-[#003049]/45">
              {saveMessage ||
                "Last edited just now"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-full border border-[#003049]/10 bg-white/60">
            <span className="small-serif text-sm">
              Uncategorized
            </span>
          </button>

          {noteId && (
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-full border border-[#003049]/10 bg-white/60 flex items-center justify-center hover:bg-white"
              title="Delete note"
            >
              <Trash2 size={17} />
            </button>
          )}

          <button
            onClick={saveNote}
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-[#003049] text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5">
        <div className="rounded-[26px] border border-[#003049]/10 bg-white/75 overflow-hidden min-h-[680px]">
          <div className="border-b border-[#003049]/10 px-4 py-3 flex items-center gap-1.5 flex-wrap">
            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                formatText("bold")
              }
              title="Bold"
            >
              <Bold size={18} />
            </button>

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                formatText("italic")
              }
              title="Italic"
            >
              <Italic size={18} />
            </button>

            <div className="h-7 w-px bg-[#003049]/10 mx-1" />

            <button
              className="toolButton font-semibold"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                applyHeading("h1")
              }
              title="Heading 1"
            >
              H1
            </button>

            <button
              className="toolButton font-semibold"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                applyHeading("h2")
              }
              title="Heading 2"
            >
              H2
            </button>

            <button
              className="toolButton font-semibold"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                applyHeading("h3")
              }
              title="Heading 3"
            >
              H3
            </button>

            <div className="h-7 w-px bg-[#003049]/10 mx-1" />

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={
                applyBulletList
              }
              title="Bullet list"
            >
              <List size={18} />
            </button>

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={
                applyChecklist
              }
              title="Checklist"
            >
              <CheckSquare size={18} />
            </button>

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={applyQuote}
              title="Quote"
            >
              <Quote size={18} />
            </button>

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={applyCode}
              title="Code"
            >
              <Code2 size={18} />
            </button>

            <button
              className="toolButton"
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={
                applyHighlight
              }
              title="Highlight"
            >
              <Highlighter size={18} />
            </button>
          </div>

          <div className="p-7 md:p-9">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start writing your notes..."
              className="notes-rich-editor w-full min-h-[540px] bg-transparent outline-none font-mogilte text-3xl leading-relaxed text-[#003049]"
              style={{
                whiteSpace: "pre-wrap",
              }}
              onInput={() => {
                updateEditorContent();
              }}
            />
          </div>
        </div>

        <div className="rounded-[26px] border border-[#003049]/10 bg-[#003049] overflow-hidden min-h-[680px] relative">
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white">
              <span className="small-serif text-xs">
                Drawing board
              </span>
            </div>

            <button
              onClick={clearBoard}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              title="Clear board"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={900}
            height={650}
            onPointerDown={
              startDrawing
            }
            onPointerMove={draw}
            onPointerUp={
              stopDrawing
            }
            onPointerCancel={
              stopDrawing
            }
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          />

          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-2xl bg-[#FDF0D5] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-1">
              {tools.map((tool) => {
                const Icon =
                  tool.icon;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(
                        tool.id
                      );

                      activeToolRef.current =
                        tool.id;
                    }}
                    title={tool.label}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                      activeTool ===
                      tool.id
                        ? "bg-[#FFB703] text-[#003049]"
                        : "text-[#003049]/60 hover:bg-[#003049]/8"
                    }`}
                  >
                    <Icon size={19} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2">
            <button
              onClick={undo}
              className="w-11 h-11 rounded-xl bg-[#FDF0D5] flex items-center justify-center"
              title="Undo"
            >
              <Undo2 size={18} />
            </button>

            <button
              onClick={redo}
              className="w-11 h-11 rounded-xl bg-[#FDF0D5] flex items-center justify-center"
              title="Redo"
            >
              <Redo2 size={18} />
            </button>

            <label className="w-11 h-11 rounded-xl bg-[#FDF0D5] flex items-center justify-center cursor-pointer">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(
                    e.target.value
                  );

                  colorRef.current =
                    e.target.value;
                }}
                className="absolute opacity-0 pointer-events-none"
              />

              <div
                className="w-5 h-5 rounded-full border-2 border-[#003049]"
                style={{
                  backgroundColor:
                    color,
                }}
              />
            </label>

            <button
              onClick={() => {
                setFontSize(
                  (prev) => {
                    const next =
                      Math.min(
                        prev + 1,
                        12
                      );

                    sizeRef.current =
                      next;

                    return next;
                  }
                );
              }}
              className="w-11 h-11 rounded-xl bg-[#FDF0D5] flex items-center justify-center"
              title="Increase size"
            >
              +
            </button>

            <button
              onClick={() => {
                setFontSize(
                  (prev) => {
                    const next =
                      Math.max(
                        prev - 1,
                        1
                      );

                    sizeRef.current =
                      next;

                    return next;
                  }
                );
              }}
              className="w-11 h-11 rounded-xl bg-[#FDF0D5] flex items-center justify-center"
              title="Decrease size"
            >
              −
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .toolButton {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #003049;
          transition: all 0.15s ease;
        }

        .toolButton:hover {
          background: rgba(0,48,73,0.08);
        }

        .toolButton:active {
          background: rgba(255,183,3,0.35);
          transform: scale(0.96);
        }

        .notes-rich-editor:empty:before {
          content: attr(data-placeholder);
          color: rgba(0,48,73,0.25);
          pointer-events: none;
        }

        .notes-rich-editor h1 {
          font-size: 2.5em;
          line-height: 1.15;
          font-weight: 700;
          margin: 0.4em 0;
        }

        .notes-rich-editor h2 {
          font-size: 2em;
          line-height: 1.2;
          font-weight: 700;
          margin: 0.35em 0;
        }

        .notes-rich-editor h3 {
          font-size: 1.5em;
          line-height: 1.25;
          font-weight: 700;
          margin: 0.3em 0;
        }

        .notes-rich-editor ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }

        .notes-rich-editor ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }

        .notes-rich-editor blockquote {
          border-left: 4px solid #FFB703;
          padding-left: 18px;
          margin: 12px 0;
          opacity: 0.75;
          font-style: italic;
        }

        .notes-rich-editor pre {
          background: #003049;
          color: #FDF0D5;
          padding: 16px;
          border-radius: 14px;
          font-family: monospace;
          font-size: 0.55em;
          white-space: pre-wrap;
        }

        .notes-rich-editor code {
          background: rgba(0,48,73,0.08);
          padding: 3px 7px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.65em;
        }

        .notes-rich-editor span[style*="background-color"] {
          padding: 0 3px;
          border-radius: 3px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}