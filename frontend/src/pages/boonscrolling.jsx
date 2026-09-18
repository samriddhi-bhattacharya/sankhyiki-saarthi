import { useEffect, useMemo, useState } from "react";

import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Play,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  BookOpen,
  FileText,
  UserCircle,
  User,
} from "lucide-react";

import logo from "../assets/logo.png";

const API = "http://127.0.0.1:5000";

const fallbackPosts = [
  {
    id: "demo-1",
    category: "STATISTICS BASICS",
    difficulty: "Beginner",
    title: "Mean, Median & Mode — what's the difference?",
    description:
      "Three simple ways to understand the central tendency of a dataset and when each one is most useful.",
    fact:
      "The median is often better than the mean when your data contains extreme values.",
    progress: 72,
    topic: "Descriptive Statistics",
    type: "Concept",
    subject: "Statistics",
    liked: false,
    bookmarked: false,
  },
  {
    id: "demo-2",
    category: "DATA INSIGHT",
    difficulty: "Intermediate",
    title: "Can averages be misleading?",
    description:
      "A single average can hide important patterns. Learn how statisticians look beyond the mean.",
    fact:
      "Two datasets can have the same mean but completely different distributions.",
    progress: 48,
    topic: "Data Interpretation",
    type: "Insight",
    subject: "Statistics",
    liked: false,
    bookmarked: false,
  },
  {
    id: "demo-3",
    category: "QUICK LEARN",
    difficulty: "Beginner",
    title: "What does standard deviation actually tell you?",
    description:
      "Understand how spread helps us interpret whether observations are close to or far from the average.",
    fact:
      "A smaller standard deviation means the observations are more tightly clustered around the mean.",
    progress: 31,
    topic: "Probability & Statistics",
    type: "Concept",
    subject: "Statistics",
    liked: false,
    bookmarked: false,
  },
];

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

      <span className="small-serif text-[14px]">
        {label}
      </span>
    </button>
  );
}

