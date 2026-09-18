import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Apple,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Calendar,
  Briefcase,
  GraduationCap,
  Target,
  Globe2,
  ArrowLeft,
} from "lucide-react";

import logo from "../assets/logo.png";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");

  // LOGIN
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // REGISTER
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    birth_date: "",
    profession: "Student",
    college: "",
    learning_goal: "Skill Development",
    language: "English",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to sign in.");
        return;
      }

      localStorage.setItem(
        "sankhyiki_logged_in",
        "true"
      );

      localStorage.setItem(
        "sankhyiki_user_email",
        data.user.email
      );

      localStorage.setItem(
        "sankhyiki_user_id",
        String(data.user.id)
      );

      localStorage.setItem(
        "sankhyiki_user_name",
        data.user.name
      );

      onLogin();

    } catch (err) {
      console.error(err);

      setError(
        "Cannot connect to the server. Make sure the backend is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !registerData.name.trim() ||
      !registerData.email.trim() ||
      !registerData.password.trim()
    ) {
      setError(
        "Please fill in your name, email and password."
      );
      return;
    }

    if (registerData.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registerData.name.trim(),
            email: registerData.email.trim(),
            password: registerData.password,
            birth_date: registerData.birth_date,
            profession: registerData.profession,
            college: registerData.college.trim(),
            learning_goal: registerData.learning_goal,
            language: registerData.language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to create your account."
        );
        return;
      }

      // Save logged-in user
      localStorage.setItem(
        "sankhyiki_logged_in",
        "true"
      );

      localStorage.setItem(
        "sankhyiki_user_email",
        data.user.email
      );

      localStorage.setItem(
        "sankhyiki_user_id",
        String(data.user.id)
      );

      localStorage.setItem(
        "sankhyiki_user_name",
        data.user.name
      );

      onLogin();

    } catch (err) {
      console.error(err);

      setError(
        "Cannot connect to the server. Make sure the backend is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SOCIAL LOGIN
  // ============================================================

  const handleSocialLogin = async (provider) => {
    setError("");

    setError(
      `${provider} login will be connected after OAuth setup. Please use email login for now.`
    );
  };

  // ============================================================
  // REGISTER SCREEN
  // ============================================================

  if (mode === "register") {
    return (
      <div className="min-h-screen bg-[#FDF0D0] text-[#003049]">

        {/* ================= TOP HALF ================= */}

        <section className="relative min-h-[32vh] overflow-hidden bg-[#003049]">

          <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#669BBC]/25 blur-3xl" />

          <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#FFB703]/12 blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(102,155,188,0.20),transparent_38%)]" />

          <div className="relative z-10 mx-auto flex min-h-[32vh] max-w-6xl flex-col items-center justify-center px-6 py-10 text-center">

            <img
              src={logo}
              alt="Sankhyiki Saarthi"
              className="mb-5 h-[70px] w-auto object-contain"
            />

            <div className="mb-3 flex items-center gap-2 text-[#FFB703]">

              <Sparkles size={16} />

              <span
                className="text-xs font-bold uppercase tracking-[0.22em]"
                style={{
                  fontFamily:
                    '"Times New Roman", Times, serif',
                }}
              >
                Start Your Journey
              </span>

            </div>

            <h1 className="font-mogilte text-4xl font-light leading-tight text-white sm:text-5xl">
              Build your learning
              <br />
              journey.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Tell Sankhyiki Saarthi a little about yourself so
              your learning experience can be personalized.
            </p>

          </div>
        </section>

        {/* ================= REGISTER FORM ================= */}

        <section className="min-h-[68vh] bg-[#FDF0D0] px-6 py-10 sm:px-10">

          <div className="mx-auto w-full max-w-2xl">

            {/* BACK */}

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#669BBC] hover:underline"
            >
              <ArrowLeft size={15} />
              Back to Sign In
            </button>

            {/* HEADING */}

            <div className="mb-7">

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#669BBC]">
                New learner
              </p>

              <h2 className="font-mogilte text-3xl font-light sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-[#003049]/55">
                Your answers will help personalize your learning journey.
              </p>

            </div>

            <form onSubmit={handleRegister}>

              {/* ================= BASIC INFORMATION ================= */}

              <div className="mb-6 rounded-2xl border border-[#003049]/10 bg-white/60 p-5 sm:p-6">

                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
                  <User size={17} />
                  About you
                </h3>

                {/* NAME */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Full name
                  </label>

                  <div className="relative">

                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <input
                      type="text"
                      name="name"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    />

                  </div>

                </div>

                {/* EMAIL */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Email address
                  </label>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <input
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <input
                      type={
                        showRegisterPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(
                          !showRegisterPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#003049]/40 hover:text-[#003049]"
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                {/* DOB */}

                <div>

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Date of birth
                  </label>

                  <div className="relative">

                    <Calendar
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <input
                      type="date"
                      name="birth_date"
                      value={registerData.birth_date}
                      onChange={handleRegisterChange}
                      className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    />

                  </div>

                </div>

              </div>

              {/* ================= LEARNING PROFILE ================= */}

              <div className="mb-6 rounded-2xl border border-[#003049]/10 bg-white/60 p-5 sm:p-6">

                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
                  <GraduationCap size={17} />
                  Learning profile
                </h3>

                {/* PROFESSION */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Profession
                  </label>

                  <div className="relative">

                    <Briefcase
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <select
                      name="profession"
                      value={registerData.profession}
                      onChange={handleRegisterChange}
                      className="w-full appearance-none rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    >
                      <option>Student</option>
                      <option>Working Professional</option>
                      <option>Government Employee</option>
                      <option>Teacher</option>
                      <option>Researcher</option>
                      <option>Other</option>
                    </select>

                  </div>

                </div>

                {/* COLLEGE */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    College / Organization
                  </label>

                  <div className="relative">

                    <GraduationCap
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <input
                      type="text"
                      name="college"
                      value={registerData.college}
                      onChange={handleRegisterChange}
                      placeholder="Your college or organization"
                      className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    />

                  </div>

                </div>

                {/* LEARNING GOAL */}

                <div className="mb-4">

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    What are you using Sankhyiki Saarthi for?
                  </label>

                  <div className="relative">

                    <Target
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <select
                      name="learning_goal"
                      value={registerData.learning_goal}
                      onChange={handleRegisterChange}
                      className="w-full appearance-none rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    >
                      <option>Skill Development</option>
                      <option>Career Growth</option>
                      <option>Government Training</option>
                      <option>Exam Preparation</option>
                      <option>Personal Learning</option>
                    </select>

                  </div>

                </div>

                {/* LANGUAGE */}

                <div>

                  <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                    Preferred learning language
                  </label>

                  <div className="relative">

                    <Globe2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                    />

                    <select
                      name="language"
                      value={registerData.language}
                      onChange={handleRegisterChange}
                      className="w-full appearance-none rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Bengali</option>
                      <option>Any Regional Language</option>
                    </select>

                  </div>

                </div>

              </div>

              {/* ERROR */}

              {error && (
                <p className="mb-4 rounded-xl bg-[#FFB703]/15 px-4 py-3 text-xs font-semibold text-[#003049]">
                  {error}
                </p>
              )}

              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003049] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#003049]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}

                {!loading && <ArrowRight size={17} />}
              </button>

            </form>

            {/* FOOTER */}

            <p
              className="mt-6 text-center text-xs leading-5 text-[#003049]/40"
              style={{
                fontFamily:
                  '"Times New Roman", Times, serif',
              }}
            >
              Sankhyiki Saarthi • Personalized Learning Intelligence
            </p>

          </div>

        </section>

      </div>
    );
  }

  // ============================================================
  // LOGIN SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FDF0D5] text-[#003049]">

      {/* ================= TOP HALF ================= */}

      <section className="relative min-h-[46vh] overflow-hidden bg-[#003049]">

        <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#669BBC]/25 blur-3xl" />

        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#FFB703]/12 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(102,155,188,0.20),transparent_38%)]" />

        <div className="relative z-10 mx-auto flex min-h-[46vh] max-w-6xl flex-col items-center justify-center px-6 py-12 text-center">

          <img
            src={logo}
            alt="Sankhyiki Saarthi"
            className="mb-7 h-[82px] w-auto object-contain"
          />

          <div className="mb-4 flex items-center gap-2 text-[#FFB703]">

            <Sparkles size={17} />

            <span
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{
                fontFamily:
                  '"Times New Roman", Times, serif',
              }}
            >
              Personalized Learning
            </span>

          </div>

          <h1 className="font-mogilte text-4xl font-light leading-tight text-white sm:text-5xl">
            Turn your learning
            <br />
            into a journey.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
            Identify your competency gaps, discover personalized learning
            paths and strengthen your skills through adaptive practice.
          </p>

        </div>
      </section>

      {/* ================= BOTTOM HALF ================= */}

      <section className="min-h-[54vh] bg-[#FDF0D5] px-6 py-10 sm:px-10">

        <div className="mx-auto w-full max-w-md">

          <div className="mb-7 text-center">

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#669BBC]">
              Welcome back
            </p>

            <h2 className="font-mogilte text-3xl font-light sm:text-4xl">
              Sign in to continue
            </h2>

            <p className="mt-2 text-sm text-[#003049]/55">
              Continue your personalized learning journey.
            </p>

          </div>

          {/* SOCIAL LOGIN */}

          <div className="space-y-3">

            <button
              onClick={() => handleSocialLogin("Google")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#003049]/15 bg-white px-5 py-3.5 text-sm font-semibold transition hover:border-[#003049]/30 hover:shadow-sm"
            >
              <span className="text-lg font-bold">
                G
              </span>

              Continue with Google
            </button>

            <button
              onClick={() => handleSocialLogin("Apple")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#003049]/15 bg-white px-5 py-3.5 text-sm font-semibold transition hover:border-[#003049]/30 hover:shadow-sm"
            >
              <Apple size={19} />

              Continue with Apple
            </button>

          </div>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-4">

            <div className="h-px flex-1 bg-[#003049]/10" />

            <span className="text-xs text-[#003049]/40">
              OR
            </span>

            <div className="h-px flex-1 bg-[#003049]/10" />

          </div>

          {/* LOGIN FORM */}

          <form onSubmit={handleEmailLogin}>

            <div className="mb-4">

              <label className="mb-2 block text-xs font-bold text-[#003049]/70">
                Email address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                />

              </div>

            </div>

            <div className="mb-3">

              <div className="mb-2 flex items-center justify-between">

                <label className="text-xs font-bold text-[#003049]/70">
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-[#669BBC] hover:underline"
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003049]/35"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#003049]/15 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-[#003049]/30 focus:border-[#669BBC] focus:ring-2 focus:ring-[#669BBC]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#003049]/40 hover:text-[#003049]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-[#FFB703]/15 px-4 py-3 text-xs font-semibold text-[#003049]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#003049] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#003049]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}

              {!loading && (
                <ArrowRight size={17} />
              )}
            </button>

          </form>

          {/* NEW USER */}

          <div className="mt-7 text-center">

            <p className="text-sm text-[#003049]/50">
              New to Sankhyiki Saarthi?
            </p>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className="mt-1 text-sm font-bold text-[#669BBC] hover:underline"
            >
              Create your account
            </button>

          </div>

          {/* FOOTER */}

          <p
            className="mt-6 text-center text-xs leading-5 text-[#003049]/40"
            style={{
              fontFamily:
                '"Times New Roman", Times, serif',
            }}
          >
            Sankhyiki Saarthi • Personalized Learning Intelligence
          </p>

        </div>

      </section>

    </div>
  );
}