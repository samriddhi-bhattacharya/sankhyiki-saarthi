import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Target,
  FileText,
  BarChart3,
  Library,
  User,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Brain,
  Clock3,
} from "lucide-react";

import logo from "../assets/logo.png";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Boonscrolling", icon: BookOpen },
  { name: "My Learning", icon: GraduationCap },
  { name: "Adaptive Quiz", icon: Target },
  { name: "Notes Desk", icon: FileText },
  { name: "Summarize", icon: FileText },
  { name: "Competencies", icon: BarChart3 },
  { name: "Study Materials", icon: Library },
];

const fallbackCompetencies = [
  {
    name: "Statistical Methods",
    score: 78,
    level: "Strong",
    trend: "+8%",
    description: "Good understanding of core statistical methods.",
  },
  {
    name: "Data Interpretation",
    score: 61,
    level: "Developing",
    trend: "+5%",
    description: "Can interpret basic datasets but needs more practice.",
  },
  {
    name: "Probability & Sampling",
    score: 54,
    level: "Needs Attention",
    trend: "+2%",
    description: "Sampling concepts and probability need reinforcement.",
  },
  {
    name: "Official Statistics",
    score: 72,
    level: "Good",
    trend: "+6%",
    description: "Good understanding of statistical systems and practices.",
  },
  {
    name: "Data Quality & Metadata",
    score: 48,
    level: "Needs Attention",
    trend: "+1%",
    description: "More exposure to data-quality frameworks is recommended.",
  },
  {
    name: "Data Visualization",
    score: 66,
    level: "Developing",
    trend: "+4%",
    description: "Understands common charts and basic visualization.",
  },
];

function getScoreLabel(score) {
  if (score >= 75) return "Strong";
  if (score >= 60) return "Developing";
  return "Needs Attention";
}

function getDescription(name, score) {
  if (score >= 75) {
    return `Good understanding of ${name.toLowerCase()} concepts.`;
  }

  if (score >= 60) {
    return `Can apply basic ${name.toLowerCase()} concepts but needs more practice.`;
  }

  return `${name} needs additional practice and reinforcement.`;
}

function ScoreBar({ score }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#FDF0D5] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${score}%`,
          background:
            score >= 75
              ? "#003049"
              : score >= 60
              ? "#669BBC"
              : "#FFB703",
        }}
      />
    </div>
  );
}

