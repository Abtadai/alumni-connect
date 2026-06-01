import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = Number(localStorage.getItem("userId"));

  const role = localStorage.getItem("role");

  /* 🔐 PROTECT ROUTE */
  useEffect(() => {
    if (role !== "ADMIN") {
      alert("Access denied");
      navigate("/");
    }
  }, [role, navigate]);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Admin fetch error:", err);
        alert("Failed to load users");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* ================= TOGGLE USER STATUS ================= */
  const toggleUserStatus = (userId, currentStatus) => {
    api
      .patch(`/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === userId
              ? { ...u, is_active: !currentStatus }
              : u
          )
        );
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to update user");
      });
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-title">Admin Dashboard</h2>

      {/* QUICK ACTIONS */}
      <div className="admin-actions">
        <button className="admin-btn toggle" onClick={() => navigate("/admin/posts")}>
          Manage Posts
        </button>

        <button className="admin-btn toggle" onClick={() => navigate("/admin/events")}>
          Manage Events
        </button>
      </div>

      {/* USERS TABLE */}
      <h3>User Management</h3>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>

                <td>
                  <span
                    className={`status-badge ${
                      u.is_active
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="action-cell">
                  <button
                     className="nav-cta"
                      disabled={u.user_id === currentUserId}
                        onClick={() =>
                       toggleUserStatus(u.user_id, u.is_active)
                       }
                      style={{
                     opacity: u.user_id === currentUserId ? 0.5 : 1,
                     cursor: u.user_id === currentUserId ? "not-allowed" : "pointer"
  }}
>
  {u.user_id === currentUserId
    ? "You"
    : u.is_active
    ? "Deactivate"
    : "Activate"}
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;