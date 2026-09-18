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
  Sparkles,
  Brain,
  BookOpenCheck,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:5000";

export default function Recommendations({ onNavigate }) {
  const [recommendations, setRecommendations] = useState([]);
  const [weaknessRecommendations, setWeaknessRecommendations] =
    useState([]);

  const [summary, setSummary] = useState({
    competency_gaps: 0,
    quiz_accuracy: 0,
    learning_interests: "Data & Analytics",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // USER ID
  // ============================================================

  const getUserId = () => {
    return (
      localStorage.getItem("userId") ||
      localStorage.getItem("sankhyiki_user_id") ||
      "1"
    );
  };

  // ============================================================
  // NORMALIZE TEXT
  // ============================================================

  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  };

  // ============================================================
  // CHECK WHETHER COURSE IS ALREADY LEARNED
  // ============================================================

  const isAlreadyLearned = (course, learningItems) => {
    if (!Array.isArray(learningItems)) {
      return false;
    }

    const courseTitle = normalizeText(
      course.title
    );

    if (!courseTitle) {
      return false;
    }

    return learningItems.some((item) => {
      if (!item) return false;

      const possibleTitles = [
        item.title,
        item.course_title,
        item.courseName,
        item.name,
        item.course,
        item.learning_title,
      ];

      const matchedTitle = possibleTitles.find(
        (value) => normalizeText(value) === courseTitle
      );

      if (!matchedTitle) {
        return false;
      }

      // If backend gives explicit status, only consider
      // completed / finished courses as already learned.
      const status = normalizeText(
        item.status ||
          item.progress_status ||
          item.completion_status ||
          ""
      );

      const progressValue =
        item.progress ??
        item.progress_percentage ??
        item.completion_percentage ??
        null;

      if (
        status.includes("complete") ||
        status.includes("finished") ||
        status.includes("done")
      ) {
        return true;
      }

      if (
        typeof progressValue === "number" &&
        progressValue >= 100
      ) {
        return true;
      }

      // If no status/progress is provided but the course
      // exists in learning history, treat it as learned.
      if (
        progressValue === null &&
        !status
      ) {
        return true;
      }

      return false;
    });
  };

  // ============================================================
  // GENERATE WHY THIS COURSE IS RECOMMENDED
  // ============================================================

  const generateReason = (
    course,
    competencyGaps,
    quizAccuracy,
    interests
  ) => {
    // Backend-provided reason gets priority.
    if (
      course.reason &&
      String(course.reason).trim()
    ) {
      return String(course.reason).trim();
    }

    const title = normalizeText(course.title);
    const category = normalizeText(course.category);

    // Find weakest competency.
    const sortedGaps = [...competencyGaps].sort(
      (a, b) =>
        Number(a.score || 0) -
        Number(b.score || 0)
    );

    const weakest = sortedGaps[0];

    if (weakest) {
      const competency =
        weakest.competency || "this skill";

      const score = Number(
        weakest.score || 0
      );

      if (
        title.includes("data") ||
        category.includes("data") ||
        title.includes("analysis") ||
        category.includes("analysis")
      ) {
        return `Recommended because your ${competency} competency is currently at ${score}%. This course can help strengthen that skill.`;
      }

      if (
        title.includes("excel") ||
        category.includes("excel") ||
        title.includes("spreadsheet")
      ) {
        return `Recommended because your ${competency} competency needs improvement, and practical spreadsheet skills can support your data-handling ability.`;
      }

      if (
        title.includes("visual") ||
        category.includes("visual")
      ) {
        return `Recommended because your ${competency} competency is one of your current development areas.`;
      }

      if (
        title.includes("research") ||
        category.includes("research")
      ) {
        return `Recommended because your Research Skills need development and this learning resource can strengthen your research practice.`;
      }

      if (
        title.includes("design") ||
        category.includes("problem") ||
        category.includes("design")
      ) {
        return `Recommended because your current competency profile shows an opportunity to strengthen structured problem-solving skills.`;
      }
    }

    if (
      Number(quizAccuracy) < 50
    ) {
      return `Recommended because your current quiz accuracy is ${quizAccuracy}%. Building the concepts through this course can help improve your understanding before reassessment.`;
    }

    if (
      Array.isArray(interests) &&
      interests.length > 0
    ) {
      return `Recommended because it matches your learning interest in ${interests.join(
        ", "
      )}.`;
    }

    return "Recommended based on your current learning activity and competency profile.";
  };

  // ============================================================
  // LOAD PERSONALIZED RECOMMENDATIONS
  // ============================================================

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        const userId = getUserId();

        // --------------------------------------------------------
        // Fetch recommendations
        // --------------------------------------------------------

        const recommendationResponse =
          await fetch(
            `${API_BASE}/api/recommendations?user_id=${userId}`
          );

        const recommendationData =
          await recommendationResponse
            .json()
            .catch(() => ({}));

        console.log(
          "Recommendations API:",
          recommendationData
        );

        if (!recommendationResponse.ok) {
          throw new Error(
            recommendationData.error ||
              recommendationData.message ||
              "Recommendations could not be loaded"
          );
        }

        if (
          recommendationData.success !== true
        ) {
          throw new Error(
            recommendationData.error ||
              recommendationData.message ||
              "Recommendations could not be loaded"
          );
        }

        // --------------------------------------------------------
        // Fetch learning progress/history separately.
        //
        // This prevents courses that the student has already
        // completed from appearing as "new recommendations".
        // --------------------------------------------------------

        let learningItems = [];

        try {
          const progressResponse =
            await fetch(
              `${API_BASE}/api/learning-progress/${userId}`
            );

          if (progressResponse.ok) {
            const progressData =
              await progressResponse
                .json()
                .catch(() => ({}));

            console.log(
              "Learning Progress API:",
              progressData
            );

            if (
              Array.isArray(progressData)
            ) {
              learningItems =
                progressData;
            } else if (
              Array.isArray(
                progressData.progress
              )
            ) {
              learningItems =
                progressData.progress;
            } else if (
              Array.isArray(
                progressData.learning_progress
              )
            ) {
              learningItems =
                progressData.learning_progress;
            } else if (
              Array.isArray(
                progressData.courses
              )
            ) {
              learningItems =
                progressData.courses;
            } else if (
              Array.isArray(
                progressData.data
              )
            ) {
              learningItems =
                progressData.data;
            }
          }
        } catch (progressError) {
          // Recommendation page should still work even if
          // learning-progress endpoint is unavailable.
          console.warn(
            "Learning progress could not be loaded:",
            progressError
          );
        }

        // ========================================================
        // COMPETENCY GAPS
        // ========================================================

        const competencyGaps =
          Array.isArray(
            recommendationData.competency_gaps
          )
            ? recommendationData.competency_gaps
            : [];

        const normalizedCompetencyGaps =
          competencyGaps.map((item) => ({
            competency:
              item.competency ||
              "Unknown Competency",

            score:
              Number(item.score) || 0,
          }));

        setWeaknessRecommendations(
          normalizedCompetencyGaps
        );

        // ========================================================
        // LEARNING INTERESTS
        // ========================================================

        const interests =
          Array.isArray(
            recommendationData.learning_interests
          )
            ? recommendationData.learning_interests
            : [];

        const quizAccuracy =
          typeof recommendationData.quiz_accuracy ===
          "number"
            ? recommendationData.quiz_accuracy
            : Number(
                recommendationData.quiz_accuracy
              ) || 0;

        // ========================================================
        // COURSE RECOMMENDATIONS
        // ========================================================

        const rawCourses =
          Array.isArray(
            recommendationData.recommendations
          )
            ? recommendationData.recommendations
            : [];

        // --------------------------------------------------------
        // Remove courses already completed by user.
        // --------------------------------------------------------

        const freshCourses =
          rawCourses.filter(
            (course) =>
              !isAlreadyLearned(
                course,
                learningItems
              )
          );

        // --------------------------------------------------------
        // Prepare final recommendation objects.
        // --------------------------------------------------------

        const preparedCourses =
          freshCourses.map(
            (item, index) => {
              const course = {
                id:
                  item.id ||
                  item.course_id ||
                  index + 1,

                title:
                  item.title ||
                  item.course_title ||
                  "Recommended Learning",

                provider:
                  item.provider ||
                  "iGOT Karmayogi",

                category:
                  item.category ||
                  "Learning",

                description:
                  item.description ||
                  "Explore this learning resource to strengthen your skills.",

                reason:
                  item.reason ||
                  item.why ||
                  item.recommendation_reason ||
                  "",

                url:
                  item.url ||
                  item.link ||
                  item.course_url ||
                  "https://igotkarmayogi.gov.in/",
              };

              return {
                ...course,
                reason: generateReason(
                  course,
                  normalizedCompetencyGaps,
                  quizAccuracy,
                  interests
                ),
              };
            }
          );

        setRecommendations(
          preparedCourses
        );

        // ========================================================
        // PERSONALIZATION SUMMARY
        // ========================================================

        setSummary({
          competency_gaps:
            normalizedCompetencyGaps.length,

          quiz_accuracy:
            quizAccuracy,

          learning_interests:
            interests.length > 0
              ? interests.join(", ")
              : "Data & Analytics",
        });
      } catch (err) {
        console.error(
          "Recommendations API error:",
          err
        );

        setError(
          err.message ||
            "Recommendations could not be loaded"
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  // ============================================================
  // OPEN COURSE
  // ============================================================

  const openCourse = (url) => {
    const target =
      url && String(url).trim()
        ? url
        : "https://igotkarmayogi.gov.in/";

    window.open(
      target,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigate = (page) => {
    if (
      typeof onNavigate === "function"
    ) {
      onNavigate(page);
      return;
    }

    const routes = {
      dashboard: "/dashboard",
      boonscrolling: "/boonscrolling",
      MyLearning: "/my-learning",
      AdaptiveQuiz: "/adaptive-quiz",
      NotesDesk: "/notes-desk",
      Summarize: "/summarize",
      Competencies: "/competencies",
      StudyMaterials: "/study-materials",
      Profile: "/profile",
    };

    if (routes[page]) {
      window.location.href =
        routes[page];
    }
  };

  // ============================================================
  // COMPETENCY MESSAGE
  // ============================================================

  const getCompetencyMessage = (
    score
  ) => {
    if (score < 50) {
      return "Needs focused practice";
    }

    if (score < 65) {
      return "Keep building this skill";
    }

    return "Good progress";
  };

  // ============================================================
  // SIDEBAR ITEM
  // ============================================================

  const SidebarItem = ({
    icon: Icon,
    label,
    page,
    active = false,
  }) => (
    <button
      onClick={() =>
        handleNavigate(page)
      }
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "12px 16px",
        marginBottom: "5px",
        borderRadius: "12px",
        border: "none",
        background: active
          ? "#FFB703"
          : "transparent",
        color: active
          ? "#003049"
          : "#FDF0D5",
        fontSize: "14px",
        fontWeight: active
          ? "600"
          : "400",
        cursor: "pointer",
        textAlign: "left",
        transition:
          "all 0.2s ease",
        fontFamily:
          "Times New Roman, serif",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background =
            "rgba(255,183,3,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background =
            "transparent";
        }
      }}
    >
      <Icon
        size={18}
        strokeWidth={
          active ? 2.4 : 1.9
        }
      />

      <span>{label}</span>
    </button>
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#FDF0D5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Times New Roman, serif",
          color: "#003049",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
          }}
        >
          <RefreshCw
            size={34}
            style={{
              animation:
                "spin 1s linear infinite",
              marginBottom: "15px",
            }}
          />

          <div
            style={{
              fontFamily:
                "Mogilte, serif",
              fontSize: "22px",
              fontWeight: "600",
            }}
          >
            Loading your recommendations...
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              opacity: 0.7,
            }}
          >
            Personalizing your learning path.
          </div>

          <style>
            {`
              @keyframes spin {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FDF0D5",
        color: "#003049",
        fontFamily:
          "Times New Roman, serif",
        display: "flex",
      }}
    >
      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside
        style={{
          width: "245px",
          minWidth: "245px",
          minHeight: "100vh",
          background: "#003049",
          borderRight:
            "1px solid rgba(0,48,73,0.12)",
          padding: "25px 15px",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* LOGO ONLY */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:
              "5px 10px 25px 10px",
            minHeight: "75px",
          }}
        >
          <img
            src="/src/assets/logo.png"
            alt="Sankhyiki Saarthi"
            style={{
              width: "200px",
              height: "50px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* NAVIGATION */}

        <div
          style={{
            marginTop: "8px",
          }}
        >
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            page="dashboard"
          />

          <SidebarItem
            icon={BookOpen}
            label="Boonscrolling"
            page="boonscrolling"
          />

          <SidebarItem
            icon={GraduationCap}
            label="My Learning"
            page="MyLearning"
          />

          <SidebarItem
            icon={Brain}
            label="Adaptive Quiz"
            page="AdaptiveQuiz"
          />

          <SidebarItem
            icon={FileText}
            label="Notes Desk"
            page="NotesDesk"
          />

          <SidebarItem
            icon={Sparkles}
            label="Summarize"
            page="Summarize"
          />

          <SidebarItem
            icon={BarChart3}
            label="Competencies"
            page="Competencies"
          />

          <SidebarItem
            icon={Library}
            label="Study Materials"
            page="StudyMaterials"
          />
        </div>

        {/* PROFILE */}

        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop:
              "1px solid rgba(253,240,213,0.15)",
          }}
        >
          <SidebarItem
            icon={User}
            label="Profile"
            page="Profile"
          />
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding:
            "30px 42px 50px 42px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily:
                  "Mogilte, serif",
                fontSize: "35px",
                fontWeight: "600",
                color: "#003049",
                marginBottom: "6px",
              }}
            >
              Recommended for You
            </div>

            <div
              style={{
                fontSize: "15px",
                color: "#003049",
                opacity: 0.7,
              }}
            >
              Personalized learning recommendations
              based on your learning journey.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border:
                  "1px solid rgba(0,48,73,0.08)",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#003049",
                cursor: "pointer",
              }}
            >
              <Search size={19} />
            </button>

            <button
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border:
                  "1px solid rgba(0,48,73,0.08)",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#003049",
                cursor: "pointer",
              }}
            >
              <Bell size={19} />
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background:
                "rgba(255,183,3,0.18)",
              border:
                "1px solid rgba(255,183,3,0.5)",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Lightbulb size={20} />

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "3px",
                }}
              >
                Recommendations could not be loaded
              </div>

              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.75,
                }}
              >
                {error}
              </div>
            </div>
          </div>
        )}

        {/* PERSONALIZATION SUMMARY */}

        <section
          style={{
            marginBottom: "34px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "15px",
            }}
          >
            <Sparkles size={19} />

            <h2
              style={{
                margin: 0,
                fontFamily:
                  "Mogilte, serif",
                fontSize: "23px",
                fontWeight: "600",
              }}
            >
              Personalization Summary
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
            }}
          >
            {/* COMPETENCY GAPS */}

            <div
              style={{
                background: "#003049",
                color: "#FDF0D5",
                border:
                  "1px solid rgba(0,48,73,0.1)",
                borderRadius: "18px",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.85,
                      marginBottom: "8px",
                    }}
                  >
                    Competency Gaps
                  </div>

                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize: "30px",
                      fontWeight: "600",
                    }}
                  >
                    {summary.competency_gaps}
                  </div>
                </div>

                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#FFB703",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <Target
                    size={22}
                    color="#003049"
                  />
                </div>
              </div>
            </div>

            {/* QUIZ ACCURACY */}

            <div
              style={{
                background: "#FFFFFF",
                color: "#003049",
                border:
                  "1px solid rgba(0,48,73,0.05)",
                borderRadius: "18px",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.75,
                      marginBottom: "8px",
                    }}
                  >
                    Quiz Accuracy
                  </div>

                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize: "30px",
                      fontWeight: "600",
                    }}
                  >
                    {summary.quiz_accuracy}%
                  </div>
                </div>

                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#003049",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <Brain
                    size={22}
                    color="#FFB703"
                  />
                </div>
              </div>
            </div>

            {/* LEARNING INTERESTS */}

            <div
              style={{
                background: "#003049",
                color: "#FDF0D5",
                border:
                  "1px solid rgba(0,48,73,0.1)",
                borderRadius: "18px",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.85,
                      marginBottom: "8px",
                    }}
                  >
                    Learning Interests
                  </div>

                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize: "21px",
                      fontWeight: "600",
                      lineHeight: 1.2,
                    }}
                  >
                    {summary.learning_interests}
                  </div>
                </div>

                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "14px",
                    background: "#FFB703",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <TrendingUp
                    size={22}
                    color="#003049"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPETENCY GAP */}

        <section
          style={{
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <Target size={19} />

              <h2
                style={{
                  margin: 0,
                  fontFamily:
                    "Mogilte, serif",
                  fontSize: "23px",
                  fontWeight: "600",
                }}
              >
                Because You Have a Competency Gap
              </h2>
            </div>

            <button
              onClick={() =>
                handleNavigate(
                  "Competencies"
                )
              }
              style={{
                border: "none",
                background: "#003049",
                color: "#FDF0D5",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily:
                  "Times New Roman, serif",
                padding:
                  "14px 18px",
                borderRadius: "13px",
                fontSize: "14px",
              }}
            >
              View Competencies
              <ChevronRight size={16} />
            </button>
          </div>

          {weaknessRecommendations.length ===
          0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border:
                  "1px solid rgba(0,48,73,0.05)",
                borderRadius: "18px",
                padding: "25px",
                opacity: 0.75,
              }}
            >
              No competency gaps found yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
              }}
            >
              {weaknessRecommendations.map(
                (item) => (
                  <div
                    key={item.competency}
                    style={{
                      background: "#FFFFFF",
                      border:
                        "1px solid rgba(0,48,73,0.05)",
                      borderRadius: "18px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily:
                              "Mogilte, serif",
                            fontSize: "18px",
                            fontWeight:
                              "600",
                            marginBottom:
                              "6px",
                          }}
                        >
                          {item.competency}
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            opacity: 0.7,
                          }}
                        >
                          {getCompetencyMessage(
                            item.score
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily:
                            "Mogilte, serif",
                          fontSize: "22px",
                          fontWeight:
                            "600",
                          color:
                            "#003049",
                        }}
                      >
                        {item.score}
                      </div>
                    </div>

                    {/* PROGRESS BAR */}

                    <div
                      style={{
                        height: "8px",
                        background:
                          "rgba(255,183,3,0.18)",
                        borderRadius:
                          "20px",
                        marginTop: "18px",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            Math.max(
                              item.score,
                              0
                            ),
                            100
                          )}%`,
                          height: "100%",
                          background:
                            "#FFB703",
                          borderRadius:
                            "20px",
                          transition:
                            "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}

        <section
          style={{
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "15px",
            }}
          >
            <Lightbulb size={19} />

            <h2
              style={{
                margin: 0,
                fontFamily:
                  "Mogilte, serif",
                fontSize: "23px",
                fontWeight: "600",
              }}
            >
              Strengthen Your Learning Path
            </h2>
          </div>

          {recommendations.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border:
                  "1px solid rgba(0,48,73,0.05)",
                borderRadius: "18px",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <BookOpenCheck
                size={35}
                style={{
                  marginBottom:
                    "10px",
                }}
              />

              <div
                style={{
                  fontFamily:
                    "Mogilte, serif",
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom:
                    "5px",
                }}
              >
                No new recommendations available
              </div>

              <div
                style={{
                  fontSize: "14px",
                  opacity: 0.7,
                }}
              >
                Your current learning resources
                have already been explored. Complete
                more quizzes or learning activities to
                generate new recommendations.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(270px, 1fr))",
                gap: "18px",
              }}
            >
              {recommendations.map(
                (item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#FFFFFF",
                      color: "#003049",
                      border:
                        "1px solid rgba(0,48,73,0.05)",
                      borderRadius: "20px",
                      padding: "22px",
                      display: "flex",
                      flexDirection:
                        "column",
                      minHeight:
                        "255px",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    {/* CATEGORY */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          "15px",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          padding:
                            "6px 10px",
                          borderRadius:
                            "20px",
                          background:
                            "#FFB703",
                          fontSize: "12px",
                          fontWeight:
                            "600",
                        }}
                      >
                        {item.category}
                      </span>

                      <BookOpen size={19} />
                    </div>

                    {/* TITLE */}

                    <div
                      style={{
                        fontFamily:
                          "Mogilte, serif",
                        fontSize: "21px",
                        fontWeight:
                          "600",
                        lineHeight: 1.2,
                        marginBottom:
                          "9px",
                      }}
                    >
                      {item.title}
                    </div>

                    {/* PROVIDER */}

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight:
                          "600",
                        opacity: 0.7,
                        marginBottom:
                          "12px",
                      }}
                    >
                      {item.provider}
                    </div>

                    {/* DESCRIPTION */}

                    <div
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.5,
                        opacity: 0.8,
                        flex: 1,
                      }}
                    >
                      {item.description}
                    </div>

                    {/* WHY RECOMMENDED */}

                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "13px",
                        lineHeight: 1.45,
                        opacity: 0.78,
                      }}
                    >
                      <strong>
                        Why recommended:
                      </strong>{" "}
                      {item.reason}
                    </div>

                    {/* BUTTON */}

                    <button
                      onClick={() =>
                        openCourse(
                          item.url
                        )
                      }
                      style={{
                        marginTop:
                          "20px",
                        width: "100%",
                        padding:
                          "11px 14px",
                        borderRadius:
                          "12px",
                        border: "none",
                        background:
                          "#003049",
                        color:
                          "#FDF0D5",
                        fontFamily:
                          "Times New Roman, serif",
                        fontWeight:
                          "600",
                        cursor:
                          "pointer",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: "8px",
                      }}
                    >
                      Explore Course
                      <ExternalLink
                        size={16}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* LEARN → PRACTICE → REASSESS */}

        <section
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "15px",
            }}
          >
            <TrendingUp size={19} />

            <h2
              style={{
                margin: 0,
                fontFamily:
                  "Mogilte, serif",
                fontSize: "23px",
                fontWeight: "600",
              }}
            >
              Learn → Practice → Reassess
            </h2>
          </div>

          <div
            style={{
              background: "#003049",
              color: "#FDF0D5",
              border:
                "1px solid rgba(0,48,73,0.1)",
              borderRadius: "20px",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                alignItems:
                  "center",
              }}
            >
              {/* LEARN */}

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius:
                      "14px",
                    background:
                      "#FFB703",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen
                    size={21}
                    color="#003049"
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize:
                        "18px",
                      fontWeight:
                        "600",
                    }}
                  >
                    Learn
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      opacity:
                        0.75,
                    }}
                  >
                    Explore recommended courses
                  </div>
                </div>
              </div>

              {/* ARROW */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                }}
              >
                <ArrowRight
                  size={23}
                />
              </div>

              {/* PRACTICE */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius:
                      "14px",
                    background:
                      "#FFB703",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                  }}
                >
                  <Brain
                    size={21}
                    color="#003049"
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize:
                        "18px",
                      fontWeight:
                        "600",
                    }}
                  >
                    Practice
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      opacity:
                        0.75,
                    }}
                  >
                    Test yourself with Adaptive Quiz
                  </div>
                </div>
              </div>

              {/* ARROW */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                }}
              >
                <ArrowRight
                  size={23}
                />
              </div>

              {/* REASSESS */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius:
                      "14px",
                    background:
                      "#FFB703",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                  }}
                >
                  <BarChart3
                    size={21}
                    color="#003049"
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontFamily:
                        "Mogilte, serif",
                      fontSize:
                        "18px",
                      fontWeight:
                        "600",
                    }}
                  >
                    Reassess
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      opacity:
                        0.75,
                    }}
                  >
                    Track your competency growth
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "22px",
                paddingTop:
                  "18px",
                borderTop:
                  "1px solid rgba(253,240,213,0.15)",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "9px",
                fontSize:
                  "14px",
                opacity:
                  0.75,
              }}
            >
              <CheckCircle2
                size={17}
              />

              Your recommendations update as your
              learning progress changes.
            </div>
          </div>
        </section>

        {/* IGOT FOOTER */}

        <div
          style={{
            background: "#003049",
            color: "#FDF0D5",
            borderRadius:
              "20px",
            padding:
              "24px 27px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: "20px",
            flexWrap:
              "wrap",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius:
                  "13px",
                background:
                  "rgba(255,183,3,0.2)",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Library
                size={21}
                color="#FFB703"
              />
            </div>

            <div>
              <div
                style={{
                  fontFamily:
                    "Mogilte, serif",
                  fontSize:
                    "19px",
                  fontWeight:
                    "600",
                }}
              >
                Continue Learning on iGOT Karmayogi
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  opacity:
                    0.7,
                  marginTop:
                    "3px",
                }}
              >
                Explore more courses and strengthen
                your professional competencies.
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              openCourse(
                "https://igotkarmayogi.gov.in/"
              )
            }
            style={{
              padding:
                "11px 17px",
              borderRadius:
                "12px",
              border: "none",
              background:
                "#FFB703",
              color:
                "#003049",
              fontFamily:
                "Times New Roman, serif",
              fontWeight:
                "600",
              cursor:
                "pointer",
              display:
                "flex",
              alignItems:
                "center",
              gap: "7px",
            }}
          >
            Visit iGOT
            <ExternalLink
              size={16}
            />
          </button>
        </div>
      </main>
    </div>
  );
}