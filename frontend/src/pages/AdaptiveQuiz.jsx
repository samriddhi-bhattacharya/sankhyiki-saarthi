import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Target,
  FileText,
  BarChart3,
  Library,
  User,
  Bell,
  Search,
  Sparkles,
  Brain,
  BookOpenCheck,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock3,
  Trophy,
  SlidersHorizontal,
  Upload,
  FileQuestion,
  RotateCcw,
  ArrowLeft,
  Loader2,
  XCircle,
} from "lucide-react";

import logo from "../assets/logo.png";

const API_BASE = "http://127.0.0.1:5000";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
  { name: "Boonscrolling", icon: BookOpen, page: "boonscrolling" },
  { name: "My Learning", icon: GraduationCap, page: "MyLearning" },
  { name: "Adaptive Quiz", icon: Target, page: "AdaptiveQuiz" },
  { name: "Notes Desk", icon: FileText, page: "NotesDesk" },
  { name: "Summarize", icon: BookOpenCheck, page: "Summarize" },
  { name: "Competencies", icon: BarChart3, page: "Competencies" },
  { name: "Study Materials", icon: Library, page: "StudyMaterials" },
];

const subjects = [
  {
    name: "Official Statistics",
    description: "Concepts, systems and statistical governance",
    questions: 20,
  },
  {
    name: "Statistical Methods",
    description: "Core statistical methods and techniques",
    questions: 20,
  },
  {
    name: "Data Interpretation",
    description: "Interpret charts, tables and statistical data",
    questions: 15,
  },
  {
    name: "Probability & Sampling",
    description: "Probability concepts and sampling methods",
    questions: 20,
  },
  {
    name: "Data Quality & Metadata",
    description: "Quality dimensions, metadata and standards",
    questions: 15,
  },
];