function ContentCard({
  post,
  index,
  total,
  onLike,
  onBookmark,
  onShare,
  onTest,
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[#003049]/10 bg-white shadow-[0_12px_40px_rgba(0,48,73,0.08)]">

      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[#003049]/8 px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003049] text-[#FFB703]">
            <BarChart3 size={19} />
          </div>

          <div>

            <p className="small-serif text-[11px] tracking-[0.16em] text-[#669BBC]">
              SANKHYIKI SAARTHI
            </p>

            <p className="small-serif text-[12px] text-[#003049]/55">
              Personalized learning
            </p>

          </div>

        </div>

        <button className="rounded-full border border-[#003049]/10 px-3 py-1.5 small-serif text-[11px] text-[#003049]/65">
          {post.difficulty}
        </button>

      </div>

      {/* Learning visual */}
      <div className="relative mx-6 mt-6 overflow-hidden rounded-[22px] bg-[#003049] p-7">

        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#FFB703]/15 blur-2xl" />

        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#669BBC]/20 blur-2xl" />

        <div className="relative">

          <div className="mb-7 flex items-center justify-between">

            <span className="small-serif rounded-full bg-[#FFB703]/15 px-3 py-1.5 text-[11px] tracking-wide text-[#FFB703]">
              {post.category}
            </span>

            <span className="small-serif text-[11px] text-[#FDF0D5]/55">
              {index + 1} / {total}
            </span>

          </div>

          {index === 0 ? (
            <div className="grid grid-cols-3 gap-3">

              {[
                ["MEAN", "Average"],
                ["MEDIAN", "Middle"],
                ["MODE", "Most common"],
              ].map(([title, sub]) => (

                <div
                  key={title}
                  className="rounded-2xl border border-[#FDF0D5]/10 bg-[#FDF0D5]/6 p-4"
                >

                  <div className="font-mogilte text-xl text-[#FFB703]">
                    {title}
                  </div>

                  <div className="small-serif mt-1 text-[11px] text-[#FDF0D5]/55">
                    {sub}
                  </div>

                </div>

              ))}

            </div>
          ) : index === 1 ? (

            <div className="flex h-[125px] items-end gap-3 px-3">

              {[45, 75, 58, 92, 66, 82, 52, 70].map((height, i) => (

                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-[#669BBC]/55"
                  style={{ height: `${height}%` }}
                />

              ))}

            </div>

          ) : (

            <div className="flex items-center justify-center py-6">

              <div className="relative h-32 w-32 rounded-full border-[18px] border-[#669BBC]/30 border-t-[#FFB703] border-r-[#FFB703]">

                <div className="absolute inset-0 flex items-center justify-center">

                  <span className="font-mogilte text-2xl text-[#FDF0D5]">
                    σ
                  </span>

                </div>

              </div>

            </div>

          )}

        </div>
      </div>

      {/* Text */}
      <div className="px-6 pb-5 pt-6">

        <div className="mb-3 flex items-center gap-2">

          <span className="small-serif text-[11px] uppercase tracking-[0.12em] text-[#669BBC]">
            {post.type}
          </span>

          <span className="text-[#003049]/25">
            •
          </span>

          <span className="small-serif text-[11px] text-[#003049]/45">
            {post.topic}
          </span>

        </div>

        <h2 className="font-mogilte text-[29px] leading-[1.08] text-[#003049]">
          {post.title}
        </h2>

        <p className="clean-sans mt-3 text-[14px] leading-6 text-[#003049]/65">
          {post.description}
        </p>

        {/* AI insight */}
        <div className="mt-5 rounded-2xl bg-[#FDF0D5] p-4">

          <div className="flex gap-3">

            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFB703] text-[#003049]">
              <Sparkles size={15} />
            </div>

            <div>

              <p className="small-serif text-[11px] font-semibold tracking-wide text-[#003049]">
                AI INSIGHT
              </p>

              <p className="clean-sans mt-1 text-[12px] leading-5 text-[#003049]/65">
                {post.fact}
              </p>

            </div>

          </div>

        </div>

        {/* Engagement */}
        <div className="mt-5 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <button
              onClick={() => onLike(post)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#003049]/10 transition hover:bg-[#FDF0D5] ${
                post.liked
                  ? "bg-[#FFB703]/20 text-[#003049]"
                  : "text-[#003049]/60"
              }`}
            >
              <Heart
                size={18}
                fill={post.liked ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={() => onBookmark(post)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#003049]/10 transition hover:bg-[#FDF0D5] ${
                post.bookmarked
                  ? "bg-[#FFB703]/20 text-[#003049]"
                  : "text-[#003049]/60"
              }`}
            >
              <Bookmark
                size={18}
                fill={post.bookmarked ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={() => onShare(post)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#003049]/10 text-[#003049]/60 transition hover:bg-[#FDF0D5]"
            >
              <Share2 size={17} />
            </button>

          </div>

          <button
            onClick={() => onTest(post)}
            className="flex items-center gap-2 rounded-full bg-[#FFB703] px-5 py-2.5 text-[#003049] shadow-[0_6px_18px_rgba(255,183,3,0.22)] transition hover:-translate-y-0.5"
          >

            <Play size={15} fill="currentColor" />

            <span className="small-serif text-[12px] font-semibold">
              Test yourself
            </span>

          </button>

        </div>

      </div>

      {/* Personalization */}
      <div className="border-t border-[#003049]/8 bg-[#003049]/[0.025] px-6 py-4">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <Target size={15} className="text-[#669BBC]" />

            <span className="small-serif text-[11px] text-[#003049]/60">
              Recommended based on your learning activity
            </span>

          </div>

          <span className="small-serif whitespace-nowrap text-[11px] text-[#003049]/45">
            {post.progress}% match
          </span>

        </div>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#003049]/8">

          <div
            className="h-full rounded-full bg-[#FFB703]"
            style={{ width: `${post.progress}%` }}
          />

        </div>

      </div>

    </article>
  );
}

export default function Boonscrolling({ onNavigate }) {

  const [posts, setPosts] = useState(fallbackPosts);

  const [selectedTopic, setSelectedTopic] =
    useState("All topics");

  const [topicsOpen, setTopicsOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const userId =
    localStorage.getItem(
      "sankhyiki_user_id"
    );

  // =======================================================
  // LOAD USER INTERACTIONS
  // =======================================================

  const loadInteractions = async (
    backendPosts
  ) => {

    if (!userId) {
      return {};
    }

    try {

      const response =
        await fetch(
          `${API}/api/boonscrolling/interactions/${userId}`
        );

      if (!response.ok) {
        return {};
      }

      const data =
        await response.json();

      const interactionMap = {};

      if (
        data.success &&
        Array.isArray(
          data.interactions
        )
      ) {

        data.interactions.forEach(
          (interaction) => {

            interactionMap[
              String(interaction.post_id)
            ] = interaction;

          }
        );

      }

      return interactionMap;

    } catch (error) {

      console.error(
        "Could not load interactions:",
        error
      );

      return {};

    }

  };


  // =======================================================
  // FORMAT POSTS
  // =======================================================

  const formatPosts = (
    backendPosts,
    interactionMap
  ) => {

    return backendPosts.map(
      (post, index) => {

        const fallback =
          fallbackPosts[
            index %
              fallbackPosts.length
          ];

        let difficulty =
          post.difficulty ||
          fallback.difficulty;

        let fact =
          post.fact ||
          fallback.fact;

        /*
         * AI posts can store:
         *
         * Sankhyiki Saarthi AI|difficulty|fact
         */

        if (
          post.source &&
          post.source.startsWith(
            "Sankhyiki Saarthi AI|"
          )
        ) {

          const parts =
            post.source.split("|");

          if (parts[1]) {
            difficulty =
              parts[1];
          }

          if (parts[2]) {
            fact =
              parts
                .slice(2)
                .join("|");
          }

        }

        const interaction =
          interactionMap[
            String(post.id)
          ];

        return {

          ...post,

          category:
            post.category ||
            fallback.category,

          difficulty,

          title:
            post.title ||
            fallback.title,

          description:
            post.description ||
            fallback.description,

          fact,

          progress:
            typeof post.progress ===
            "number"
              ? post.progress
              : fallback.progress,

          topic:
            post.topic ||
            post.subject ||
            fallback.topic,

          type:
            post.type ||
            post.content_type ||
            fallback.type,

          subject:
            post.subject ||
            fallback.subject,

          liked:
            interaction
              ? Boolean(
                  interaction.liked
                )
              : Boolean(
                  post.liked
                ),

          bookmarked:
            interaction
              ? Boolean(
                  interaction.bookmarked
                )
              : Boolean(
                  post.bookmarked
                ),

        };

      }
    );

  };


  // =======================================================
  // LOAD POSTS
  // =======================================================

  useEffect(() => {

    let mounted = true;

    const loadData = async () => {

      setLoading(true);

      try {

        let backendPosts = [];

        /*
         * IMPORTANT:
         *
         * Earlier code generated AI posts only when
         * database was empty.
         *
         * Now we generate fresh AI content whenever
         * Boonscrolling is opened/refreshed.
         */

        try {

          const generateResponse =
            await fetch(
              `${API}/api/boonscrolling/generate`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  user_id:
                    userId
                      ? Number(userId)
                      : null,
                }),
              }
            );

          const generateData =
            await generateResponse.json();

          if (
            generateData.success &&
            Array.isArray(
              generateData.posts
            ) &&
            generateData.posts.length > 0
          ) {

            backendPosts =
              generateData.posts;

          }

        } catch (generateError) {

          console.error(
            "AI generation failed:",
            generateError
          );

        }


        /*
         * If generation did not return posts,
         * load existing posts from database.
         */

        if (
          backendPosts.length === 0
        ) {

         const response =
  await fetch(
    `${API}/api/boonscrolling?user_id=${userId}`
  );

          if (!response.ok) {
            throw new Error(
              "Failed to fetch posts"
            );
          }

          const data =
            await response.json();

          backendPosts =
            Array.isArray(
              data.posts
            )
              ? data.posts
              : [];

        }


        /*
         * If backend has absolutely nothing,
         * use demo content.
         */

        if (
          backendPosts.length === 0
        ) {

          if (mounted) {

            setPosts(
              fallbackPosts
            );

          }

          return;

        }


        // Load saved likes/bookmarks
        const interactionMap =
          await loadInteractions(
            backendPosts
          );


        if (mounted) {

          const formattedPosts =
            formatPosts(
              backendPosts,
              interactionMap
            );

          setPosts(
            formattedPosts
          );

        }

      } catch (error) {

        console.error(
          "Boonscrolling backend unavailable:",
          error
        );

        if (mounted) {

          setPosts(
            fallbackPosts
          );

        }

      } finally {

        if (mounted) {

          setLoading(false);

        }

      }

    };


    loadData();


    return () => {

      mounted = false;

    };

  }, [userId]);


  // =======================================================
  // TOPICS
  // =======================================================

  const topics = useMemo(() => {

    const topicSet =
      new Set();

    posts.forEach(
      (post) => {

        if (
          post.topic &&
          String(
            post.topic
          ).trim()
        ) {

          topicSet.add(
            String(
              post.topic
            ).trim()
          );

        }

        if (
          post.subject &&
          String(
            post.subject
          ).trim()
        ) {

          topicSet.add(
            String(
              post.subject
            ).trim()
          );

        }

      }
    );

    return [
      "All topics",
      ...Array.from(
        topicSet
      ),
    ];

  }, [posts]);


  // =======================================================
  // FILTERED POSTS
  // =======================================================

  const filteredPosts =
    useMemo(() => {

      if (
        selectedTopic ===
        "All topics"
      ) {

        return posts;

      }

      return posts.filter(
        (post) => {

          const topic =
            String(
              post.topic ||
              ""
            )
              .trim()
              .toLowerCase();

          const subject =
            String(
              post.subject ||
              ""
            )
              .trim()
              .toLowerCase();

          const selected =
            selectedTopic
              .trim()
              .toLowerCase();

          return (
            topic === selected ||
            subject === selected
          );

        }
      );

    }, [
      posts,
      selectedTopic,
    ]);


  // =======================================================
  // COMMON INTERACTION FUNCTION
  // =======================================================

  const sendInteraction =
    async (
      post,
      action
    ) => {

      if (
        !userId ||
        String(
          post.id
        ).startsWith(
          "demo-"
        )
      ) {

        return null;

      }

      try {

        const response =
          await fetch(
            `${API}/api/boonscrolling/interact`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                user_id:
                  Number(userId),

                post_id:
                  Number(post.id),

                action,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {

          console.error(
            "Interaction failed:",
            data.message
          );

          return null;

        }

        return (
          data.interaction ||
          null
        );

      } catch (error) {

        console.error(
          "Interaction error:",
          error
        );

        return null;

      }

    };


  // =======================================================
  // LIKE
  // =======================================================

  const handleLike =
    async (post) => {

      const oldLiked =
        Boolean(
          post.liked
        );

      const newLiked =
        !oldLiked;


      // Immediately update UI
      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    liked:
                      newLiked,
                  }
                : item
          )
      );


      // Demo post
      if (
        String(
          post.id
        ).startsWith(
          "demo-"
        )
      ) {

        return;

      }


      const interaction =
        await sendInteraction(
          post,
          "like"
        );


      // Backend failed -> rollback
      if (!interaction) {

        setPosts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                post.id
                  ? {
                      ...item,
                      liked:
                        oldLiked,
                    }
                  : item
            )
        );

        return;

      }


      // Sync exact backend state
      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    liked:
                      Boolean(
                        interaction.liked
                      ),
                  }
                : item
          )
      );

    };


  // =======================================================
  // BOOKMARK / SAVE
  // =======================================================

  const handleBookmark =
    async (post) => {

      const oldBookmarked =
        Boolean(
          post.bookmarked
        );

      const newBookmarked =
        !oldBookmarked;


      // Immediately update UI
      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    bookmarked:
                      newBookmarked,
                  }
                : item
          )
      );


      // Demo post
      if (
        String(
          post.id
        ).startsWith(
          "demo-"
        )
      ) {

        return;

      }


      const interaction =
        await sendInteraction(
          post,
          "bookmark"
        );


      // Backend failed -> rollback
      if (!interaction) {

        setPosts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                post.id
                  ? {
                      ...item,
                      bookmarked:
                        oldBookmarked,
                    }
                  : item
            )
        );

        return;

      }


      // Sync backend state
      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    bookmarked:
                      Boolean(
                        interaction.bookmarked
                      ),
                  }
                : item
          )
      );

    };


  // =======================================================
  // SHARE
  // =======================================================

  const handleShare =
    async (post) => {

      const shareData = {
        title:
          post.title,

        text:
          post.description,

        url:
          window.location.href,
      };


      try {

        if (
          navigator.share
        ) {

          await navigator.share(
            shareData
          );

        } else if (
          navigator.clipboard
        ) {

          await navigator.clipboard.writeText(
            `${post.title}\n\n${post.description}`
          );

          alert(
            "Learning post copied to clipboard."
          );

        }


        await sendInteraction(
          post,
          "share"
        );

      } catch (error) {

        console.log(
          "Share cancelled.",
          error
        );

      }

    };


  // =======================================================
  // TEST YOURSELF
  // =======================================================

  const handleTest =
    async (post) => {

      localStorage.setItem(
        "sankhyiki_quiz_subject",
        post.subject ||
          post.topic ||
          "Statistics"
      );

      localStorage.setItem(
        "sankhyiki_quiz_topic",
        post.topic ||
          post.subject ||
          "Statistics"
      );


      await sendInteraction(
        post,
        "tested"
      );


      onNavigate(
        "AdaptiveQuiz"
      );

    };


  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* Sidebar */}
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
              onClick={() =>
                onNavigate(
                  "dashboard"
                )
              }
            />

            <SidebarItem
              icon={Lightbulb}
              label="Boonscrolling"
              active
              onClick={() =>
                onNavigate(
                  "boonscrolling"
                )
              }
            />

            <SidebarItem
              icon={TrendingUp}
              label="My Learning"
              onClick={() =>
                onNavigate(
                  "MyLearning"
                )
              }
            />

            <SidebarItem
              icon={Target}
              label="Adaptive Quiz"
              onClick={() =>
                onNavigate(
                  "AdaptiveQuiz"
                )
              }
            />

            <SidebarItem
              icon={BarChart3}
              label="Competencies"
              onClick={() =>
                onNavigate(
                  "Competencies"
                )
              }
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
              onClick={() =>
                onNavigate(
                  "NotesDesk"
                )
              }
            />

            <SidebarItem
              icon={Sparkles}
              label="Summarize"
              onClick={() =>
                onNavigate(
                  "Summarize"
                )
              }
            />

            <SidebarItem
              icon={BookOpen}
              label="Study Materials"
              onClick={() =>
                onNavigate(
                  "StudyMaterials"
                )
              }
            />

          </nav>

        </div>

        <div className="mt-auto border-t border-[#FDF0D5]/10 p-4">

          <SidebarItem
            icon={User}
            label="Profile"
            onClick={() =>
              onNavigate(
                "Profile"
              )
            }
          />

        </div>

      </aside>


      {/* Main */}
      <main className="ml-[255px] min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#003049]/8 bg-[#FDF0D0]/95 px-10 backdrop-blur">

          <div>

            <p className="small-serif text-[11px] uppercase tracking-[0.18em] text-[#669BBC]">
              Your knowledge feed
            </p>

            <h1 className="font-mogilte mt-0.5 text-2xl text-[#003049]">
              Boonscrolling
            </h1>

          </div>

          <button
            onClick={() =>
              onNavigate(
                "Profile"
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#003049]/10 bg-white transition hover:bg-[#FDF0D5]"
            aria-label="Profile"
          >

            <UserCircle size={23} />

          </button>

        </header>


        <div className="mx-auto max-w-[1080px] px-10 py-9">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-[30px] bg-[#003049] px-8 py-8 shadow-[0_16px_45px_rgba(0,48,73,0.14)]">

            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#FFB703]/15 blur-3xl" />

            <div className="relative flex items-center justify-between gap-8">

              <div className="max-w-[650px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFB703]/12 px-3 py-1.5">

                  <Sparkles
                    size={13}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-[11px] text-[#FFB703]">
                    AI-PERSONALIZED
                  </span>

                </div>

                <h2 className="font-mogilte text-[42px] leading-[1.05] text-[#FDF0D5]">

                  Scroll less.
                  <br />

                  <span className="text-[#FFB703]">
                    Learn more.
                  </span>

                </h2>

                <p className="clean-sans mt-4 max-w-[560px] text-[14px] leading-6 text-[#FDF0D5]/65">
                  Your feed learns what you need to know. Every scroll is
                  designed to strengthen your skills, build competencies and
                  make learning feel effortless.
                </p>

              </div>

              <div className="hidden min-w-[190px] rounded-[24px] border border-[#FDF0D5]/10 bg-[#FDF0D5]/5 p-5 lg:block">

                <p className="small-serif text-[10px] uppercase tracking-[0.16em] text-[#669BBC]">
                  Today's learning
                </p>

                <div className="mt-4 flex items-end gap-2">

                  <span className="font-mogilte text-4xl text-[#FFB703]">
                    12
                  </span>

                  <span className="small-serif mb-1 text-[11px] text-[#FDF0D5]/55">
                    min
                  </span>

                </div>

                <div className="mt-4 flex items-center gap-2">

                  <CheckCircle2
                    size={14}
                    className="text-[#FFB703]"
                  />

                  <span className="small-serif text-[11px] text-[#FDF0D5]/60">
                    3 concepts completed
                  </span>

                </div>

              </div>

            </div>

          </section>


          {/* Filters */}
          <div className="mt-8 flex items-center justify-between">

            <div>

              <h2 className="font-mogilte text-2xl">
                For you
              </h2>

              <p className="clean-sans mt-1 text-[12px] text-[#003049]/55">
                Curated from your interests, quiz performance and learning
                activity.
              </p>

            </div>


            {/* Topic selector */}
            <div className="relative">

              <button
                onClick={() =>
                  setTopicsOpen(
                    (value) =>
                      !value
                  )
                }
                className="flex items-center gap-2 rounded-full border border-[#003049]/10 bg-white px-4 py-2.5"
              >

                <span className="small-serif text-[11px]">
                  {selectedTopic}
                </span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    topicsOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>


              {topicsOpen && (

                <div className="absolute right-0 top-full z-40 mt-2 min-w-[190px] overflow-hidden rounded-2xl border border-[#003049]/10 bg-white p-1.5 shadow-[0_12px_35px_rgba(0,48,73,0.14)]">

                  {topics.map(
                    (topic) => (

                      <button
                        key={topic}
                        onClick={() => {

                          setSelectedTopic(
                            topic
                          );

                          setTopicsOpen(
                            false
                          );

                        }}
                        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left transition ${
                          selectedTopic ===
                          topic
                            ? "bg-[#FFB703]/20 text-[#003049]"
                            : "text-[#003049]/70 hover:bg-[#FDF0D5]"
                        }`}
                      >

                        <span className="small-serif text-[11px]">
                          {topic}
                        </span>

                      </button>

                    )
                  )}

                </div>

              )}

            </div>

          </div>


          {/* Feed */}
          <div className="mt-6 space-y-7">

            {loading ? (

              <div className="rounded-[28px] border border-[#003049]/10 bg-white p-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB703]/20">

                  <Sparkles
                    size={21}
                    className="animate-pulse text-[#003049]"
                  />

                </div>

                <h3 className="font-mogilte mt-4 text-2xl">
                  Personalizing your feed...
                </h3>

                <p className="clean-sans mx-auto mt-2 max-w-[500px] text-[13px] leading-6 text-[#003049]/55">
                  Sankhyiki Saarthi is preparing fresh learning content for you.
                </p>

              </div>

            ) : filteredPosts.length > 0 ? (

              filteredPosts.map(
                (post, index) => (

                  <ContentCard
                    key={
                      post.id ||
                      post.title ||
                      index
                    }
                    post={post}
                    index={index}
                    total={
                      filteredPosts.length
                    }
                    onLike={
                      handleLike
                    }
                    onBookmark={
                      handleBookmark
                    }
                    onShare={
                      handleShare
                    }
                    onTest={
                      handleTest
                    }
                  />

                )
              )

            ) : (

              <div className="rounded-[28px] border border-[#003049]/10 bg-white p-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB703]/20 text-[#003049]">

                  <Lightbulb size={21} />

                </div>

                <h3 className="font-mogilte mt-4 text-2xl">
                  No posts for this topic yet.
                </h3>

                <p className="clean-sans mx-auto mt-2 max-w-[500px] text-[13px] leading-6 text-[#003049]/55">
                  Try another topic to continue learning.
                </p>

              </div>

            )}

          </div>


          {/* End card */}
          <div className="mt-8 rounded-[28px] border border-[#003049]/10 bg-white p-7 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB703]/20 text-[#003049]">

              <Lightbulb size={21} />

            </div>

            <h3 className="font-mogilte mt-4 text-2xl">
              Your feed keeps learning too.
            </h3>

            <p className="clean-sans mx-auto mt-2 max-w-[500px] text-[13px] leading-6 text-[#003049]/55">
              The more you learn, save, complete and interact with content,
              the better Sankhyiki Saarthi can understand your competency
              profile.
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}