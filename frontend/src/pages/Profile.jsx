import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  GraduationCap,
  Target,
  FileText,
  BookOpen,
  Library,
  UserRound,
  Camera,
  Save,
  ArrowLeft,
  LogOut,
} from "lucide-react";

import logo from "../assets/logo.png";

const API = "http://127.0.0.1:5000";

export default function Profile({ onNavigate, onLogout }) {
  const savedEmail =
    localStorage.getItem("sankhyiki_user_email") || "samriddhi@example.com";

  const userId = localStorage.getItem("sankhyiki_user_id");

  const [name, setName] = useState("Samriddhi");
  const [email, setEmail] = useState(savedEmail);
  const [birthDate, setBirthDate] = useState("");
  const [profession, setProfession] = useState("Student");
  const [college, setCollege] = useState("");
  const [usingFor, setUsingFor] = useState("Skill Development");
  const [language, setLanguage] = useState("English");
  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD PROFILE FROM BACKEND
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await fetch(
          `${API}/api/profile/${userId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        const user = data.user || {};

        setName(user.name || "");
        setEmail(user.email || savedEmail);
        setBirthDate(user.birth_date || "");
        setProfession(user.profession || "Student");
        setCollege(user.college || "");
        setUsingFor(
          user.learning_goal || "Skill Development"
        );
        setLanguage(user.language || "English");

        // Keep localStorage synchronized with backend
        if (user.name) {
          localStorage.setItem(
            "sankhyiki_user_name",
            user.name
          );

          localStorage.setItem(
            "sankhyiki_profile_name",
            user.name
          );
        }

        if (user.email) {
          localStorage.setItem(
            "sankhyiki_user_email",
            user.email
          );
        }

        localStorage.setItem(
          "sankhyiki_profile_birthdate",
          user.birth_date || ""
        );

        localStorage.setItem(
          "sankhyiki_profile_profession",
          user.profession || "Student"
        );

        localStorage.setItem(
          "sankhyiki_profile_college",
          user.college || ""
        );

        localStorage.setItem(
          "sankhyiki_profile_using_for",
          user.learning_goal || "Skill Development"
        );

        localStorage.setItem(
          "sankhyiki_profile_language",
          user.language || "English"
        );

      } catch (err) {
        console.error("Profile load error:", err);

        setError(
          err.message || "Unable to load profile"
        );

      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  // ============================================================
  // SAVE PROFILE TO BACKEND
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("User session not found. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const response = await fetch(
        `${API}/api/profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            birth_date: birthDate,
            profession,
            college,
            learning_goal: usingFor,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      const user = data.user || {};

      // Update React state from backend response
      setName(user.name || "");
      setEmail(user.email || "");
      setBirthDate(user.birth_date || "");
      setProfession(user.profession || "Student");
      setCollege(user.college || "");
      setUsingFor(
        user.learning_goal || "Skill Development"
      );
      setLanguage(user.language || "English");

      // Keep login/profile localStorage synchronized
      localStorage.setItem(
        "sankhyiki_user_name",
        user.name || ""
      );

      localStorage.setItem(
        "sankhyiki_user_email",
        user.email || ""
      );

      localStorage.setItem(
        "sankhyiki_profile_name",
        user.name || ""
      );

      localStorage.setItem(
        "sankhyiki_profile_birthdate",
        user.birth_date || ""
      );

      localStorage.setItem(
        "sankhyiki_profile_profession",
        user.profession || "Student"
      );

      localStorage.setItem(
        "sankhyiki_profile_college",
        user.college || ""
      );

      localStorage.setItem(
        "sankhyiki_profile_using_for",
        user.learning_goal || "Skill Development"
      );

      localStorage.setItem(
        "sankhyiki_profile_language",
        user.language || "English"
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);

    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        err.message || "Unable to save profile"
      );

    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      page: "dashboard",
    },
    {
      label: "Boonscrolling",
      icon: Sparkles,
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
      icon: BookOpen,
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

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* ================= SIDEBAR ================= */}
      <aside
        className="fixed left-0 top-0 z-30 flex h-screen w-[250px] flex-col bg-[#003049] px-5 py-6 text-white"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
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
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.page)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10"
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM PROFILE */}
        <div className="mt-auto border-t border-white/10 pt-4">

          <button
            onClick={() => onNavigate("Profile")}
            className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFB703] text-[#003049]">
              <UserRound size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {name}
              </p>

              <p className="truncate text-[11px] text-white/50">
                View Profile
              </p>
            </div>
          </button>

        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="ml-[250px] min-h-screen px-10 py-8">

        {/* TOP BAR */}
        <div className="mb-8 flex items-center justify-between">

          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-[#003049]/55 transition hover:text-[#003049]"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          {/* TOP RIGHT PFP */}
          <button
            onClick={() => onNavigate("Profile")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFB703] text-[#003049] shadow-sm transition hover:scale-105"
            title="Profile"
          >
            <UserRound size={20} />
          </button>

        </div>

        {/* HEADER */}
        <div className="mb-8">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#669BBC]">
            Account
          </p>

          <h1 className="font-mogilte text-4xl font-light">
            Your Profile
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#003049]/55">
            Tell Sankhyiki Saarthi a little about yourself so your learning
            experience can be personalized around your goals.
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 max-w-4xl rounded-xl bg-[#FFB703]/20 px-4 py-3 text-xs font-bold text-[#003049]">
            {error}
          </div>
        )}

        {/* ================= PROFILE CARD ================= */}
        <div className="max-w-4xl">

          {/* PROFILE HEADER CARD */}
          <div className="mb-6 rounded-3xl bg-[#003049] p-7 text-white">

            <div className="flex flex-col items-center gap-5 sm:flex-row">

              {/* PFP */}
              <div className="relative">

                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFB703] text-[#003049]">
                  <UserRound size={42} />
                </div>

                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#003049] shadow-md"
                  title="Change profile photo"
                >
                  <Camera size={15} />
                </button>

              </div>

              <div className="text-center sm:text-left">

                <h2 className="font-mogilte text-3xl font-light">
                  {name || "Your Name"}
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  {email}
                </p>

                <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#FFB703]">
                  {profession}
                </div>

              </div>

            </div>

          </div>

          {/* FORM */}
          <form onSubmit={handleSave}>

            {/* BASIC INFORMATION */}
            <section className="mb-6 rounded-3xl border border-[#003049]/10 bg-white p-7">

              <div className="mb-6">
                <h2 className="font-mogilte text-2xl font-light">
                  Basic Information
                </h2>

                <p className="mt-1 text-xs text-[#003049]/45">
                  Information used to personalize your learning journey.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-[#003049]/10 bg-[#003049]/5 px-4 py-3 text-sm text-[#003049]/45 outline-none"
                  />
                </div>

                {/* BIRTHDATE */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                    Birth Date
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                  />
                </div>

                {/* PROFESSION */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                    Profession
                  </label>

                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                  >
                    <option>Student</option>
                    <option>Working Professional</option>
                    <option>Government Employee</option>
                    <option>Teacher / Faculty</option>
                    <option>Researcher</option>
                    <option>Other</option>
                  </select>
                </div>

              </div>

              {/* COLLEGE - ONLY STUDENT */}
              {profession === "Student" && (
                <div className="mt-5">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                    College / Institution Name
                  </label>

                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter your college or institution"
                    className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                  />

                </div>
              )}

            </section>

            {/* PURPOSE */}
            <section className="mb-6 rounded-3xl border border-[#003049]/10 bg-white p-7">

              <div className="mb-6">
                <h2 className="font-mogilte text-2xl font-light">
                  Learning Preferences
                </h2>

                <p className="mt-1 text-xs text-[#003049]/45">
                  Help us understand what you want to achieve.
                </p>
              </div>

              {/* USING FOR */}
              <div className="mb-5">

                <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                  I am using Sankhyiki Saarthi for
                </label>

                <select
                  value={usingFor}
                  onChange={(e) => setUsingFor(e.target.value)}
                  className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                >
                  <option>Skill Development</option>
                  <option>Exam Preparation</option>
                  <option>Professional Growth</option>
                  <option>Learning & Upskilling</option>
                  <option>Government Training</option>
                  <option>Research & Academic Learning</option>
                  <option>Other</option>
                </select>

              </div>

              {/* LANGUAGE */}
              <div>

                <label className="mb-2 block text-xs font-bold text-[#003049]/65">
                  Preferred Learning Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-[#003049]/12 bg-[#FDF0D5]/35 px-4 py-3 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Bengali</option>
                  <option>Marathi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Kannada</option>
                  <option>Gujarati</option>
                  <option>Any Regional Language</option>
                </select>

              </div>

            </section>

            {/* SAVE */}
            <div className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">

              {saved ? (
                <p className="rounded-xl bg-[#FFB703]/20 px-4 py-3 text-xs font-bold">
                  ✓ Profile updated successfully
                </p>
              ) : (
                <p className="text-xs text-[#003049]/40">
                  Your information helps personalize recommendations,
                  competencies and learning paths.
                </p>
              )}

              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#003049] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#003049]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </form>

          {/* ACCOUNT */}
          <section className="rounded-3xl border border-[#003049]/10 bg-white p-7">

            <h2 className="font-mogilte text-2xl font-light">
              Account
            </h2>

            <p className="mt-1 text-xs text-[#003049]/45">
              Manage your Sankhyiki Saarthi session.
            </p>

            <div className="mt-5 border-t border-[#003049]/10 pt-5">

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-xl border border-[#003049]/10 px-5 py-3 text-sm font-bold text-[#003049] transition hover:bg-[#003049] hover:text-white"
              >
                <LogOut size={17} />
                Log Out
              </button>

            </div>

          </section>

        </div>

      </main>
    </div>
  );
}