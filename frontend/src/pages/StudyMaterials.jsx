import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  Sparkles,
  Target,
  Library,
  Clock,
  ExternalLink,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

import logo from "../assets/logo.png";


// ============================================================
// ACTUAL iGOT COURSE URLS
// ============================================================

const COURSE_URLS = {
  "Microsoft Excel for Beginners":
    "https://portal.igotkarmayogi.gov.in/app/toc/do_1136364937253437441916/overview",

  "Data Driven Decision Making for Government":
    "https://portal.igotkarmayogi.gov.in/app/toc/do_1137349858229288961285/overview",

  "Design Thinking":
    "https://portal.igotkarmayogi.gov.in/app/toc/do_113858103759618048193/overview",
};


// ============================================================
// FALLBACK COURSES
// ============================================================

const fallbackCourses = [
  {
    title: "Microsoft Excel for Beginners",
    provider: "iGOT Karmayogi",
    duration: "7h 4m",
    progress: 68,
    category: "Data & Analytics",
    description:
      "Continue learning Excel fundamentals for data handling, analysis and visualization.",
    url:
      COURSE_URLS["Microsoft Excel for Beginners"],
  },

  {
    title: "Data Driven Decision Making for Government",
    provider: "iGOT Karmayogi",
    duration: "2h 30m",
    progress: 42,
    category: "Data & Analytics",
    description:
      "Learn how data can support evidence-based decision making in government.",
    url:
      COURSE_URLS[
        "Data Driven Decision Making for Government"
      ],
  },

  {
    title: "Design Thinking",
    provider: "iGOT Karmayogi",
    duration: "1h 55m",
    progress: 25,
    category: "Innovation",
    description:
      "Explore design thinking methods for understanding problems and developing solutions.",
    url:
      COURSE_URLS["Design Thinking"],
  },
];


// ============================================================
// HELPER — GET ACTUAL COURSE URL
// ============================================================

function getCourseUrl(item) {

  const title = (
    item?.title ||
    item?.course_name ||
    item?.course_title ||
    ""
  ).trim();

  const databaseUrl =
    item?.file_url ||
    item?.course_url ||
    item?.course_link ||
    item?.url ||
    item?.link ||
    "";

  // ----------------------------------------------------------
  // If database already contains an actual course page,
  // use it.
  // ----------------------------------------------------------

  if (
    databaseUrl &&
    !databaseUrl.endsWith("portal.igotkarmayogi.gov.in/") &&
    !databaseUrl.endsWith("portal.igotkarmayogi.gov.in")
  ) {
    return databaseUrl;
  }


  // ----------------------------------------------------------
  // If database contains a generic iGOT homepage,
  // automatically map the course title to its actual page.
  // ----------------------------------------------------------

  const normalizedTitle =
    title.toLowerCase();


  if (
    normalizedTitle.includes("excel")
  ) {
    return COURSE_URLS[
      "Microsoft Excel for Beginners"
    ];
  }


  if (
    normalizedTitle.includes(
      "data driven"
    ) ||
    normalizedTitle.includes(
      "decision making"
    )
  ) {
    return COURSE_URLS[
      "Data Driven Decision Making for Government"
    ];
  }


  if (
    normalizedTitle.includes(
      "design thinking"
    )
  ) {
    return COURSE_URLS[
      "Design Thinking"
    ];
  }


  // ----------------------------------------------------------
  // Unknown course → official iGOT homepage
  // ----------------------------------------------------------

  return (
    databaseUrl ||
    "https://portal.igotkarmayogi.gov.in/"
  );
}


