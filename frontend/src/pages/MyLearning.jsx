import { useEffect, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Play,
  Target,
  TrendingUp,
  User,
  BarChart3,
  FileText,
  BookOpenCheck,
  Library,
} from "lucide-react";

import logo from "../assets/logo.png";

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
        active
          ? "bg-[#FFB703] text-[#003049] shadow-sm"
          : "text-[#FDF0D5]/75 hover:bg-[#669BBC]/15 hover:text-[#FDF0D5]"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span className="small-serif text-[14px]">{label}</span>
    </button>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#003049]/8">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#FFB703] to-[#ffc94d]"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default function MyLearning({ onNavigate }) {
  const [courses, setCourses] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [learningHours, setLearningHours] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // -----------------------------------------------------------
  // CONTINUE COURSE
  // -----------------------------------------------------------

  const continueCourse = (course) => {
    if (course.courseUrl) {
      window.open(course.courseUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate("StudyMaterials");
  };

  useEffect(() => {
    const fetchLearningData = async () => {
      const userId = localStorage.getItem("sankhyiki_user_id");

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // -------------------------------------------------------
        // 1. LEARNING PROGRESS
        // -------------------------------------------------------

        const progressResponse = await fetch(
  `http://127.0.0.1:5000/api/learning-progress/${userId}`
          );

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();

          console.log("My Learning progress:", progressData);

          let progressRows = [];

          if (Array.isArray(progressData)) {
            progressRows = progressData;
          } else if (Array.isArray(progressData.progress)) {
            progressRows = progressData.progress;
          } else if (Array.isArray(progressData.data)) {
            progressRows = progressData.data;
          } else if (Array.isArray(progressData.courses)) {
            progressRows = progressData.courses;
          }

          const normalizedCourses = progressRows.map((item, index) => {
            const progress = Number(
              item.progress ??
                item.progress_percentage ??
                item.completion ??
                0
            );

            return {
              id: item.id ?? index,

              title:
                item.course_name ??
                item.title ??
                item.course_title ??
                "Learning Course",

              provider: item.provider ?? "iGOT Karmayogi",

              progress: Math.min(Math.max(progress, 0), 100),

              lessons:
                item.lessons ??
                item.lesson_text ??
                `${Math.round(progress)}% completed`,

              tag:
                item.tag ??
                (progress >= 100
                  ? "Completed"
                  : progress < 50
                  ? "Skill Gap"
                  : "In Progress"),

              // -------------------------------------------------
              // COURSE URL
              // Supports multiple possible backend field names
              // -------------------------------------------------

              courseUrl:
                item.course_url ??
                item.courseUrl ??
                item.course_link ??
                item.courseLink ??
                item.url ??
                item.link ??
                item.learning_url ??
                item.learning_link ??
                "",
            };
          });

          console.log("Normalized courses:", normalizedCourses);

          // -------------------------------------------------------
          // CONTINUE LEARNING
          // -------------------------------------------------------

          const activeCourses = normalizedCourses.filter(
            (course) => course.progress < 100
          );

          setCourses(activeCourses);

          // -------------------------------------------------------
          // COMPLETED COURSES
          // -------------------------------------------------------

          const completedCourses = normalizedCourses
            .filter((course) => course.progress >= 100)
            .map((course) => ({
              title: course.title,
              provider: course.provider,
              score: "Completed",
            }));

          setCompleted(completedCourses);

          // -------------------------------------------------------
          // OVERALL PROGRESS
          // -------------------------------------------------------

          if (normalizedCourses.length > 0) {
            const total = normalizedCourses.reduce(
              (sum, course) => sum + course.progress,
              0
            );

            const average = Math.round(
              total / normalizedCourses.length
            );

            setOverallProgress(average);
          } else {
            setOverallProgress(0);
          }
        }

        // -------------------------------------------------------
        // 2. DASHBOARD DATA
        // -------------------------------------------------------

        const dashboardResponse = await fetch(
  `http://127.0.0.1:5000/api/dashboard/${userId}`
);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();

          console.log("My Learning dashboard:", dashboardData);

          // -----------------------------------------------------
          // QUIZ SCORE
          // -----------------------------------------------------

          const attempts = Array.isArray(dashboardData.quiz_attempts)
            ? dashboardData.quiz_attempts
            : [];

          if (attempts.length > 0) {
            const scores = attempts
              .map((attempt) => {
                return Number(
                  attempt.score ??
                    attempt.percentage ??
                    attempt.quiz_score ??
                    0
                );
              })
              .filter((score) => !Number.isNaN(score));

            if (scores.length > 0) {
              const averageScore = Math.round(
                scores.reduce((sum, score) => sum + score, 0) /
                  scores.length
              );

              setQuizScore(averageScore);
            }
          }

          // -----------------------------------------------------
          // STUDY HOURS
          // -----------------------------------------------------

          const dashboardStats = dashboardData.stats || {};

          const minutes = Number(
            dashboardStats.study_minutes ??
              dashboardData.study_minutes ??
              0
          );

          if (minutes > 0) {
            setLearningHours(
              Math.round((minutes / 60) * 10) / 10
            );
          }
        }
      } catch (error) {
        console.error("My Learning backend error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[255px] flex-col bg-[#003049]">

        <div className="px-7 pb-8 pt-8">
          <img
            src={logo}
            alt="Sankhyiki Saarthi"
            className="h-auto w-[205px] object-contain"
          />
        </div>

        <div className="px-4">
          <p className="small-serif mb-3 px-3 text-[10px] uppercase tracking-[0.2em] text-[#669BBC]">
            Learn
          </p>

          <nav className="space-y-1">

            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => navigate("dashboard")}
            />

            <SidebarItem
              icon={BookOpen}
              label="Boonscrolling"
              onClick={() => navigate("boonscrolling")}
            />

            <SidebarItem
              icon={GraduationCap}
              label="My Learning"
              active
              onClick={() => navigate("MyLearning")}
            />

            <SidebarItem
              icon={Target}
              label="Adaptive Quiz"
              onClick={() => navigate("AdaptiveQuiz")}
            />

            <SidebarItem
              icon={BarChart3}
              label="Competencies"
              onClick={() => navigate("Competencies")}
            />

          </nav>
        </div>

        <div className="mt-7 px-4">

          <p className="small-serif mb-3 px-3 text-[10px] uppercase tracking-[0.2em] text-[#669BBC]">
            Resources
          </p>

          <nav className="space-y-1">

            <SidebarItem
              icon={FileText}
              label="Notes Desk"
              onClick={() => navigate("NotesDesk")}
            />

            <SidebarItem
              icon={BookOpenCheck}
              label="Summarize"
              onClick={() => navigate("Summarize")}
            />

            <SidebarItem
              icon={Library}
              label="Study Materials"
              onClick={() => navigate("StudyMaterials")}
            />

          </nav>

        </div>

        {/* PROFILE */}
        <div className="mt-auto border-t border-[#FDF0D5]/10 p-4">
          <SidebarItem
            icon={User}
            label="Profile"
            onClick={() => navigate("Profile")}
          />
        </div>

      </aside>

      {/* MAIN */}
      <main className="ml-[255px] min-h-screen">

        {/* TOP BAR */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#003049]/8 bg-[#FDF0D5]/95 px-10 backdrop-blur">

          <div>
            <p className="small-serif text-[11px] uppercase tracking-[0.18em] text-[#669BBC]">
              Your learning space
            </p>

            <h1 className="font-mogilte mt-0.5 text-2xl text-[#003049]">
              My Learning
            </h1>
          </div>

          {/* ONLY PFP */}
          <button
            onClick={() => navigate("Profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFB703] text-[#003049] shadow-sm transition-transform hover:scale-105"
            aria-label="Open Profile"
          >
            <User size={18} />
          </button>

        </header>

        <div className="mx-auto max-w-[1080px] px-10 py-9">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-[30px] bg-[#003049] px-8 py-8 shadow-[0_16px_45px_rgba(0,48,73,0.14)]">

            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#FFB703]/15 blur-3xl" />

            <div className="relative flex items-center justify-between gap-8">

              <div className="max-w-[620px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFB703]/12 px-3 py-1.5">

                  <GraduationCap
                    size={14}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-[11px] text-[#FFB703]">
                    PERSONALIZED LEARNING
                  </span>

                </div>

                <h2 className="font-mogilte text-[40px] leading-[1.05] text-[#FDF0D5]">
                  Keep building your
                  <br />
                  <span className="text-[#FFB703]">
                    statistical skills.
                  </span>
                </h2>

                <p className="clean-sans mt-4 max-w-[560px] text-[14px] leading-6 text-[#FDF0D5]/65">
                  Continue where you left off and explore learning
                  recommendations based on your competency gaps and
                  performance.
                </p>

              </div>

              <div className="hidden min-w-[190px] rounded-[24px] border border-[#FDF0F5]/10 bg-[#FDF0F5]/5 p-5 lg:block">

                <p className="small-serif text-[10px] uppercase tracking-[0.16em] text-[#669BBC]">
                  Overall progress
                </p>

                <div className="mt-3 flex items-end gap-2">

                  <span className="font-mogilte text-4xl text-[#FFB703]">
                    {overallProgress}%
                  </span>

                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#FDF0F5]/10">
                  <div
                    className="h-full rounded-full bg-[#FFB703]"
                    style={{
                      width: `${Math.min(
                        Math.max(overallProgress, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="small-serif mt-3 text-[11px] text-[#FDF0F5]/50">
                  {learningHours > 0
                    ? `${learningHours} learning hours`
                    : "Your learning journey"}
                </p>

              </div>

            </div>

          </section>

          {/* CONTINUE LEARNING */}
          <section className="mt-9">

            <div className="flex items-end justify-between">

              <div>
                <h2 className="font-mogilte text-2xl">
                  Continue learning
                </h2>

                <p className="clean-sans mt-1 text-[12px] text-[#003049]/55">
                  Pick up exactly where you left off.
                </p>
              </div>

              <button className="small-serif text-[12px] text-[#669BBC]">
                View all
              </button>

            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {loading ? (
                <>
                  <div className="rounded-[25px] border border-[#003049]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,48,73,0.06)]">
                    <p className="small-serif text-[12px] text-[#003049]/50">
                      Loading your courses...
                    </p>
                  </div>

                  <div className="rounded-[25px] border border-[#003049]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,48,73,0.06)]">
                    <p className="small-serif text-[12px] text-[#003049]/50">
                      Loading your learning data...
                    </p>
                  </div>
                </>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <div
                    key={course.id ?? course.title}
                    className="rounded-[25px] border border-[#003049]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,48,73,0.06)]"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFB703]/20 text-[#003049]">
                        <BookOpen size={19} />
                      </div>

                      <span className="small-serif rounded-full bg-[#FDF0F5] px-3 py-1.5 text-[10px] text-[#003049]/60">
                        {course.tag}
                      </span>

                    </div>

                    <p className="small-serif mt-5 text-[10px] uppercase tracking-[0.15em] text-[#669BBC]">
                      {course.provider}
                    </p>

                    <h3 className="font-mogilte mt-2 text-[23px] leading-tight">
                      {course.title}
                    </h3>

                    <div className="mt-5 flex items-center justify-between">

                      <span className="small-serif text-[11px] text-[#003049]/50">
                        {course.lessons}
                      </span>

                      <span className="small-serif text-[11px] font-semibold">
                        {course.progress}%
                      </span>

                    </div>

                    <ProgressBar value={course.progress} />

                    <button
                      onClick={() => continueCourse(course)}
                      className="mt-5 flex items-center gap-2 rounded-full bg-[#FFB703] px-5 py-2.5 text-[#003049]"
                    >

                      <Play
                        size={14}
                        fill="currentColor"
                      />

                      <span className="small-serif text-[11px] font-semibold">
                        Continue
                      </span>

                    </button>

                  </div>
                ))
              ) : (
                <div className="rounded-[25px] border border-[#003049]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,48,73,0.06)] md:col-span-2">

                  <p className="font-mogilte text-xl">
                    No courses in progress yet.
                  </p>

                  <p className="clean-sans mt-2 text-[12px] text-[#003049]/55">
                    Start a course to see your learning progress here.
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* LEARNING INSIGHTS */}
          <section className="mt-9">

            <div>
              <h2 className="font-mogilte text-2xl">
                Your learning progress
              </h2>

              <p className="clean-sans mt-1 text-[12px] text-[#003049]/55">
                A quick view of how your skills are developing.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">

              <div className="rounded-[23px] bg-white p-5 shadow-[0_8px_25px_rgba(0,48,73,0.05)]">

                <div className="flex items-center justify-between">

                  <span className="small-serif text-[11px] text-[#003049]/55">
                    Courses completed
                  </span>

                  <CheckCircle2
                    size={18}
                    className="text-[#669BBC]"
                  />

                </div>

                <p className="font-mogilte mt-3 text-3xl">
                  {completed.length}
                </p>

                <p className="small-serif mt-1 text-[10px] text-[#003049]/45">
                  From your learning history
                </p>

              </div>

              <div className="rounded-[23px] bg-white p-5 shadow-[0_8px_25px_rgba(0,48,73,0.05)]">

                <div className="flex items-center justify-between">

                  <span className="small-serif text-[11px] text-[#003049]/55">
                    Learning hours
                  </span>

                  <Clock3
                    size={18}
                    className="text-[#669BBC]"
                  />

                </div>

                <p className="font-mogilte mt-3 text-3xl">
                  {learningHours > 0
                    ? `${learningHours}h`
                    : "0h"}
                </p>

                <p className="small-serif mt-1 text-[10px] text-[#003049]/45">
                  Recorded learning time
                </p>

              </div>

              <div className="rounded-[23px] bg-white p-5 shadow-[0_8px_25px_rgba(0,48,73,0.05)]">

                <div className="flex items-center justify-between">

                  <span className="small-serif text-[11px] text-[#003049]/55">
                    Average quiz score
                  </span>

                  <TrendingUp
                    size={18}
                    className="text-[#669BBC]"
                  />

                </div>

                <p className="font-mogilte mt-3 text-3xl">
                  {quizScore > 0
                    ? `${quizScore}%`
                    : "—"}
                </p>

                <p className="small-serif mt-1 text-[10px] text-[#003049]/45">
                  Based on your quiz attempts
                </p>

              </div>

            </div>

          </section>

          {/* RECOMMENDATIONS */}
          <section className="mt-9">

            <div className="flex items-end justify-between">

              <div>
                <h2 className="font-mogilte text-2xl">
                  Recommended for you
                </h2>

                <p className="clean-sans mt-1 text-[12px] text-[#003049]/55">
                  Courses selected from your competency profile.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-[#FFB703]/15 px-3 py-1.5">

                <Target
                  size={13}
                  className="text-[#003049]"
                />

                <span className="small-serif text-[10px]">
                  AI matched
                </span>

              </div>

            </div>

            <div className="mt-5 rounded-[25px] border border-[#003049]/10 bg-white p-6">

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#003049] text-[#FFB703]">
                    <Target size={20} />
                  </div>

                  <div>

                    <p className="small-serif text-[10px] uppercase tracking-[0.15em] text-[#669BBC]">
                      Skill gap detected
                    </p>

                    <h3 className="font-mogilte mt-1 text-[22px]">
                      Data Interpretation
                    </h3>

                    <p className="clean-sans mt-2 max-w-[580px] text-[12px] leading-5 text-[#003049]/55">
                      Your recent quiz performance suggests that improving
                      data interpretation can strengthen your overall
                      statistical competency.
                    </p>

                  </div>

                </div>

                <button
                  onClick={() => navigate("StudyMaterials")}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-[#FFB703] px-5 py-3 text-[#003049]"
                >

                  <span className="small-serif text-[11px] font-semibold">
                    Explore courses
                  </span>

                  <ArrowRight size={14} />

                </button>

              </div>

            </div>

          </section>

          {/* COMPLETED */}
          <section className="mt-9 pb-10">

            <div>
              <h2 className="font-mogilte text-2xl">
                Recently completed
              </h2>

              <p className="clean-sans mt-1 text-[12px] text-[#003049]/55">
                Your latest learning achievements.
              </p>

            </div>

            <div className="mt-5 overflow-hidden rounded-[25px] border border-[#003049]/10 bg-white">

              {completed.length > 0 ? (
                completed.map((course, index) => (
                  <div
                    key={course.title}
                    className={`flex items-center justify-between gap-4 px-6 py-5 ${
                      index !== completed.length - 1
                        ? "border-b border-[#003049]/8"
                        : ""
                    }`}
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#669BBC]/12 text-[#669BBC]">
                        <CheckCircle2 size={17} />
                      </div>

                      <div>

                        <h3 className="clean-sans text-[13px] font-semibold">
                          {course.title}
                        </h3>

                        <p className="small-serif mt-1 text-[10px] text-[#003049]/45">
                          {course.provider}
                        </p>

                      </div>

                    </div>

                    <div className="rounded-full bg-[#FDF0F5] px-3 py-1.5">

                      <span className="small-serif text-[11px] font-semibold">
                        {course.score}
                      </span>

                    </div>

                  </div>
                ))
              ) : (
                <div className="px-6 py-7">

                  <p className="font-mogilte text-lg">
                    No completed courses yet.
                  </p>

                  <p className="small-serif mt-1 text-[11px] text-[#003049]/45">
                    Completed courses will appear here automatically.
                  </p>

                </div>
              )}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}