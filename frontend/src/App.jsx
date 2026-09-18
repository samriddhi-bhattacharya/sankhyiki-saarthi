import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/dashboard";
import Boonscrolling from "./pages/boonscrolling";
import MyLearning from "./pages/MyLearning";
import NotesDesk from "./pages/NotesDesk";
import Summarize from "./pages/Summarize";
import AdaptiveQuiz from "./pages/AdaptiveQuiz";
import Competencies from "./pages/Competencies";
import StudyMaterials from "./pages/StudyMaterials";
import Recommendations from "./pages/Recommendations";
import Profile from "./pages/Profile";

function App() {
  // Login tabhi maana jayega jab login flag + user ID dono available ho
  const [loggedIn, setLoggedIn] = useState(() => {
    const isLoggedIn =
      localStorage.getItem("sankhyiki_logged_in") === "true";

    const userId = localStorage.getItem("sankhyiki_user_id");

    return isLoggedIn && !!userId;
  });

  const [page, setPage] = useState("dashboard");

  // LOGIN
  const handleLogin = () => {
    // Login.jsx already localStorage mein user information save karega
    setLoggedIn(true);
    setPage("dashboard");
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("sankhyiki_logged_in");
    localStorage.removeItem("sankhyiki_user_email");
    localStorage.removeItem("sankhyiki_login_provider");
    localStorage.removeItem("sankhyiki_user_id");
    localStorage.removeItem("sankhyiki_user");

    setLoggedIn(false);
    setPage("dashboard");
  };

  // =========================
  // LOGIN GATE
  // =========================
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // =========================
  // PAGES
  // =========================

  if (page === "boonscrolling") {
    return <Boonscrolling onNavigate={setPage} />;
  }

  if (page === "MyLearning") {
    return <MyLearning onNavigate={setPage} />;
  }

  if (page === "NotesDesk") {
    return <NotesDesk onNavigate={setPage} />;
  }

  if (page === "Summarize") {
    return <Summarize onNavigate={setPage} />;
  }

  if (page === "AdaptiveQuiz") {
    return <AdaptiveQuiz onNavigate={setPage} />;
  }

  if (page === "Competencies") {
    return <Competencies onNavigate={setPage} />;
  }

  if (page === "StudyMaterials") {
    return <StudyMaterials onNavigate={setPage} />;
  }

  if (page === "Recommendations") {
    return <Recommendations onNavigate={setPage} />;
  }

  if (page === "Profile") {
    return (
      <Profile
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    );
  }

  // DEFAULT = DASHBOARD
  return <Dashboard onNavigate={setPage} />;
}

export default App;