export default function Competencies({ onNavigate }) {
  const [competencyData, setCompetencyData] = useState(
    fallbackCompetencies
  );

  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // FETCH USER-SPECIFIC COMPETENCIES
  // ------------------------------------------------------------

  useEffect(() => {
    const userId = localStorage.getItem(
      "sankhyiki_user_id"
    );

    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `http://127.0.0.1:5000/api/competencies/${userId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Competencies API failed: ${response.status}`
          );
        }

        return response.json();
      })
      .then((data) => {
        console.log(
          "User-specific competencies:",
          data
        );

        if (
          data &&
          Array.isArray(data.competencies) &&
          data.competencies.length > 0
        ) {
          const normalized =
            data.competencies.map((item) => {
              const score = Number(
                item.score ??
                item.value ??
                item.percentage ??
                0
              );

              const name =
                item.name ??
                item.competency ??
                item.skill ??
                "Competency";

              return {
                name,
                score,
                level:
                  item.level ||
                  getScoreLabel(score),

                trend:
                  item.trend ||
                  "+0%",

                description:
                  item.description ||
                  getDescription(name, score),
              };
            });

          setCompetencyData(normalized);
        } else {
          // New users may not have competency records yet.
          setCompetencyData([]);
        }
      })
      .catch((error) => {
        console.error(
          "Competencies API error:",
          error
        );

        setCompetencyData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ------------------------------------------------------------
  // CALCULATED VALUES
  // ------------------------------------------------------------

  const scores = competencyData.map(
    (item) => Number(item.score) || 0
  );

  const overallScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (sum, score) => sum + score,
            0
          ) / scores.length
        )
      : 0;

  const strongCount =
    competencyData.filter(
      (item) => Number(item.score) >= 75
    ).length;

  const improvingCount =
    competencyData.filter(
      (item) =>
        Number(item.score) >= 60 &&
        Number(item.score) < 75
    ).length;

  const target = 72;

  const gapToTarget = Math.max(
    target - overallScore,
    0
  );

  const biggestOpportunity =
    competencyData.length > 0
      ? competencyData.reduce(
          (lowest, current) =>
            Number(current.score) <
            Number(lowest.score)
              ? current
              : lowest,
          competencyData[0]
        )
      : {
          name: "Data Interpretation",
          score: 0,
        };

  const improvement =
    competencyData.length > 0
      ? Math.max(
          overallScore - 52,
          0
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[245px] border-r border-[#003049]/10 bg-[#003049] lg:block">

        <div className="flex h-full flex-col">

          {/* LOGO */}
          <div className="flex items-center px-6 py-7">
            <img
              src={logo}
              alt="Sankhyiki Saarthi"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* MENU */}
          <div className="px-4">
            <p className="small-serif mb-3 px-3 text-[10px] uppercase tracking-[0.22em] text-[#FDF0D5]/45">
              Learning Space
            </p>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.name === "Competencies";

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.name === "Dashboard") {
                        onNavigate("dashboard");
                      }

                      if (item.name === "Boonscrolling") {
                        onNavigate("boonscrolling");
                      }

                      if (item.name === "My Learning") {
                        onNavigate("MyLearning");
                      }

                      if (item.name === "Adaptive Quiz") {
                        onNavigate("AdaptiveQuiz");
                      }

                      if (item.name === "Notes Desk") {
                        onNavigate("NotesDesk");
                      }

                      if (item.name === "Summarize") {
                        onNavigate("Summarize");
                      }

                      if (item.name === "Competencies") {
                        onNavigate("Competencies");
                      }

                      if (item.name === "Study Materials") {
                        onNavigate("StudyMaterials");
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[#FFB703] text-[#003049]"
                        : "text-[#FDF0D5]/75 hover:bg-[#FDF0D5]/10 hover:text-[#FDF0D5]"
                    }`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={
                        active ? 2.5 : 1.8
                      }
                    />

                    <span className="small-serif text-[13px]">
                      {item.name}
                    </span>

                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#003049]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI BOX */}
          <div className="mt-auto p-4">

            <div className="rounded-2xl border border-[#FFB703]/20 bg-[#FDF0D5]/8 p-4">

              <div className="mb-3 flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB703]">
                  <Sparkles size={15} />
                </div>

                <div>
                  <p className="font-semibold text-sm text-[#FDF0D5]">
                    AI Learning Guide
                  </p>

                  <p className="small-serif text-[10px] text-[#FDF0D5]/50">
                    Your next step is ready
                  </p>
                </div>

              </div>

              <p className="small-serif text-xs leading-5 text-[#FDF0D5]/65">
                Focus on{" "}
                {biggestOpportunity.name} to move
                your competency score closer to your
                target.
              </p>

              <button
                onClick={() => onNavigate("AdaptiveQuiz")}
                className="mt-3 flex w-full items-center justify-between rounded-lg bg-[#FFB703] px-3 py-2 text-xs font-semibold text-[#003049]"
              >
                Practice now
                <ArrowUpRight size={14} />
              </button>

            </div>

          </div>

          {/* PROFILE */}
          <div className="border-t border-[#FDF0D5]/10 p-4">

            <button
              onClick={() => onNavigate("Profile")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#FDF0D5]/75 transition hover:bg-[#FDF0D5]/10 hover:text-[#FDF0D5]"
            >
              <User size={17} strokeWidth={1.8} />

              <span className="small-serif text-[13px]">
                Profile
              </span>
            </button>

          </div>

        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:ml-[245px]">

        {/* TOP BAR */}
        <header className="flex h-[76px] items-center justify-between border-b border-[#003049]/10 bg-[#FDF0D0]/90 px-6 backdrop-blur-md md:px-10">

          <div>
            <p className="small-serif text-xs text-[#003049]/50">
              Sankhyiki Saarthi / Learning Intelligence
            </p>

            <h1 className="font-mogilte mt-1 text-2xl">
              Competencies
            </h1>
          </div>

          {/* ONLY PFP */}
          <button
            onClick={() => onNavigate("Profile")}
            aria-label="Open Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003049] text-[#FDF0D5] transition hover:scale-105"
          >
            <User size={18} />
          </button>

        </header>

        <div className="px-5 py-7 md:px-10 md:py-9">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-[28px] bg-[#003049] p-7 text-[#FDF0D5] md:p-9">

            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#FFB703]/15 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.5fr_0.8fr] lg:items-center">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB703]/30 bg-[#FFB703]/10 px-3 py-1.5">

                  <Brain
                    size={14}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-[11px] text-[#FFB703]">
                    AI-powered competency map
                  </span>

                </div>

                <h2 className="font-mogilte max-w-2xl text-4xl leading-[1.05] md:text-5xl">
                  Understand what you know.
                  <br />

                  <span className="text-[#FFB703]">
                    Discover what to learn next.
                  </span>
                </h2>

                <p className="clean-sans mt-5 max-w-2xl text-sm leading-6 text-[#FDF0D5]/65">
                  Your competency profile is continuously
                  updated using quiz performance, learning
                  activity and practice behaviour.
                </p>

              </div>

              {/* OVERALL SCORE */}
              <div className="flex justify-center lg:justify-end">

                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-[#FFB703]/20">

                  <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#FFB703] border-r-[#FFB703] rotate-[-25deg]" />

                  <div className="text-center">

                    <p className="font-mogilte text-5xl text-[#FFB703]">
                      {overallScore}
                    </p>

                    <p className="small-serif text-[11px] text-[#FDF0D5]/55">
                      overall competency
                    </p>

                  </div>

                </div>

              </div>

            </div>
          </section>

          {/* SUMMARY CARDS */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-[#003049]/10 bg-white/50 p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003049] text-[#FDF0D5]">
                  <TrendingUp size={18} />
                </div>

                <span className="small-serif text-[11px] text-[#003049]/45">
                  {improvement > 0
                    ? `+${improvement}%`
                    : "Current profile"}
                </span>

              </div>

              <p className="font-mogilte mt-5 text-3xl">
                {overallScore}%
              </p>

              <p className="small-serif mt-1 text-xs text-[#003049]/55">
                Overall competency
              </p>

            </div>

            <div className="rounded-2xl border border-[#003049]/10 bg-white/50 p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB703]">
                  <CheckCircle2 size={18} />
                </div>

                <span className="small-serif text-[11px] text-[#003049]/45">
                  {improvingCount} improving
                </span>

              </div>

              <p className="font-mogilte mt-5 text-3xl">
                {strongCount}
              </p>

              <p className="small-serif mt-1 text-xs text-[#003049]/55">
                Strong competencies
              </p>

            </div>

            <div className="rounded-2xl border border-[#003049]/10 bg-white/50 p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#669BBC]/20 text-[#003049]">
                  <Target size={18} />
                </div>

                <span className="small-serif text-[11px] text-[#003049]/45">
                  Target: {target}%
                </span>

              </div>

              <p className="font-mogilte mt-5 text-3xl">
                {gapToTarget}%
              </p>

              <p className="small-serif mt-1 text-xs text-[#003049]/55">
                Gap to target
              </p>

            </div>

          </section>

          {/* COMPETENCY MAP */}
          <section className="mt-8">

            <div className="mb-5 flex items-end justify-between">

              <div>

                <p className="small-serif text-xs uppercase tracking-[0.16em] text-[#003049]/45">
                  Competency map
                </p>

                <h3 className="font-mogilte mt-1 text-3xl">
                  Your statistical skills
                </h3>

              </div>

              <span className="small-serif hidden text-xs text-[#003049]/45 md:block">
                Updated after your latest activity
              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {competencyData.map((item) => (
                <div
                  key={item.name}
                  className="group rounded-2xl border border-[#003049]/10 bg-white/55 p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#003049]/5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h4 className="font-semibold text-[15px]">
                        {item.name}
                      </h4>

                      <p className="small-serif mt-1 text-[11px] text-[#003049]/45">
                        {item.level}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-mogilte text-2xl">
                        {item.score}
                      </p>

                      <span className="small-serif text-[10px] text-[#003049]/45">
                        / 100
                      </span>

                    </div>

                  </div>

                  <div className="mt-5">
                    <ScoreBar score={item.score} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">

                    <p className="small-serif max-w-[75%] text-[11px] leading-5 text-[#003049]/50">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-1 text-[#003049]">

                      <TrendingUp size={13} />

                      <span className="small-serif text-[10px]">
                        {item.trend}
                      </span>

                    </div>

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* AI GAP ANALYSIS */}
          <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">

            {/* GAP */}
            <div className="rounded-[24px] border border-[#003049]/10 bg-white/55 p-6">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB703]">
                      <Sparkles size={16} />
                    </div>

                    <span className="small-serif text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                      AI insight
                    </span>

                  </div>

                  <h3 className="font-mogilte mt-4 text-2xl">
                    Your biggest opportunity
                  </h3>

                </div>

                <span className="rounded-full bg-[#FFB703]/15 px-3 py-1.5 small-serif text-[10px] text-[#003049]">
                  {biggestOpportunity.score} / 100
                </span>

              </div>

              <p className="clean-sans mt-4 text-sm leading-6 text-[#003049]/60">

                Your current competency map suggests that
                <strong className="text-[#003049]">
                  {" "}{biggestOpportunity.name}
                </strong>{" "}
                needs the most attention. Strengthening
                this area could improve your overall
                statistical competency.

              </p>

              <div className="mt-5 rounded-xl bg-[#FDF0D5] p-4">

                <div className="flex items-center gap-3">

                  <AlertCircle
                    size={17}
                    className="text-[#FFB703]"
                  />

                  <div>

                    <p className="font-semibold text-sm">
                      Recommended focus
                    </p>

                    <p className="small-serif mt-1 text-[11px] text-[#003049]/50">
                      {biggestOpportunity.name} fundamentals
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={() => onNavigate("AdaptiveQuiz")}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[#003049] px-5 py-3 text-sm font-semibold text-[#FDF0D5] transition hover:bg-[#003049]/90"
              >
                Practice this competency
                <ChevronRight size={16} />
              </button>

            </div>

            {/* NEXT STEP */}
            <div className="rounded-[24px] bg-[#003049] p-6 text-[#FDF0D5]">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB703] text-[#003049]">
                <Target size={18} />
              </div>

              <p className="small-serif mt-5 text-xs uppercase tracking-[0.14em] text-[#FDF0D5]/45">
                Suggested next step
              </p>

              <h3 className="font-mogilte mt-2 text-3xl">
                Improve your{" "}
                {biggestOpportunity.name.toLowerCase()}.
              </h3>

              <p className="small-serif mt-4 text-xs leading-5 text-[#FDF0D5]/55">
                Take a short adaptive quiz and let
                Sankhyiki Saarthi determine the right
                difficulty for you.
              </p>

              <div className="mt-6 space-y-3">

                <div className="flex items-center gap-3 rounded-xl bg-[#FDF0D5]/8 p-3">

                  <Clock3
                    size={15}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-xs text-[#FDF0D5]/65">
                    Approximately 8 minutes
                  </span>

                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[#FDF0D5]/8 p-3">

                  <Brain
                    size={15}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-xs text-[#FDF0D5]/65">
                    Difficulty adapts to your answers
                  </span>

                </div>

              </div>

              <button
                onClick={() => onNavigate("AdaptiveQuiz")}
                className="mt-6 flex w-full items-center justify-between rounded-xl bg-[#FFB703] px-4 py-3 text-sm font-semibold text-[#003049]"
              >
                Start Adaptive Quiz
                <ArrowUpRight size={16} />
              </button>

            </div>

          </section>

          {/* LEARNING PROGRESS */}
          <section className="mt-8 rounded-[24px] border border-[#003049]/10 bg-white/55 p-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <p className="small-serif text-xs uppercase tracking-[0.15em] text-[#003049]/45">
                  Competency journey
                </p>

                <h3 className="font-mogilte mt-1 text-2xl">
                  From 52% to {overallScore}%
                </h3>

                <p className="small-serif mt-1 text-xs text-[#003049]/50">
                  Your competency has improved through
                  recent learning activity.
                </p>

              </div>

              <div className="rounded-xl bg-[#FFB703]/15 px-4 py-3 text-center">

                <p className="font-mogilte text-2xl">
                  +{improvement}%
                </p>

                <p className="small-serif text-[10px] text-[#003049]/50">
                  improvement
                </p>

              </div>

            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#FDF0D5]">

              <div
                className="h-full rounded-full"
                style={{
                  width: `${overallScore}%`,
                  background:
                    "linear-gradient(90deg, #003049, #669BBC, #FFB703)",
                }}
              />

            </div>

            <div className="mt-2 flex justify-between">

              <span className="small-serif text-[10px] text-[#003049]/40">
                Starting point · 52%
              </span>

              <span className="small-serif text-[10px] text-[#003049]/40">
                Target · {target}%
              </span>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}