export default function AdaptiveQuiz({ onNavigate }) {
  const [mode, setMode] = useState("generate");

  // sourceMode:
  // notes = RAG/Notes Desk
  // subject = subject only
  const [sourceMode, setSourceMode] = useState("subject");

  const [selectedNotes, setSelectedNotes] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  const [difficulty, setDifficulty] = useState("Adaptive");
  const [questionCount, setQuestionCount] = useState("10");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quiz, setQuiz] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Stores backend result after submission.
  // This does not alter the UI.
  const [submissionResult, setSubmissionResult] = useState(null);

  const navigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  /*
   * ---------------------------------------------------------
   * USER ID
   * ---------------------------------------------------------
   */

  const getUserId = () => {
    const storedId = localStorage.getItem("sankhyiki_user_id");

    if (!storedId) {
      return null;
    }

    const parsed = Number(storedId);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  };

  /*
   * ---------------------------------------------------------
   * NOTES DESK
   * ---------------------------------------------------------
   *
   * The existing UI has a single "Select notes" button.
   * We keep that UI exactly the same.
   *
   * When clicked, the app fetches the user's actual Notes Desk
   * entries and selects the most recent note.
   *
   * The selected note title is then sent to Flask.
   * Flask performs the actual retrieval + RAG.
   */

  const handleSelectNotes = async () => {
    setError("");
    setLoading(true);

    try {
      const userId = getUserId();

      if (!userId) {
        throw new Error(
          "User session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/notes/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load Notes Desk."
        );
      }

      const notes = Array.isArray(data)
        ? data
        : Array.isArray(data.notes)
        ? data.notes
        : [];

      if (notes.length === 0) {
        throw new Error(
          "No notes found in Notes Desk. Please create a note first."
        );
      }

      // Latest note first because backend already sorts by id DESC.
      const firstNote = notes[0];

      setSelectedNotes(
        firstNote.title ||
          firstNote.name ||
          "Notes Desk Material"
      );

      // If the note has a subject, use it.
      if (firstNote.subject) {
        setSelectedSubject(firstNote.subject);
      }
    } catch (err) {
      console.error("Notes Desk error:", err);

      setError(
        err.message ||
          "Unable to load notes from Notes Desk."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectCard = (subjectName) => {
    setSelectedSubject(subjectName);
    setCustomSubject("");
    setSourceMode("subject");
    setError("");
  };

  const getFinalSubject = () => {
    if (customSubject.trim()) {
      return customSubject.trim();
    }

    return selectedSubject;
  };

  /*
   * ---------------------------------------------------------
   * GENERATE QUIZ
   * ---------------------------------------------------------
   */

  const handleGenerateQuiz = async () => {
    setError("");

    const finalSubject = getFinalSubject();
    const userId = getUserId();

    if (!userId) {
      setError(
        "User session not found. Please login again."
      );
      return;
    }

    if (sourceMode === "subject" && !finalSubject) {
      setError("Please enter or select a subject first.");
      return;
    }

    if (sourceMode === "notes" && !selectedNotes) {
      setError(
        "Please select learning material from Notes Desk."
      );
      return;
    }

    setLoading(true);

    try {
     const payload = {
  user_id: Number(localStorage.getItem("sankhyiki_user_id")) || 1,

  source:
    sourceMode === "notes"
      ? "notes"
      : "subject",

  subject: finalSubject,

  notes:
    sourceMode === "notes"
      ? selectedNotes
      : "",

  difficulty,
  question_count: Number(questionCount),
};

      /*
       * Both /api/generate-quiz and /api/quiz/generate are
       * supported by the Flask backend.
       */
     const response = await fetch(`${API_BASE}/api/quiz/generate`,
         
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate quiz."
        );
      }

      if (
        !data.questions ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error(
          "Gemini returned an invalid quiz format."
        );
      }

      /*
       * Normalize questions so the existing UI always gets:
       *
       * question.question
       * question.options
       * question.answer -> numeric option index
       * question.explanation
       */

      const normalizedQuestions = data.questions
        .map((question) => {
          if (!question) {
            return null;
          }

          const options = Array.isArray(
            question.options
          )
            ? question.options
            : [];

          let answer = question.answer;

          /*
           * Gemini may sometimes return the answer as a number,
           * string number, or actual answer text.
           */

          if (
            typeof answer === "string" &&
            /^\d+$/.test(answer.trim())
          ) {
            answer = Number(answer);
          }

          if (
            typeof answer === "string" &&
            options.length > 0
          ) {
            const answerIndex =
              options.findIndex(
                (option) =>
                  String(option)
                    .trim()
                    .toLowerCase() ===
                  answer
                    .trim()
                    .toLowerCase()
              );

            if (answerIndex !== -1) {
              answer = answerIndex;
            }
          }

          if (
            typeof answer !== "number" ||
            answer < 0 ||
            answer >= options.length
          ) {
            answer = 0;
          }

          return {
            question:
              question.question ||
              "Question unavailable.",

            options,

            answer,

            explanation:
              question.explanation || "",
          };
        })
        .filter(Boolean);

      if (normalizedQuestions.length === 0) {
        throw new Error(
          "No valid questions were generated."
        );
      }

      setQuiz({
        title:
          data.title ||
          `${finalSubject || "Learning"} Quiz`,

        subject:
          data.subject ||
          finalSubject ||
          "Knowledge Assessment",

        questions: normalizedQuestions,

        /*
         * Store actual difficulty returned by backend.
         * This is useful for adaptive mode.
         */
        difficulty:
          data.difficulty ||
          difficulty,

        rag_used:
          Boolean(data.rag_used),

        notes_used:
          data.notes_used || [],
      });

      /*
       * If Adaptive was selected, the backend decides the
       * actual difficulty. Keep the selected UI control
       * untouched for this quiz screen.
       */
      if (data.difficulty) {
        // Only internal quiz data is updated.
      }

      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setSubmissionResult(null);
      setQuizStarted(true);
    } catch (err) {
      console.error("Quiz generation error:", err);

      setError(
        err.message ||
          "Something went wrong while generating the quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * ANSWER SELECTION
   * ---------------------------------------------------------
   */

  const handleAnswer = (
    questionIndex,
    optionIndex
  ) => {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT QUIZ
   * ---------------------------------------------------------
   *
   * Score is calculated immediately on frontend so the result
   * screen appears without waiting.
   *
   * Then the exact attempt is sent to Flask.
   *
   * Flask:
   * - saves quiz_attempts
   * - calculates percentage
   * - updates competency
   * - determines next difficulty
   */

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    setError("");

    let calculatedScore = 0;

    quiz.questions.forEach(
      (question, index) => {
        if (
          answers[index] !== undefined &&
          Number(answers[index]) ===
            Number(question.answer)
        ) {
          calculatedScore++;
        }
      }
    );

    setScore(calculatedScore);
    setSubmitted(true);

    /*
     * Save result to backend.
     */
    try {
      const userId = getUserId();

      if (!userId) {
        throw new Error(
          "User session not found. Quiz result could not be saved."
        );
      }

      const total =
        quiz.questions.length;

      const percentage =
        total > 0
          ? Math.round(
              (calculatedScore / total) *
                100
            )
          : 0;

      const response = await fetch(
        `${API_BASE}/api/quiz/attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,

            subject:
              quiz.subject ||
              getFinalSubject() ||
              "General",

            difficulty:
              quiz.difficulty ||
              difficulty,

            correct: calculatedScore,

            score: calculatedScore,

            total,
            percentage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Quiz result could not be saved."
        );
      }

      setSubmissionResult(data);
    } catch (err) {
      /*
       * Important:
       * The quiz result still remains visible even if the
       * database request fails.
       *
       * We show the error using the existing error state.
       */
      console.error(
        "Quiz submission error:",
        err
      );

      setError(
        err.message ||
          "Quiz completed, but the result could not be saved."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * RESET
   * ---------------------------------------------------------
   */

  const resetQuiz = () => {
    setQuiz(null);
    setQuizStarted(false);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setError("");
    setSubmissionResult(null);
  };

  /*
   * ---------------------------------------------------------
   * QUIZ SCREEN
   * ---------------------------------------------------------
   */

  if (quizStarted && quiz) {
    return (
      <div className="min-h-screen bg-[#FDF0D0] text-[#003049]">
        <div className="flex min-h-screen">

          {/* SIDEBAR */}
          <aside className="hidden lg:flex w-[255px] flex-col border-r border-[#003049]/10 bg-[#003049] text-[#FDF0D5]">

            <div className="px-6 pt-7 pb-6">
              <button
                onClick={() =>
                  navigate("dashboard")
                }
                className="flex items-center"
              >
                <img
                  src={logo}
                  alt="Sankhyiki Saarthi"
                  className="w-[175px] h-auto object-contain"
                />
              </button>
            </div>

            <nav className="flex-1 px-4">

              <p className="px-3 mb-3 text-[11px] tracking-[0.18em] uppercase opacity-55 small-serif">
                Workspace
              </p>

              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  const active =
                    item.page ===
                    "AdaptiveQuiz";

                  return (
                    <button
                      key={item.name}
                      onClick={() =>
                        navigate(item.page)
                      }
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                        active
                          ? "bg-[#FFB703] text-[#003049]"
                          : "hover:bg-white/10 text-[#FDF0D5]/85"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                      />

                      <span className="text-[14px] small-serif">
                        {item.name}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="ml-auto"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="px-4 pb-5">

              {/* PROFILE */}
              <button
                onClick={() =>
                  navigate("Profile")
                }
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#FDF0D5]/85 hover:bg-white/10 transition"
              >
                <User
                  size={18}
                  strokeWidth={1.8}
                />

                <span className="text-[14px] small-serif">
                  Profile
                </span>
              </button>

              <div className="mt-3 rounded-2xl bg-[#FDF0D5]/10 border border-white/10 p-4">

                <div className="flex items-center gap-2 mb-2">
                  <Sparkles
                    size={16}
                    className="text-[#FFB703]"
                  />

                  <span className="text-[13px] small-serif">
                    AI Learning
                  </span>
                </div>

                <p className="text-[11px] leading-5 opacity-65 clean-sans">
                  Your quiz performance helps
                  Sankhyiki Saarthi understand your
                  competency gaps.
                </p>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="flex-1 min-w-0">

            {/* TOP BAR */}
            <header className="h-[78px] border-b border-[#003049]/10 flex items-center justify-between px-5 md:px-8 bg-[#FDF0D5]">

              <div>
                <p className="text-[12px] opacity-55 small-serif">
                  Assessment
                </p>

                <h1 className="text-[25px] font-mogilte leading-none mt-1">
                  {quiz.title}
                </h1>
              </div>

              <button
                onClick={() =>
                  navigate("Profile")
                }
                className="w-9 h-9 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center"
              >
                <User size={16} />
              </button>
            </header>

            <div className="p-5 md:p-8 max-w-[1050px] mx-auto">

              {!submitted ? (
                <>
                  <div className="flex items-center justify-between mb-6">

                    <button
                      onClick={resetQuiz}
                      className="flex items-center gap-2 text-[12px] small-serif opacity-70 hover:opacity-100"
                    >
                      <ArrowLeft size={15} />
                      Back to quiz generator
                    </button>

                    <div className="rounded-full bg-[#003049] text-[#FDF0D5] px-4 py-2">
                      <span className="text-[11px] small-serif">
                        {quiz.questions.length} Questions
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#003049] text-[#FDF0D5] p-6 md:p-8 mb-6">

                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles
                        size={16}
                        className="text-[#FFB703]"
                      />

                      <span className="text-[11px] small-serif opacity-80">
                        AI Generated Assessment
                      </span>
                    </div>

                    <h2 className="text-[30px] md:text-[38px] font-mogilte">
                      {quiz.subject ||
                        "Knowledge Assessment"}
                    </h2>

                    <div className="flex flex-wrap gap-3 mt-4">

                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] small-serif">
                        Difficulty:{" "}
                        {quiz.difficulty ||
                          difficulty}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] small-serif">
                        {sourceMode === "notes"
                          ? "RAG + Gemini"
                          : "Subject + Gemini"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5">

                    {quiz.questions.map(
                      (
                        question,
                        index
                      ) => {
                        const selected =
                          answers[index];

                        return (
                          <div
                            key={index}
                            className="rounded-[22px] bg-white/55 border border-[#003049]/10 p-6"
                          >

                            <div className="flex gap-4">

                              <div className="w-9 h-9 rounded-full bg-[#FFB703] text-[#003049] flex items-center justify-center shrink-0 text-[12px] font-semibold">
                                {index + 1}
                              </div>

                              <div className="flex-1">

                                <h3 className="text-[16px] md:text-[18px] font-semibold leading-7 small-serif">
                                  {question.question}
                                </h3>

                                <div className="mt-5 space-y-3">

                                  {question.options?.map(
                                    (
                                      option,
                                      optionIndex
                                    ) => {
                                      const isSelected =
                                        Number(
                                          selected
                                        ) ===
                                        optionIndex;

                                      return (
                                        <button
                                          key={
                                            optionIndex
                                          }
                                          onClick={() =>
                                            handleAnswer(
                                              index,
                                              optionIndex
                                            )
                                          }
                                          className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 transition ${
                                            isSelected
                                              ? "bg-[#FFB703] border-[#FFB703]"
                                              : "bg-[#FDF0D5] border-[#003049]/10 hover:border-[#003049]/30"
                                          }`}
                                        >

                                          <div
                                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] shrink-0 ${
                                              isSelected
                                                ? "bg-[#003049] text-[#FDF0D5] border-[#003049]"
                                                : "border-[#003049]/25"
                                            }`}
                                          >
                                            {String.fromCharCode(
                                              65 +
                                                optionIndex
                                            )}
                                          </div>

                                          <span className="text-[12px] md:text-[13px] small-serif">
                                            {option}
                                          </span>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={handleSubmitQuiz}
                    className="mt-7 w-full rounded-xl bg-[#003049] text-[#FDF0D5] py-4 flex items-center justify-center gap-2 hover:bg-[#003049]/90 transition"
                  >
                    <CheckCircle2 size={17} />

                    <span className="text-[13px] font-semibold small-serif">
                      Submit Quiz
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* RESULT */}
                  <div className="rounded-[25px] bg-[#003049] text-[#FDF0D5] p-8 md:p-10 text-center">

                    <div className="w-16 h-16 rounded-full bg-[#FFB703] text-[#003049] mx-auto flex items-center justify-center">
                      <Trophy size={28} />
                    </div>

                    <p className="text-[11px] uppercase tracking-[0.16em] opacity-60 mt-5 small-serif">
                      Assessment Complete
                    </p>

                    <h2 className="text-[40px] md:text-[52px] font-mogilte mt-2">
                      {score}/
                      {quiz.questions.length}
                    </h2>

                    <p className="text-[13px] opacity-75 mt-2 small-serif">
                      {Math.round(
                        (score /
                          quiz.questions.length) *
                          100
                      )}
                      % correct
                    </p>

                    <p className="text-[12px] opacity-65 max-w-xl mx-auto mt-5 leading-6 small-serif">
                      Your performance can be used
                      to identify competency gaps and
                      personalize your next learning
                      recommendations.
                    </p>
                  </div>

                  {/* ANSWER REVIEW */}
                  <div className="mt-6 space-y-4">

                    {quiz.questions.map(
                      (
                        question,
                        index
                      ) => {
                        const correct =
                          Number(
                            answers[index]
                          ) ===
                          Number(
                            question.answer
                          );

                        return (
                          <div
                            key={index}
                            className="rounded-[20px] bg-white/55 border border-[#003049]/10 p-5"
                          >

                            <div className="flex items-start gap-3">

                              {correct ? (
                                <CheckCircle2
                                  size={19}
                                  className="text-[#003049] mt-1 shrink-0"
                                />
                              ) : (
                                <XCircle
                                  size={19}
                                  className="text-[#669BBC] mt-1 shrink-0"
                                />
                              )}

                              <div>
                                <p className="text-[13px] font-semibold small-serif">
                                  {index + 1}.{" "}
                                  {question.question}
                                </p>

                                <p className="text-[11px] mt-2 opacity-65 small-serif">
                                  Correct answer:{" "}
                                  {
                                    question.options?.[
                                      question.answer
                                    ]
                                  }
                                </p>

                                {question.explanation && (
                                  <p className="text-[11px] mt-2 leading-5 opacity-60 small-serif">
                                    {
                                      question.explanation
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="mt-6 w-full rounded-xl bg-[#FFB703] text-[#003049] py-3.5 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />

                    <span className="text-[12px] font-semibold small-serif">
                      Generate Another Quiz
                    </span>
                  </button>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * QUIZ GENERATOR SCREEN
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-[255px] flex-col border-r border-[#003049]/10 bg-[#003049] text-[#FDF0D5]">

          {/* LOGO */}
          <div className="px-6 pt-7 pb-6">

            <button
              onClick={() =>
                navigate("dashboard")
              }
              className="flex items-center"
            >
              <img
                src={logo}
                alt="Sankhyiki Saarthi"
                className="w-[175px] h-auto object-contain"
              />
            </button>

          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4">

            <p className="px-3 mb-3 text-[11px] tracking-[0.18em] uppercase opacity-55 small-serif">
              Workspace
            </p>

            <div className="space-y-1.5">

              {menuItems.map((item) => {
                const Icon = item.icon;

                const active =
                  item.page ===
                  "AdaptiveQuiz";

                return (
                  <button
                    key={item.name}
                    onClick={() =>
                      navigate(item.page)
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      active
                        ? "bg-[#FFB703] text-[#003049]"
                        : "hover:bg-white/10 text-[#FDF0D5]/85"
                    }`}
                  >

                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    <span className="text-[14px] small-serif">
                      {item.name}
                    </span>

                    {active && (
                      <ChevronRight
                        size={15}
                        className="ml-auto"
                      />
                    )}
                  </button>
                );
              })}

            </div>
          </nav>

          {/* BOTTOM */}
          <div className="px-4 pb-5">

            {/* PROFILE */}
            <button
              onClick={() =>
                navigate("Profile")
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#FDF0D5]/85 hover:bg-white/10 transition"
            >

              <User
                size={18}
                strokeWidth={1.8}
              />

              <span className="text-[14px] small-serif">
                Profile
              </span>

            </button>

            {/* AI CARD */}
            <div className="mt-3 rounded-2xl bg-[#FDF0D5]/10 border border-white/10 p-4">

              <div className="flex items-center gap-2 mb-2">

                <Sparkles
                  size={16}
                  className="text-[#FFB703]"
                />

                <span className="text-[13px] small-serif">
                  AI Learning
                </span>

              </div>

              <p className="text-[11px] leading-5 opacity-65 clean-sans">
                Your quiz performance helps
                Sankhyiki Saarthi understand your
                competency gaps.
              </p>

            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0">

          {/* TOP BAR */}
          <header className="h-[78px] border-b border-[#003049]/10 flex items-center justify-between px-5 md:px-8 bg-[#FDF0D5]">

            <div>

              <p className="text-[12px] opacity-55 small-serif">
                Learning workspace
              </p>

              <h1 className="text-[25px] font-mogilte leading-none mt-1">
                Adaptive Quiz
              </h1>

            </div>

            {/* ONLY PFP */}
            <button
              onClick={() =>
                navigate("Profile")
              }
              className="w-9 h-9 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center"
            >
              <User size={16} />
            </button>

          </header>

          <div className="p-5 md:p-8 max-w-[1250px] mx-auto">

            {/* HERO */}
            <section className="rounded-[25px] bg-[#003049] text-[#FDF0D5] p-6 md:p-8 relative overflow-hidden">

              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#FFB703]/15 blur-2xl" />

              <div className="relative max-w-3xl">

                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFB703] text-[#003049] px-3 py-1.5 mb-4">

                  <Target size={14} />

                  <span className="text-[11px] font-semibold small-serif">
                    Adaptive Assessment
                  </span>

                </div>

                <h2 className="text-[34px] md:text-[43px] font-mogilte leading-[0.98]">
                  Test your knowledge.
                  <br />
                  Build your competencies.
                </h2>

                <p className="mt-4 max-w-2xl text-[13px] md:text-[14px] leading-6 opacity-75 clean-sans">
                  Take an AI-generated quiz from
                  your own learning material or
                  generate a fresh assessment simply
                  by entering a subject. Your
                  performance helps personalize your
                  learning journey.
                </p>

              </div>
            </section>

            {/* MODE SWITCH */}
            <section className="mt-7">

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  onClick={() =>
                    setMode("generate")
                  }
                  className={`flex-1 rounded-2xl border p-4 text-left transition ${
                    mode === "generate"
                      ? "bg-[#FFB703] border-[#FFB703]"
                      : "bg-white/45 border-[#003049]/10 hover:bg-white/70"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        mode === "generate"
                          ? "bg-[#003049] text-[#FFB703]"
                          : "bg-[#003049] text-[#FDF0D5]"
                      }`}
                    >
                      <Brain size={19} />
                    </div>

                    <div>

                      <h3 className="font-semibold text-[15px] small-serif">
                        Generate with Gemini
                      </h3>

                      <p className="text-[11px] opacity-65 mt-1 small-serif">
                        Generate from notes or any
                        subject
                      </p>

                    </div>

                  </div>

                </button>

                <button
                  onClick={() =>
                    setMode("mock")
                  }
                  className={`flex-1 rounded-2xl border p-4 text-left transition ${
                    mode === "mock"
                      ? "bg-[#FFB703] border-[#FFB703]"
                      : "bg-white/45 border-[#003049]/10 hover:bg-white/70"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        mode === "mock"
                          ? "bg-[#003049] text-[#FFB703]"
                          : "bg-[#003049] text-[#FDF0D5]"
                      }`}
                    >
                      <BookOpenCheck size={19} />
                    </div>

                    <div>

                      <h3 className="font-semibold text-[15px] small-serif">
                        Mock Quiz
                      </h3>

                      <p className="text-[11px] opacity-65 mt-1 small-serif">
                        Practice subject-wise
                        questions
                      </p>

                    </div>

                  </div>

                </button>

              </div>
            </section>

            {/* GENERATE MODE */}
            {mode === "generate" && (
              <section className="mt-6 grid grid-cols-1 xl:grid-cols-[1.5fr_0.8fr] gap-6">

                {/* GENERATOR */}
                <div className="rounded-[24px] bg-white/55 border border-[#003049]/10 p-6">

                  <div className="flex items-start justify-between gap-4 mb-6">

                    <div>

                      <div className="flex items-center gap-2">

                        <Sparkles
                          size={18}
                          className="text-[#003049]"
                        />

                        <h3 className="text-[21px] font-mogilte">
                          Generate a Quiz
                        </h3>

                      </div>

                      <p className="text-[12px] opacity-60 mt-1 small-serif">
                        Create an AI-powered assessment
                        from your notes or directly from a
                        subject.
                      </p>

                    </div>

                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#003049] text-[#FDF0D5] px-3 py-1.5">

                      <Brain size={13} />

                      <span className="text-[10px] small-serif">
                        Gemini AI
                      </span>

                    </div>

                  </div>

                  {/* SOURCE CHOICE */}
                  <div>

                    <label className="block text-[12px] font-semibold mb-2 small-serif">
                      Quiz Source
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <button
                        onClick={() =>
                          setSourceMode(
                            "subject"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          sourceMode ===
                          "subject"
                            ? "bg-[#FFB703] border-[#FFB703]"
                            : "bg-[#FDF0D5] border-[#003049]/10"
                        }`}
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center">
                            <Brain size={16} />
                          </div>

                          <div>

                            <p className="text-[13px] font-semibold small-serif">
                              By Subject
                            </p>

                            <p className="text-[10px] opacity-60 mt-1 small-serif">
                              No notes required
                            </p>

                          </div>

                        </div>

                      </button>

                      <button
                        onClick={() =>
                          setSourceMode(
                            "notes"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          sourceMode ===
                          "notes"
                            ? "bg-[#FFB703] border-[#FFB703]"
                            : "bg-[#FDF0D5] border-[#003049]/10"
                        }`}
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center">
                            <FileText size={16} />
                          </div>

                          <div>

                            <p className="text-[13px] font-semibold small-serif">
                              From Notes Desk
                            </p>

                            <p className="text-[10px] opacity-60 mt-1 small-serif">
                              RAG + Gemini
                            </p>

                          </div>

                        </div>

                      </button>

                    </div>
                  </div>

                  {/* SUBJECT MODE */}
                  {sourceMode ===
                    "subject" && (
                    <div className="mt-5">

                      <label className="block text-[12px] font-semibold mb-2 small-serif">
                        Subject / Topic
                      </label>

                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) =>
                          setCustomSubject(
                            e.target.value
                          )
                        }
                        placeholder="e.g. Probability, Python, DBMS, Computer Networks..."
                        className="w-full rounded-xl border border-[#003049]/15 bg-[#FDF0D5] px-4 py-3 text-[12px] outline-none small-serif"
                      />

                      <p className="text-[10px] opacity-55 mt-2 small-serif">
                        Enter any subject or topic.
                        Notes are not required.
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">

                        {[
                          "Statistics",
                          "Python",
                          "DBMS",
                          "Computer Networks",
                        ].map((item) => (
                          <button
                            key={item}
                            onClick={() =>
                              setCustomSubject(
                                item
                              )
                            }
                            className="rounded-full border border-[#003049]/15 px-3 py-1.5 text-[10px] small-serif hover:bg-[#FFB703] transition"
                          >
                            {item}
                          </button>
                        ))}

                      </div>

                    </div>
                  )}

                  {/* NOTES MODE */}
                  {sourceMode ===
                    "notes" && (
                    <div className="mt-5">

                      <label className="block text-[12px] font-semibold mb-2 small-serif">
                        Source from Notes Desk
                      </label>

                      <button
                        onClick={
                          handleSelectNotes
                        }
                        disabled={loading}
                        className="w-full border border-dashed border-[#003049]/25 rounded-2xl p-4 text-left hover:bg-[#FDF0D5] transition disabled:opacity-60"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center">
                            {loading ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <FileText
                                size={17}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">

                            {selectedNotes ? (
                              <>
                                <p className="text-[13px] font-semibold small-serif">
                                  {selectedNotes}
                                </p>

                                <p className="text-[10px] opacity-55 mt-1 small-serif">
                                  Selected learning
                                  material
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-[13px] font-semibold small-serif">
                                  Select notes from
                                  Notes Desk
                                </p>

                                <p className="text-[10px] opacity-55 mt-1 small-serif">
                                  Choose a note, PDF
                                  or learning
                                  material
                                </p>
                              </>
                            )}

                          </div>

                          <ChevronRight size={17} />

                        </div>

                      </button>

                    </div>
                  )}

                  {/* CONTROLS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                    {/* SUBJECT */}
                    <div>

                      <label className="block text-[12px] font-semibold mb-2 small-serif">
                        Subject / Topic
                      </label>

                      <select
                        value={
                          selectedSubject
                        }
                        onChange={(e) =>
                          setSelectedSubject(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[#003049]/15 bg-[#FDF0D5] px-3 py-3 text-[12px] outline-none small-serif"
                      >

                        <option value="">
                          Select subject
                        </option>

                        {subjects.map(
                          (subject) => (
                            <option
                              key={
                                subject.name
                              }
                              value={
                                subject.name
                              }
                            >
                              {subject.name}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* DIFFICULTY */}
                    <div>

                      <label className="block text-[12px] font-semibold mb-2 small-serif">
                        Difficulty
                      </label>

                      <select
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[#003049]/15 bg-[#FDF0D5] px-3 py-3 text-[12px] outline-none small-serif"
                      >

                        <option>
                          Adaptive
                        </option>
                        <option>
                          Easy
                        </option>
                        <option>
                          Medium
                        </option>
                        <option>
                          Hard
                        </option>

                      </select>

                    </div>

                    {/* QUESTIONS */}
                    <div>

                      <label className="block text-[12px] font-semibold mb-2 small-serif">
                        Questions
                      </label>

                      <select
                        value={
                          questionCount
                        }
                        onChange={(e) =>
                          setQuestionCount(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[#003049]/15 bg-[#FDF0D5] px-3 py-3 text-[12px] outline-none small-serif"
                      >

                        <option value="5">
                          5 questions
                        </option>

                        <option value="10">
                          10 questions
                        </option>

                        <option value="15">
                          15 questions
                        </option>

                        <option value="20">
                          20 questions
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="mt-5 rounded-xl bg-[#003049]/5 border border-[#003049]/15 px-4 py-3 flex items-start gap-2">

                      <XCircle
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      <p className="text-[11px] small-serif">
                        {error}
                      </p>

                    </div>
                  )}

                  {/* GENERATE */}
                  <button
                    onClick={
                      handleGenerateQuiz
                    }
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-[#003049] text-[#FDF0D5] py-3.5 flex items-center justify-center gap-2 hover:bg-[#003049]/90 transition disabled:opacity-60"
                  >

                    {loading ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        <span className="text-[13px] font-semibold small-serif">
                          Gemini is generating
                          your quiz...
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={17} />

                        <span className="text-[13px] font-semibold small-serif">
                          Generate Adaptive
                          Quiz
                        </span>

                        <ChevronRight
                          size={16}
                        />
                      </>
                    )}

                  </button>

                </div>

                {/* HOW IT WORKS */}
                <div className="rounded-[24px] bg-[#669BBC]/15 border border-[#669BBC]/25 p-6">

                  <div className="flex items-center gap-2 mb-5">

                    <SlidersHorizontal
                      size={18}
                    />

                    <h3 className="text-[20px] font-mogilte">
                      How it adapts
                    </h3>

                  </div>

                  <div className="space-y-4">

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center text-[11px] font-semibold shrink-0">
                        1
                      </div>

                      <div>

                        <p className="text-[13px] font-semibold small-serif">
                          Start with an assessment
                        </p>

                        <p className="text-[11px] opacity-65 mt-1 leading-5 small-serif">
                          The quiz evaluates your
                          current understanding.
                        </p>

                      </div>
                    </div>

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center text-[11px] font-semibold shrink-0">
                        2
                      </div>

                      <div>

                        <p className="text-[13px] font-semibold small-serif">
                          Difficulty adjusts
                        </p>

                        <p className="text-[11px] opacity-65 mt-1 leading-5 small-serif">
                          Strong performance leads
                          to harder questions.
                          Struggling areas lead to
                          easier questions.
                        </p>

                      </div>
                    </div>

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center text-[11px] font-semibold shrink-0">
                        3
                      </div>

                      <div>

                        <p className="text-[13px] font-semibold small-serif">
                          Competencies update
                        </p>

                        <p className="text-[11px] opacity-65 mt-1 leading-5 small-serif">
                          Results contribute to your
                          competency profile and
                          skill-gap analysis.
                        </p>

                      </div>
                    </div>

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#FFB703] text-[#003049] flex items-center justify-center shrink-0">
                        <Sparkles size={14} />
                      </div>

                      <div>

                        <p className="text-[13px] font-semibold small-serif">
                          Learning gets personalized
                        </p>

                        <p className="text-[11px] opacity-65 mt-1 leading-5 small-serif">
                          Your updated competency
                          gaps can inform
                          personalized learning
                          recommendations.
                        </p>

                      </div>
                    </div>

                  </div>
                </div>
              </section>
            )}

            {/* MOCK MODE */}
            {mode === "mock" && (
              <section className="mt-6">

                <div className="mb-5">

                  <h3 className="text-[24px] font-mogilte">
                    Choose a subject
                  </h3>

                  <p className="text-[12px] opacity-60 mt-1 small-serif">
                    Practice with a
                    subject-wise AI-generated
                    assessment.
                  </p>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                  {subjects.map(
                    (subject) => {

                      const selected =
                        selectedSubject ===
                        subject.name;

                      return (
                        <button
                          key={
                            subject.name
                          }
                          onClick={() =>
                            handleSubjectCard(
                              subject.name
                            )
                          }
                          className={`text-left rounded-[22px] border p-5 transition ${
                            selected
                              ? "bg-[#FFB703] border-[#FFB703]"
                              : "bg-white/55 border-[#003049]/10 hover:bg-white/80"
                          }`}
                        >

                          <div className="flex items-start justify-between">

                            <div className="w-11 h-11 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center">
                              <BookOpenCheck
                                size={19}
                              />
                            </div>

                            {selected && (
                              <CheckCircle2
                                size={20}
                                className="text-[#003049]"
                              />
                            )}

                          </div>

                          <h4 className="text-[18px] font-mogilte mt-5">
                            {subject.name}
                          </h4>

                          <p className="text-[11px] opacity-65 leading-5 mt-2 small-serif">
                            {
                              subject.description
                            }
                          </p>

                          <div className="flex items-center gap-4 mt-5">

                            <span className="flex items-center gap-1.5 text-[10px] small-serif">
                              <Target
                                size={13}
                              />
                              {
                                subject.questions
                              }{" "}
                              questions
                            </span>

                            <span className="flex items-center gap-1.5 text-[10px] small-serif">
                              <Clock3
                                size={13}
                              />
                              ~15 min
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* SELECTED SUBJECT */}
                {selectedSubject && (
                  <div className="mt-6 rounded-[22px] bg-[#003049] text-[#FDF0D5] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.16em] opacity-55 small-serif">
                        Selected subject
                      </p>

                      <h3 className="text-[25px] font-mogilte mt-1">
                        {selectedSubject}
                      </h3>

                      <p className="text-[11px] opacity-65 mt-1 small-serif">
                        Gemini will generate a
                        fresh quiz without
                        requiring notes.
                      </p>

                    </div>

                    <button
                      onClick={() => {
                        setSourceMode(
                          "subject"
                        );
                        handleGenerateQuiz();
                      }}
                      disabled={loading}
                      className="shrink-0 rounded-xl bg-[#FFB703] text-[#003049] px-5 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                    >

                      {loading ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Play
                          size={16}
                          fill="currentColor"
                        />
                      )}

                      <span className="text-[12px] font-semibold small-serif">
                        {loading
                          ? "Generating..."
                          : "Generate Mock Quiz"}
                      </span>

                    </button>

                  </div>
                )}
              </section>
            )}

            {/* BOTTOM INFO */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">

              <div className="rounded-2xl bg-white/50 border border-[#003049]/10 p-5">

                <div className="w-9 h-9 rounded-xl bg-[#FFB703] flex items-center justify-center">
                  <Trophy size={17} />
                </div>

                <h4 className="text-[17px] font-mogilte mt-4">
                  Track performance
                </h4>

                <p className="text-[11px] opacity-60 leading-5 mt-1 small-serif">
                  View quiz scores and improvement
                  across competencies.
                </p>

              </div>

              <div className="rounded-2xl bg-white/50 border border-[#003049]/10 p-5">

                <div className="w-9 h-9 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center">
                  <Brain size={17} />
                </div>

                <h4 className="text-[17px] font-mogilte mt-4">
                  AI-powered
                </h4>

                <p className="text-[11px] opacity-60 leading-5 mt-1 small-serif">
                  Gemini can generate questions
                  from your notes or directly from
                  any subject.
                </p>

              </div>

              <div className="rounded-2xl bg-white/50 border border-[#003049]/10 p-5">

                <div className="w-9 h-9 rounded-xl bg-[#669BBC] flex items-center justify-center">
                  <CheckCircle2 size={17} />
                </div>

                <h4 className="text-[17px] font-mogilte mt-4">
                  Learn from mistakes
                </h4>

                <p className="text-[11px] opacity-60 leading-5 mt-1 small-serif">
                  Incorrect answers help identify
                  the areas where more learning is
                  needed.
                </p>

              </div>

            </section>

          </div>
        </main>
      </div>
    </div>
  );
}