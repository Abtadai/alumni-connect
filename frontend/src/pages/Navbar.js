import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  const loggedIn =
    isLoggedIn || localStorage.getItem("isLoggedIn") === "true";

  const role = localStorage.getItem("role");

  const isActive = (path) => location.pathname === path;

  const handleProtectedNav = (path) => {
    if (!loggedIn) {
      alert("Please login first");
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      setIsLoggedIn(false);
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <nav className="glass-navbar">
      {/* LEFT */}
      <div className="nav-left">
        <img src="/favicon-32x32.png" alt="logo" className="logo-img" />
        <Link to="/" className="logo-text">
          Alumni Connect
        </Link>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <button
          className={isActive("/") ? "nav-link active" : "nav-link"}
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <button
          className={isActive("/feed") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/feed")}
        >
          Feed
        </button>

        <button
          className={isActive("/events") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/events")}
        >
          Events
        </button>

        <button
          className={isActive("/chat") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/chat")}
        >
          Chat
        </button>

        {role === "ADMIN" && (
          <button
            className={isActive("/admin") ? "nav-link active" : "nav-link"}
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        )}
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {!loggedIn ? (
          <>
            <button
              className="nav-cta"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>

            <button
              className="nav-cta"
              onClick={() => navigate("/register")}
            >
              Join
            </button>
          </>
        ) : (
          <div className="nav-profile-group">
            {/* 🔥 PROFILE AVATAR */}
            <div
              className="profile-avatar"
              onClick={() =>
                navigate(`/profile/${localStorage.getItem("userId")}`)
              }
            >
              <svg viewBox="0 0 24 24" className="default-avatar">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>

            <button className="nav-cta logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;