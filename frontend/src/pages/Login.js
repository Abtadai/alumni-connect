import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      console.log("LOGIN CLICKED");

      const res = await api.post("/auth/login", { email, password });

localStorage.setItem("token", res.data.token);
localStorage.setItem("userId", res.data.user_id);
localStorage.setItem("role", res.data.role);

      if (res.data && res.data.user_id) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", res.data.user_id);
        localStorage.setItem("role", res.data.role);

        setIsLoggedIn(true);
        navigate("/feed");
      } else {
        setMsg(res.data || "Login failed");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setMsg(err.response.data || "Login failed");
      } else {
        setMsg("Server not reachable");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <h2>Login</h2>

        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="button" onClick={handleLogin}>
            Login
          </button>
        </div>

        {msg && <p className="auth-message">{msg}</p>}
      </div>
    </div>
  );
}

export default Login;