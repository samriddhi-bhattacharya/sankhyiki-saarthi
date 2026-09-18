import { useEffect, useState } from "react";
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
  ArrowRight,
  Zap,
  Flame,
  Clock3,
  TrendingUp,
  Compass,
  Highlighter,
} from "lucide-react";

import logo from "../assets/logo.png";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard",
  },
  {
    label: "Boonscrolling",
    icon: BookOpen,
    page: "boonscrolling",
  },
  {
    label: "My Learning",
    icon: GraduationCap,
    page: "MyLearning",
  },
  {
    label: "Adaptive Quiz",
    icon: Target,
    page: "AdaptiveQuiz",
  },
  {
    label: "Notes Desk",
    icon: FileText,
    page: "NotesDesk",
  },
  {
    label: "Summarize",
    icon: BarChart3,
    page: "Summarize",
  },
  {
    label: "Competencies",
    icon: Target,
    page: "Competencies",
  },
  {
    label: "Study Materials",
    icon: Library,
    page: "StudyMaterials",
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem(
    "sankhyiki_user_id"
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/dashboard/${userId}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch dashboard data"
          );
        }

        const data = await response.json();

        console.log(
          "User-specific dashboard:",
          data
        );

        setDashboardData(data);
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [userId]);

  const user = dashboardData?.user;

  const backendStats =
    dashboardData?.stats || {};

  const courses =
    dashboardData?.courses || [];

  const competencies =
    dashboardData?.competencies || [];

  /*
   * ============================================================
   * USER DATA DETECTION
   * ============================================================
   */

  const hasCourses =
    Array.isArray(courses) &&
    courses.length > 0;

  const hasCompetencies =
    Array.isArray(competencies) &&
    competencies.length > 0;

  const hasLearningData =
    hasCourses ||
    hasCompetencies;

  /*
   * ============================================================
   * COMPETENCY
   * ============================================================
   */

  const competencyScores = competencies
    .map((item) =>
      Number(
        item?.score ??
        item?.value ??
        item?.percentage ??
        0
      )
    )
    .filter((score) =>
      Number.isFinite(score)
    );

  const calculatedCompetency =
    competencyScores.length > 0
      ? Math.round(
          competencyScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / competencyScores.length
        )
      : 0;

  /*
   * Backend competency is preferred.
   * If backend doesn't provide it,
   * calculate it from user's own competencies.
   */
  const competencyFromBackend = Number(
    backendStats.competency
  );

  const competencyMastery =
    Number.isFinite(
      competencyFromBackend
    ) &&
    competencyFromBackend > 0
      ? Math.round(
          competencyFromBackend
        )
      : calculatedCompetency;

  /*
   * ============================================================
   * LEARNING RHYTHM
   * ============================================================
   */

  const learningRhythmValue = Number(
    backendStats.learning_rhythm ??
    backendStats.study_days ??
    backendStats.learning_days ??
    backendStats.course_count ??
    0
  );

  const learningRhythm =
    Number.isFinite(
      learningRhythmValue
    )
      ? Math.max(
          0,
          Math.round(
            learningRhythmValue
          )
        )
      : 0;

  /*
   * ============================================================
   * LEARNING PULSE / MOMENTUM
   * ============================================================
   */

  const backendPulse = Number(
    backendStats.average_progress ??
    backendStats.learning_pulse ??
    backendStats.momentum ??
    0
  );

  /*
   * If user has learning data,
   * use their actual progress.
   *
   * For Samriddhi, existing course/competency
   * data will therefore keep the dashboard
   * active instead of showing 0.
   *
   * For Rahul, who has no learning records,
   * it remains 0.
   */
  const learningPulse =
    Number.isFinite(backendPulse)
      ? Math.max(
          0,
          Math.min(
            Math.round(
              backendPulse
            ),
            100
          )
        )
      : 0;

  /*
   * ============================================================
   * STUDY TIME
   * ============================================================
   */

  const rawStudyMinutes =
    backendStats.study_minutes ??
    backendStats.total_study_minutes ??
    backendStats.study_time_minutes ??
    0;

  const rawStudySessions =
    backendStats.study_sessions ??
    backendStats.sessions ??
    backendStats.total_sessions ??
    0;

  const studyMinutesTotal =
    Number(rawStudyMinutes);

  const studySessions =
    Number(rawStudySessions);

  /*
   * IMPORTANT:
   *
   * No hardcoded 2h 40m for new users.
   *
   * If backend has study data,
   * show it.
   *
   * Otherwise show 0.
   */
  const safeStudyMinutes =
    Number.isFinite(
      studyMinutesTotal
    )
      ? Math.max(
          0,
          Math.round(
            studyMinutesTotal
          )
        )
      : 0;

  const safeStudySessions =
    Number.isFinite(
      studySessions
    )
      ? Math.max(
          0,
          Math.round(
            studySessions
          )
        )
      : 0;

  /*
   * ============================================================
   * WEEKLY CHANGE
   * ============================================================
   */

  const backendWeeklyChange =
    Number(
      backendStats.weekly_change ??
      backendStats.weeklyChange ??
      0
    );

  const weeklyChange =
    Number.isFinite(
      backendWeeklyChange
    )
      ? Math.round(
          backendWeeklyChange
        )
      : 0;

  /*
   * ============================================================
   * FINAL STATS
   * ============================================================
   */

  const stats = {
    learning_rhythm:
      learningRhythm,

    learning_pulse:
      learningPulse,

    competency_mastery:
      competencyMastery,

    study_minutes:
      safeStudyMinutes,

    study_sessions:
      safeStudySessions,

    weekly_change:
      weeklyChange,

    target: 72,
  };

  /*
   * ============================================================
   * INDIVIDUAL COMPETENCIES
   * ============================================================
   */

  const dataAnalysis =
    competencies.find(
      (item) =>
        item.competency ===
        "Data Analysis"
    )?.score ?? 0;

  const statisticalReasoning =
    competencies.find(
      (item) =>
        item.competency ===
        "Statistical Reasoning"
    )?.score ?? 0;

  const researchSkills =
    competencies.find(
      (item) =>
        item.competency ===
        "Research Skills"
    )?.score ?? 0;

  const firstCourse =
    courses[0];

  const userName =
    user?.name || "Learner";

  const studyHours =
    Math.floor(
      stats.study_minutes / 60
    );

  const studyMinutes =
    stats.study_minutes % 60;

  return (
    <div
      className="min-h-screen bg-[#FDF0D5] text-[#003049]"
      style={{
        fontFamily:
          "Mogilte, Georgia, serif",
        fontSynthesis: "none",
      }}
    >
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className="w-[205px] shrink-0 bg-[#003049] px-3.5 py-4 text-[#FDF0D5]"
          style={{
            fontFamily:
              "Mogilte, Georgia, serif",
            fontSynthesis: "none",
          }}
        >

          {/* LOGO */}

          <div className="mb-5 flex items-center px-2">
            <img
              src={logo}
              alt="Sankhyiki Saarthi"
              className="h-[36px] w-auto object-contain"
            />
          </div>

          {/* LEARNING RHYTHM */}

          <div className="mb-5 rounded-[15px] border border-[#669BBC]/25 bg-[#669BBC]/10 p-3.5">

            <div className="flex items-center justify-between">

              <span className="text-[11px] text-[#FDF0D5]/75">
                Learning rhythm
              </span>

              <span className="text-[14px] font-normal text-[#FFB703]">
                {stats.learning_rhythm} days
              </span>

            </div>

            <div className="mt-3 flex items-center gap-2">

              <Flame
                size={15}
                strokeWidth={1.8}
                className="text-[#FFB703]"
              />

              <span className="text-[11px] font-normal">
                Keep the thread going
              </span>

            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#669BBC]/25">

              <div
                className="h-full rounded-full bg-[#FFB703]"
                style={{
                  width: `${Math.min(
                    Math.max(
                      stats.learning_rhythm *
                        20,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* YOUR DESK */}

          <p className="mb-2.5 px-2.5 text-[9px] font-normal uppercase tracking-[0.2em] text-[#669BBC]">
            Your desk
          </p>

          {/* NAVIGATION */}

          <nav className="space-y-1">

            {menuItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  item.page ===
                  "dashboard";

                return (
                  <button
                    key={
                      item.label
                    }
                    onClick={() =>
                      onNavigate(
                        item.page
                      )
                    }
                    className={`group flex w-full items-center gap-2.5 rounded-[13px] px-3 py-2 text-left transition-all duration-200 ${
                      active
                        ? "bg-[#FFB703] text-[#003049]"
                        : "text-[#FDF0D5]/70 hover:bg-[#669BBC]/10 hover:text-[#FDF0D5]"
                    }`}
                  >

                    <Icon
                      size={16}
                      strokeWidth={
                        active
                          ? 2
                          : 1.6
                      }
                      className="shrink-0"
                    />

                    <span className="flex-1 text-[11px] font-normal">
                      {
                        item.label
                      }
                    </span>

                    {active && (
                      <ArrowRight
                        size={14}
                        strokeWidth={
                          1.8
                        }
                      />
                    )}

                  </button>
                );
              }
            )}

          </nav>

          {/* AI BOX */}

          <div className="mt-5 rounded-[14px] bg-[#669BBC]/10 p-3">

            <div className="mb-1.5 flex items-center gap-1.5">

              <Zap
                size={13}
                strokeWidth={1.8}
                className="text-[#FFB703]"
              />

              <span className="text-[10px] font-normal">
                AI Learning Assistant
              </span>

            </div>

            <p className="text-[9px] leading-3.5 text-[#FDF0D5]/55">
              Get personalized help with your learning journey.
            </p>

            <button
              onClick={() =>
                onNavigate(
                  "AdaptiveQuiz"
                )
              }
              className="mt-2 flex items-center gap-1 text-[9px] font-normal text-[#FFB703]"
            >
              Explore AI tools
              <ArrowRight size={11} />
            </button>

          </div>

          {/* PROFILE */}

          <div className="mt-4 border-t border-[#FDF0D5]/10 pt-2.5">

            <button
              onClick={() =>
                onNavigate(
                  "Profile"
                )
              }
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#669BBC]/10"
            >

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFB703] text-[#003049]">
                <User
                  size={13}
                  strokeWidth={
                    1.8
                  }
                />
              </div>

              <div className="min-w-0">

                <p className="truncate text-[10px] font-normal">
                  {userName}
                </p>

                <p className="text-[8px] text-[#FDF0D5]/40">
                  View profile
                </p>

              </div>

            </button>

          </div>

        </aside>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="min-w-0 flex-1 bg-[#FDF0D5]">

          {/* TOP BAR */}

          <header className="flex h-[62px] items-center justify-between border-b border-[#003049]/10 px-6">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-[#669BBC]" />

              <span className="text-[11px] text-[#003049]/60">
                Your private learning desk
              </span>

            </div>

            <div className="flex items-center gap-2">

              {/* ONLINE */}

              <div className="flex h-8 items-center gap-1.5 rounded-full border border-[#003049]/10 px-3">

                <span className="h-1.5 w-1.5 rounded-full bg-[#669BBC]" />

                <span className="text-[10px] font-normal">
                  Online
                </span>

              </div>

              {/* SEARCH */}

              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#003049]/10 transition hover:bg-[#FFB703]/10"
                aria-label="Search"
              >
                <Search
                  size={14}
                  strokeWidth={
                    1.7
                  }
                />
              </button>

              {/* NOTIFICATION */}

              <button
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#003049]/10 transition hover:bg-[#FFB703]/10"
                aria-label="Notifications"
              >

                <Bell
                  size={14}
                  strokeWidth={
                    1.7
                  }
                />

                <span className="absolute right-[6px] top-[5px] h-1.5 w-1.5 rounded-full bg-[#FFB703]" />

              </button>

              {/* ONLY GO TO PROFILE */}

              <button
                onClick={() =>
                  onNavigate(
                    "Profile"
                  )
                }
                className="ml-1 flex h-8 items-center gap-1.5 rounded-full bg-[#003049] px-4 text-[10px] font-normal text-[#FDF0D5] transition hover:-translate-y-0.5"
              >
                Go to your profile
                <ArrowRight
                  size={12}
                  strokeWidth={
                    1.8
                  }
                />
              </button>

            </div>

          </header>

          {/* PAGE CONTENT */}

          <div className="px-6 py-5">

            {/* =================================================
                GREETING
            ================================================= */}

            <section className="mb-5 flex items-start justify-between gap-5">

              <div>

                {loading ? (
                  <>
                    <div className="h-8 w-60 animate-pulse rounded-lg bg-[#003049]/10" />

                    <div className="mt-2 h-3.5 w-64 animate-pulse rounded bg-[#003049]/10" />
                  </>
                ) : (
                  <>

                    <h1
                      className="font-mogilte text-[42px] font-normal leading-[0.94] tracking-[-0.03em]"
                      style={{
                        fontFamily:
                          "Mogilte, Georgia, serif",
                        fontWeight: 400,
                        fontSynthesis:
                          "none",
                      }}
                    >
                      {getGreeting()},
                      <br />

                      <span className="text-[#176B5A]">
                        {userName}.
                      </span>

                    </h1>

                    <p className="mt-2.5 text-[12px] font-normal text-[#669BBC]">
                      {hasLearningData
                        ? "A small, focused step is waiting for you."
                        : "Your learning journey starts here."}
                    </p>

                  </>
                )}

              </div>

              {/* BOONSCROLLING */}

              <button
                onClick={() =>
                  onNavigate(
                    "Boonscrolling"
                  )
                }
                className="mt-1 flex h-[60px] min-w-[225px] items-center justify-between gap-4 rounded-full bg-[#003049] px-4.5 text-[#FDF0D5] shadow-[0_10px_24px_rgba(0,48,73,0.12)] transition hover:-translate-y-0.5"
              >

                <div className="flex items-center gap-2.5">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFB703] text-[#003049]">

                    <Zap
                      size={16}
                      fill="currentColor"
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <div className="text-left">

                    <p className="text-[9px] font-normal">
                      Start
                    </p>

                    <p className="text-[11px] font-normal">
                      BOONSCROLLING
                    </p>

                  </div>

                </div>

                <ArrowRight
                  size={16}
                  strokeWidth={
                    1.8
                  }
                />

              </button>

            </section>

            {/* =================================================
                TOP STATS
            ================================================= */}

            <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.55fr_0.85fr_0.85fr]">

              {/* LEARNING PULSE */}

              <div className="relative min-h-[205px] overflow-hidden rounded-[22px] bg-[#003049] p-5 text-[#FDF0D5]">

                <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[32px] border-[#FFB703]/20" />

                <div className="absolute -bottom-24 left-1/3 h-44 w-44 rounded-full border-[24px] border-[#669BBC]/10" />

                <div className="relative">

                  <div className="flex items-center justify-between">

                    <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                      Your learning pulse
                    </p>

                    <TrendingUp
                      size={16}
                      strokeWidth={
                        1.8
                      }
                      className="text-[#FFB703]"
                    />

                  </div>

                  <p className="mt-6 text-[13px] font-normal text-[#FDF0D5]/75">
                    This week is taking shape.
                  </p>

                  <div className="mt-3 flex items-end gap-2.5">

                    <span
                      className="font-mogilte text-[54px] font-normal leading-none"
                      style={{
                        fontFamily:
                          "Mogilte, Georgia, serif",
                        fontWeight: 400,
                        fontSynthesis:
                          "none",
                      }}
                    >
                      {
                        stats.learning_pulse
                      }
                    </span>

                    <span className="mb-1.5 text-[11px] text-[#FDF0D5]/50">
                      /100 momentum
                    </span>

                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#669BBC]/25">

                    <div
                      className="h-full rounded-full bg-[#FFB703]"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            stats.learning_pulse,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2.5 flex justify-between text-[9px] text-[#FDF0D5]/45">

                    <span>
                      {
                        stats.learning_rhythm
                      }{" "}
                      study days
                    </span>

                    <span>
                      {stats.weekly_change >=
                      0
                        ? `+${stats.weekly_change}`
                        : stats.weekly_change}{" "}
                      from last week
                    </span>

                  </div>

                </div>

              </div>

              {/* COMPETENCY */}

              <div className="min-h-[205px] rounded-[22px] border border-[#003049]/10 bg-[#FDF0D5] p-5">

                <div className="flex items-start justify-between">

                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                    Competency
                    <br />
                    view
                  </p>

                  <ArrowRight
                    size={16}
                    strokeWidth={
                      1.8
                    }
                    className="text-[#176B5A]"
                  />

                </div>

                <div className="mt-6 flex items-end gap-1">

                  <span
                    className="font-mogilte text-[50px] font-normal leading-none"
                    style={{
                      fontFamily:
                        "Mogilte, Georgia, serif",
                      fontWeight: 400,
                      fontSynthesis:
                        "none",
                    }}
                  >
                    {
                      stats.competency_mastery
                    }
                  </span>

                  <span className="mb-1 text-[18px]">
                    %
                  </span>

                </div>

                <p className="mt-1.5 text-[10px] text-[#669BBC]">
                  overall mastery
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#003049]/10">

                  <div
                    className="h-full rounded-full bg-[#176B5A]"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          stats.competency_mastery,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

                <div className="mt-3 flex justify-between text-[9px] text-[#669BBC]">

                  <span>
                    Target
                  </span>

                  <strong className="font-normal text-[#003049]">
                    {
                      stats.target
                    }
                    %
                  </strong>

                </div>

              </div>

              {/* STUDY TIME */}

              <div className="min-h-[205px] rounded-[22px] border border-[#003049]/10 bg-[#FDF0D5] p-5">

                <div className="flex items-center justify-between">

                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                    Study time
                  </p>

                  <Clock3
                    size={17}
                    strokeWidth={
                      1.7
                    }
                    className="text-[#E39A00]"
                  />

                </div>

                <div className="mt-6">

                  <span
                    className="font-mogilte text-[40px] font-normal leading-none"
                    style={{
                      fontFamily:
                        "Mogilte, Georgia, serif",
                      fontWeight: 400,
                      fontSynthesis:
                        "none",
                    }}
                  >
                    {`${studyHours}h`}
                  </span>

                  <br />

                  <span
                    className="font-mogilte text-[36px] font-normal leading-none"
                    style={{
                      fontFamily:
                        "Mogilte, Georgia, serif",
                      fontWeight: 400,
                      fontSynthesis:
                        "none",
                    }}
                  >
                    {`${studyMinutes}m`}
                  </span>

                </div>

                <p className="mt-1.5 text-[10px] text-[#669BBC]">
                  across{" "}
                  {
                    stats.study_sessions
                  }{" "}
                  sessions
                </p>

                <div className="mt-4 flex h-10 items-end justify-between gap-1">

                  {[16, 27, 20, 35, 24, 40, 31].map(
                    (
                      height,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className={`w-2.5 rounded-t-full ${
                          index === 6
                            ? "bg-[#E39A00]"
                            : "bg-[#A8D9D4]"
                        }`}
                        style={{
                          height: `${height}px`,
                        }}
                      />
                    )
                  )}

                </div>

                <div className="mt-1 flex justify-between text-[7px] text-[#669BBC]">

                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>

                </div>

              </div>

            </section>

            {/* =================================================
                NEW USER STATE
            ================================================= */}

            {!loading &&
              !hasLearningData && (
                <section className="mt-4 rounded-[20px] bg-[#003049] p-4.5 text-[#FDF0D5]">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <div className="mb-1.5 flex items-center gap-1.5">

                        <Compass
                          size={14}
                          strokeWidth={
                            1.7
                          }
                          className="text-[#FFB703]"
                        />

                        <span className="text-[9px] font-normal text-[#FFB703]">
                          Start your journey
                        </span>

                      </div>

                      <h2
                        className="font-mogilte text-[20px] font-normal"
                        style={{
                          fontFamily:
                            "Mogilte, Georgia, serif",
                          fontWeight: 400,
                          fontSynthesis:
                            "none",
                        }}
                      >
                        Build your personalized learning path.
                      </h2>

                      <p className="mt-1 max-w-xl text-[9px] leading-4 text-[#FDF0D5]/55">
                        Complete your profile, explore learning materials and
                        take your first assessment.
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        onNavigate(
                          "StudyMaterials"
                        )
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FFB703] px-3 py-2 text-[9px] font-normal text-[#003049]"
                    >
                      Explore Learning
                      <ArrowRight
                        size={12}
                        strokeWidth={
                          1.8
                        }
                      />
                    </button>

                  </div>

                </section>
              )}

            {/* =================================================
                LOWER TWO COLUMN
            ================================================= */}

            <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.9fr]">

              {/* CONTINUE LEARNING */}

              <div className="rounded-[20px] border border-[#003049]/10 p-4.5">

                <div className="mb-3.5 flex items-center justify-between">

                  <div>

                    <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                      Continue learning
                    </p>

                    <h2
                      className="mt-1 font-mogilte text-[19px] font-normal"
                      style={{
                        fontFamily:
                          "Mogilte, Georgia, serif",
                        fontWeight: 400,
                        fontSynthesis:
                          "none",
                      }}
                    >
                      Pick up where you left off
                    </h2>

                  </div>

                  <button
                    onClick={() =>
                      onNavigate(
                        "MyLearning"
                      )
                    }
                    className="flex items-center gap-1 text-[9px] font-normal"
                  >
                    View all
                    <ArrowRight
                      size={12}
                      strokeWidth={
                        1.8
                      }
                    />
                  </button>

                </div>

                {firstCourse ? (
                  <div className="rounded-[16px] bg-[#003049] p-3.5 text-[#FDF0D5]">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <span className="rounded-full bg-[#FFB703]/15 px-2 py-0.5 text-[7px] font-normal uppercase text-[#FFB703]">
                          {
                            firstCourse.provider ||
                            "Learning"
                          }
                        </span>

                        <h3 className="mt-1.5 text-[13px] font-normal">
                          {
                            firstCourse.course_name
                          }
                        </h3>

                      </div>

                      <BookOpen
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="text-[#FFB703]"
                      />

                    </div>

                    <div className="mt-3 flex items-center justify-between text-[8px] text-[#FDF0D5]/50">

                      <span>
                        Progress
                      </span>

                      <span>
                        {
                          firstCourse.progress
                        }
                        %
                      </span>

                    </div>

                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#FDF0D5]/10">

                      <div
                        className="h-full rounded-full bg-[#FFB703]"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                firstCourse.progress
                              ) || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <button
                      onClick={() =>
                        onNavigate(
                          "MyLearning"
                        )
                      }
                      className="mt-2.5 flex items-center gap-1 rounded-lg bg-[#FDF0D5] px-2.5 py-1.5 text-[8px] font-normal text-[#003049]"
                    >
                      Continue course
                      <ArrowRight
                        size={11}
                        strokeWidth={
                          1.8
                        }
                      />
                    </button>

                  </div>
                ) : (
                  <div className="rounded-[16px] border border-dashed border-[#003049]/15 p-5 text-center">

                    <BookOpen
                      size={20}
                      strokeWidth={
                        1.5
                      }
                      className="mx-auto mb-2 text-[#003049]/25"
                    />

                    <h3 className="text-[11px] font-normal">
                      No courses yet
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-[9px] leading-4 text-[#003049]/45">
                      Once you start exploring learning materials,
                      your courses will appear here.
                    </p>

                    <button
                      onClick={() =>
                        onNavigate(
                          "StudyMaterials"
                        )
                      }
                      className="mt-2.5 rounded-lg bg-[#003049] px-3 py-1.5 text-[9px] font-normal text-[#FDF0D5]"
                    >
                      Explore courses
                    </button>

                  </div>
                )}

              </div>

              {/* AI RECOMMENDATION */}

              <div className="relative overflow-hidden rounded-[20px] bg-[#FFB703] p-4.5 text-[#003049]">

                <div className="absolute -bottom-16 -right-14 h-36 w-36 rounded-full border-[20px] border-[#003049]/5" />

                <div className="relative">

                  <div className="mb-3.5 flex items-center justify-between">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003049]/10">

                      <Compass
                        size={15}
                        strokeWidth={
                          1.7
                        }
                      />

                    </div>

                    <span className="text-[8px] font-normal uppercase tracking-[0.15em]">
                      AI insight
                    </span>

                  </div>

                  <p className="text-[8px] font-normal uppercase tracking-[0.15em] opacity-60">
                    Recommended next
                  </p>

                  <h2
                    className="mt-1.5 font-mogilte text-[20px] font-normal leading-tight"
                    style={{
                      fontFamily:
                        "Mogilte, Georgia, serif",
                      fontWeight: 400,
                      fontSynthesis:
                        "none",
                    }}
                  >
                    {hasLearningData
                      ? "Strengthen your core competencies"
                      : "Discover your learning path"}
                  </h2>

                  <p className="mt-1.5 text-[9px] leading-4 opacity-65">
                    {hasLearningData
                      ? "Explore learning materials that can help improve your weaker areas."
                      : "Explore courses and discover the skills you want to build."}
                  </p>

                  <button
                    onClick={() =>
                      onNavigate(
                        hasLearningData
                          ? "Recommendations"
                          : "StudyMaterials"
                      )
                    }
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#003049] px-3 py-2 text-[9px] font-normal text-[#FDF0D5]"
                  >
                    {hasLearningData
                      ? "View recommendations"
                      : "Explore learning"}

                    <ArrowRight
                      size={12}
                      strokeWidth={
                        1.8
                      }
                    />
                  </button>

                </div>

              </div>

            </section>

            {/* =================================================
                COMPETENCY
            ================================================= */}

            <section className="mt-4 rounded-[20px] border border-[#003049]/10 p-4.5">

              <div className="mb-3.5 flex items-center justify-between">

                <div>

                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                    Your competency profile
                  </p>

                  <h2
                    className="mt-1 font-mogilte text-[19px] font-normal"
                    style={{
                      fontFamily:
                        "Mogilte, Georgia, serif",
                      fontWeight: 400,
                      fontSynthesis:
                        "none",
                    }}
                  >
                    Skills to keep building
                  </h2>

                </div>

                <button
                  onClick={() =>
                    onNavigate(
                      "Competencies"
                    )
                  }
                  className="flex items-center gap-1 text-[9px] font-normal"
                >
                  View competencies
                  <ArrowRight
                    size={12}
                    strokeWidth={
                      1.8
                    }
                  />
                </button>

              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">

                {[
                  [
                    "Data Analysis",
                    dataAnalysis,
                  ],
                  [
                    "Statistical Reasoning",
                    statisticalReasoning,
                  ],
                  [
                    "Research Skills",
                    researchSkills,
                  ],
                ].map(
                  ([
                    name,
                    score,
                  ]) => (

                    <div
                      key={
                        name
                      }
                      className="rounded-[14px] bg-[#003049]/5 p-3"
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-[10px] font-normal">
                          {name}
                        </span>

                        <span className="text-[10px] font-normal">
                          {
                            Number(
                              score
                            ) || 0
                          }
                          %
                        </span>

                      </div>

                      <div className="h-1 overflow-hidden rounded-full bg-[#003049]/10">

                        <div
                          className="h-full rounded-full bg-[#669BBC]"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                Number(
                                  score
                                ) ||
                                  0,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <p className="mt-1.5 text-[8px] text-[#003049]/40">
                        Current competency score
                      </p>

                    </div>

                  )
                )}

              </div>

            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="mt-4 pb-5">

              <div className="mb-2.5">

                <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-[#669BBC]">
                  Quick actions
                </p>

                <h2
                  className="mt-1 font-mogilte text-[18px] font-normal"
                  style={{
                    fontFamily:
                      "Mogilte, Georgia, serif",
                    fontWeight: 400,
                    fontSynthesis:
                      "none",
                  }}
                >
                  What would you like to do next?
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">

                {/* BOONSCROLLING */}

                <button
                  onClick={() =>
                    onNavigate(
                      "Boonscrolling"
                    )
                  }
                  className="group flex items-center justify-between rounded-[15px] border border-[#003049]/10 p-3 text-left transition hover:-translate-y-0.5 hover:bg-[#FFB703]/10"
                >

                  <div className="flex items-center gap-2.5">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003049] text-[#FDF0D5]">

                      <BookOpen
                        size={14}
                        strokeWidth={
                          1.7
                        }
                      />

                    </div>

                    <div>

                      <p className="text-[10px] font-normal">
                        Start Boonscrolling
                      </p>

                      <p className="mt-0.5 text-[8px] text-[#003049]/45">
                        Learn through personalized content
                      </p>

                    </div>

                  </div>

                  <ArrowRight
                    size={13}
                    strokeWidth={
                      1.7
                    }
                    className="transition group-hover:translate-x-1"
                  />

                </button>

                {/* QUIZ */}

                <button
                  onClick={() =>
                    onNavigate(
                      "AdaptiveQuiz"
                    )
                  }
                  className="group flex items-center justify-between rounded-[15px] border border-[#003049]/10 p-3 text-left transition hover:-translate-y-0.5 hover:bg-[#669BBC]/10"
                >

                  <div className="flex items-center gap-2.5">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#669BBC] text-[#FDF0D5]">

                      <Target
                        size={14}
                        strokeWidth={
                          1.7
                        }
                      />

                    </div>

                    <div>

                      <p className="text-[10px] font-normal">
                        Take Adaptive Quiz
                      </p>

                      <p className="mt-0.5 text-[8px] text-[#003049]/45">
                        Practice at your level
                      </p>

                    </div>

                  </div>

                  <ArrowRight
                    size={13}
                    strokeWidth={
                      1.7
                    }
                    className="transition group-hover:translate-x-1"
                  />

                </button>

                {/* NOTES */}

                <button
                  onClick={() =>
                    onNavigate(
                      "NotesDesk"
                    )
                  }
                  className="group flex items-center justify-between rounded-[15px] border border-[#003049]/10 p-3 text-left transition hover:-translate-y-0.5 hover:bg-[#FFB703]/10"
                >

                  <div className="flex items-center gap-2.5">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB703] text-[#003049]">

                      <Highlighter
                        size={14}
                        strokeWidth={
                          1.7
                        }
                      />

                    </div>

                    <div>

                      <p className="text-[10px] font-normal">
                        Open Notes Desk
                      </p>

                      <p className="mt-0.5 text-[8px] text-[#003049]/45">
                        Capture and organize your learning
                      </p>

                    </div>

                  </div>

                  <ArrowRight
                    size={13}
                    strokeWidth={
                      1.7
                    }
                    className="transition group-hover:translate-x-1"
                  />

                </button>

              </div>

            </section>

          </div>

        </main>

      </div>
    </div>
  );
}