export default function StudyMaterials({
  onNavigate,
}) {

  const [
    recentCourses,
    setRecentCourses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  const userId =
    localStorage.getItem(
      "sankhyiki_user_id"
    );


  // ============================================================
  // FETCH USER-SPECIFIC STUDY MATERIALS
  // ============================================================

  useEffect(() => {

    const fetchStudyMaterials =
      async () => {

        setLoading(true);

        try {

          if (!userId) {

            setRecentCourses([]);

            return;
          }


          const response =
            await fetch(
              `http://127.0.0.1:5000/api/study-materials?user_id=${userId}`
            );


          if (!response.ok) {

            throw new Error(
              `Study materials API failed: ${response.status}`
            );
          }


          const data =
            await response.json();


          console.log(
            "User-specific study materials:",
            data
          );


          if (data.success) {

            const materials =
              data.materials ||
              data.data ||
              data.study_materials ||
              [];


            if (
              Array.isArray(materials) &&
              materials.length > 0
            ) {

              const formattedMaterials =
                materials.map(
                  (item) => {

                    const title =
                      item.title ||
                      item.course_name ||
                      item.course_title ||
                      "Learning Material";


                    return {

                      id:
                        item.id,

                      title:
                        title,

                      provider:
                        item.provider ||
                        "iGOT Karmayogi",

                      duration:
                        item.duration ||
                        item.time ||
                        "Self paced",

                      progress:
                        Number(
                          item.progress ??
                          item.progress_percentage ??
                          item.completion ??
                          0
                        ),

                      category:
                        item.category ||
                        item.subject ||
                        "Learning",

                      description:
                        item.description ||
                        "Continue exploring this learning resource.",

                      // IMPORTANT:
                      // Automatically converts generic
                      // iGOT homepage links into actual
                      // course-specific pages.
                      url:
                        getCourseUrl(item),
                    };
                  }
                );


              console.log(
                "Formatted course URLs:",
                formattedMaterials
              );


              setRecentCourses(
                formattedMaterials
              );

            } else {

              // No materials for this user.
              setRecentCourses([]);

            }

          } else {

            setRecentCourses([]);

          }

        } catch (error) {

          console.error(
            "Study materials fetch error:",
            error
          );

          setRecentCourses([]);

        } finally {

          setLoading(false);

        }

      };


    fetchStudyMaterials();

  }, [userId]);


  // ============================================================
  // OPEN COURSE
  // ============================================================

  const openCourse = (url) => {

    const finalUrl =
      url ||
      "https://portal.igotkarmayogi.gov.in/";


    window.open(
      finalUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };


  return (

    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">


      {/* ================= SIDEBAR ================= */}

      <aside
        className="fixed left-0 top-0 z-30 h-screen w-[250px] bg-[#003049] px-5 py-6 text-white"
        style={{
          fontFamily:
            '"Times New Roman", Times, serif',
        }}
      >


        {/* LOGO */}

        <div className="mb-9 flex items-center justify-center">

          <img
            src={logo}
            alt="Sankhyiki Saarthi"
            className="h-[58px] w-auto object-contain"
          />

        </div>


        {/* NAVIGATION */}

        <nav className="space-y-2">


          <button
            onClick={() =>
              onNavigate("dashboard")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <LayoutDashboard
              size={18}
              strokeWidth={1.8}
            />
            Dashboard
          </button>


          <button
            onClick={() =>
              onNavigate("boonscrolling")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <Sparkles
              size={18}
              strokeWidth={1.8}
            />
            Boonscrolling
          </button>


          <button
            onClick={() =>
              onNavigate("MyLearning")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <GraduationCap
              size={18}
              strokeWidth={1.8}
            />
            My Learning
          </button>


          <button
            onClick={() =>
              onNavigate("AdaptiveQuiz")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <Target
              size={18}
              strokeWidth={1.8}
            />
            Adaptive Quiz
          </button>


          <button
            onClick={() =>
              onNavigate("NotesDesk")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <FileText
              size={18}
              strokeWidth={1.8}
            />
            Notes Desk
          </button>


          <button
            onClick={() =>
              onNavigate("Summarize")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <BookOpen
              size={18}
              strokeWidth={1.8}
            />
            Summarize
          </button>


          <button
            onClick={() =>
              onNavigate("Competencies")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            <Target
              size={18}
              strokeWidth={1.8}
            />
            Competencies
          </button>


          {/* ACTIVE */}

          <button
            className="flex w-full items-center gap-3 rounded-xl bg-[#FFB703] px-4 py-3 text-left text-sm font-semibold text-[#003049]"
          >
            <Library
              size={18}
              strokeWidth={1.8}
            />
            Study Materials
          </button>


        </nav>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="ml-[250px] min-h-screen px-10 py-8">


        {/* HEADER */}

        <div className="mb-10 flex items-start justify-between">


          <div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#669BBC]">
              iGOT Karmayogi
            </p>


            <h1 className="font-mogilte text-4xl font-bold">
              Study Materials
            </h1>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#003049]/60">
              Continue exploring the learning resources you have already
              visited on the iGOT Karmayogi platform.
            </p>

          </div>


          {/* RECOMMENDATIONS BUTTON */}

          <button
            onClick={() =>
              onNavigate("Recommendations")
            }
            className="group flex items-center gap-3 rounded-2xl bg-[#FFB703] px-5 py-3.5 text-sm font-bold text-[#003049] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <span>
              Recommendations
            </span>

            <ArrowRight
              size={18}
              className="transition group-hover:translate-x-1"
            />

          </button>

        </div>


        {/* CONTINUE LEARNING BANNER */}

        <div className="mb-9 rounded-3xl border border-[#FFB703]/40 bg-gradient-to-r from-[#FFB703]/25 via-[#FDF0D5] to-[#669BBC]/10 p-7">

          <div className="flex items-center justify-between gap-6">


            <div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#003049]/55">
                Your Learning Shelf
              </p>


              <h2 className="font-mogilte text-2xl font-bold">
                Continue where you left off
              </h2>


              <p className="mt-2 max-w-xl text-sm leading-6 text-[#003049]/60">
                These are learning resources you have previously explored.
                Continue your learning directly on iGOT Karmayogi.
              </p>

            </div>


            <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/60 md:flex">

              <BookOpen size={34} />

            </div>

          </div>

        </div>


        {/* SECTION TITLE */}

        <div className="mb-5">

          <h2 className="font-mogilte text-xl font-bold">
            Recently Visited
          </h2>

          <p className="mt-1 text-xs text-[#003049]/50">
            Your recently accessed learning resources
          </p>

        </div>


        {/* COURSE CARDS */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">


          {loading ? (

            <>

              {fallbackCourses.map(
                (course) => (

                  <div
                    key={course.title}
                    className="min-h-[350px] animate-pulse rounded-3xl border border-[#003049]/10 bg-white p-6 shadow-sm"
                  >

                    <div className="h-12 w-12 rounded-2xl bg-[#003049]/10" />

                    <div className="mt-6 h-5 w-3/4 rounded bg-[#003049]/10" />

                    <div className="mt-3 h-3 w-1/3 rounded bg-[#003049]/10" />

                    <div className="mt-6 h-16 rounded bg-[#003049]/10" />

                    <div className="mt-8 h-2 rounded bg-[#003049]/10" />

                    <div className="mt-6 h-12 rounded-xl bg-[#003049]/10" />

                  </div>

                )
              )}

            </>

          ) : recentCourses.length > 0 ? (

            recentCourses.map(
              (course, index) => (

                <div
                  key={
                    course.id ||
                    course.title ||
                    index
                  }
                  className="group flex min-h-[350px] flex-col rounded-3xl border border-[#003049]/10 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >


                  {/* TOP */}

                  <div className="mb-5 flex items-start justify-between">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFB703]/20">

                      <BookOpen size={23} />

                    </div>


                    <span className="rounded-full bg-[#669BBC]/10 px-3 py-1 text-[10px] font-bold text-[#003049]">

                      {course.category}

                    </span>

                  </div>


                  {/* COURSE TITLE */}

                  <h3 className="font-mogilte text-lg font-bold leading-6">

                    {course.title}

                  </h3>


                  <p className="mt-2 text-xs font-semibold text-[#669BBC]">

                    {course.provider}

                  </p>


                  {/* DESCRIPTION */}

                  <p className="mt-4 flex-1 text-sm leading-6 text-[#003049]/60">

                    {course.description}

                  </p>


                  {/* DURATION */}

                  <div className="mb-4 mt-5 flex items-center gap-2 text-xs text-[#003049]/55">

                    <Clock size={15} />

                    {course.duration}

                  </div>


                  {/* PROGRESS */}

                  <div className="mb-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-[11px] font-semibold text-[#003049]/55">
                        Learning progress
                      </span>


                      <span className="text-[11px] font-bold">

                        {Math.min(
                          Math.max(
                            Number(
                              course.progress
                            ) || 0,
                            0
                          ),
                          100
                        )}

                        %

                      </span>

                    </div>


                    <div className="h-2 overflow-hidden rounded-full bg-[#003049]/10">

                      <div
                        className="h-full rounded-full bg-[#FFB703]"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                course.progress
                              ) || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* GO TO COURSE */}

                  <button
                    onClick={() =>
                      openCourse(
                        course.url
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003049] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#003049]/90"
                  >

                    <PlayCircle size={17} />

                    Go to Course

                    <ExternalLink size={15} />

                  </button>

                </div>

              )
            )

          ) : (

            /* EMPTY STATE */

            <div className="col-span-1 rounded-3xl border border-[#003049]/10 bg-white p-8 shadow-sm lg:col-span-3">

              <div className="flex flex-col items-center justify-center py-12 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFB703]/20">

                  <Library size={30} />

                </div>


                <h3 className="font-mogilte mt-5 text-xl font-bold">

                  No study materials yet

                </h3>


                <p className="mt-2 max-w-md text-sm leading-6 text-[#003049]/55">

                  You have not visited or added any learning materials yet.
                  Your learning progress will appear here once you start
                  exploring study resources.

                </p>

              </div>

            </div>

          )}

        </div>


        {/* RECOMMENDATION CTA */}

        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#003049]/10 bg-white p-7 md:flex-row md:items-center">


          <div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#669BBC]">

              Need something new?

            </p>


            <h3 className="font-mogilte mt-1 text-xl font-bold">

              Discover courses selected for your learning journey

            </h3>


            <p className="mt-1 text-sm text-[#003049]/55">

              Explore recommendations based on your skills, competencies
              and learning activity.

            </p>

          </div>


          <button
            onClick={() =>
              onNavigate(
                "Recommendations"
              )
            }
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#FFB703] px-5 py-3 text-sm font-bold text-[#003049]"
          >

            View Recommendations

            <ArrowRight size={17} />

          </button>

        </div>


        {/* FOOTER */}

        <div className="mt-8 flex items-center justify-between border-t border-[#003049]/10 pt-5">

          <p className="text-xs text-[#003049]/45">

            Course content is hosted on the official iGOT Karmayogi platform.

          </p>


          <button
            onClick={() =>
              window.open(
                "https://portal.igotkarmayogi.gov.in/",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="flex items-center gap-2 text-xs font-bold text-[#003049]"
          >

            Visit iGOT Karmayogi

            <ExternalLink size={14} />

          </button>

        </div>


      </main>

    </div>

  );
}