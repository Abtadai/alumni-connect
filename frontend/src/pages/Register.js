import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("STUDENT");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    full_name: "",
    department: "",
    batch: "",
    company: "",
    designation: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        role,
      };

      // remove empty alumni fields for student
      if (role === "STUDENT") {
        delete payload.company;
        delete payload.designation;
      }

      await api.post("/auth/register", payload);

      setMsg("Check your email to verify your account");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Register</h2>

        <form onSubmit={handleRegister} className="auth-form">
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="phone" type="tel" placeholder="Phone" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="STUDENT">Student</option>
            <option value="ALUMNI">Alumni</option>
          </select>

          <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
          <input name="department" placeholder="Department" onChange={handleChange} required />
          <input name="batch" placeholder="Batch" onChange={handleChange} required />

          {role === "ALUMNI" && (
            <>
              <input name="company" placeholder="Company" onChange={handleChange} />
              <input name="designation" placeholder="Designation" onChange={handleChange} />
            </>
          )}

          <button type="submit">Register</button>
        </form>

        {msg && <p className="auth-message">{msg}</p>}
      </div>
    </div>
  );
}

export default Register;