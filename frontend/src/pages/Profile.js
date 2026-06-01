import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

function Profile() {
  const { userId: paramUserId } = useParams();

  const loggedInUserId = Number(localStorage.getItem("userId"));
  const profileUserId = paramUserId
    ? Number(paramUserId)
    : loggedInUserId;

  const isOwnProfile = profileUserId === loggedInUserId;

  const [profile, setProfile] = useState({});
  const [posts, setPosts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    api.get(`/users/${profileUserId}`)
      .then(res => setProfile(res.data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profileUserId]);

  /* ================= FETCH POSTS ================= */
  useEffect(() => {
    api.get(`/post/user/${profileUserId}`)
      .then(res => setPosts(res.data || []))
      .catch(() => setPosts([]));
  }, [profileUserId]);

  /* ================= SAVE ================= */
  const saveProfile = () => {
    api.put(`/profile/${loggedInUserId}`, profile)
      .then(() => setEditMode(false))
      .catch(err => {
        console.error(err);
        alert("Update failed");
      });
  };

  if (loading) return <div className="profile-page">Loading...</div>;

  return (
    <div className="profile-page">

      {/* ================= COVER ================= */}
      <div className="profile-cover glass"></div>

      {/* ================= HEADER ================= */}
      <div className="profile-header glass">

        <div className="profile-avatar">
          {profile.profile_image ? (
            <img src={`http://localhost:5000${profile.profile_image}`} alt="" />
          ) : (
            <div className="avatar-placeholder"></div>
          )}
        </div>

        <div className="profile-header-info">
          <h2>{profile.full_name}</h2>

          <p className="profile-role">
            {profile.designation || profile.role}
            {profile.company && ` @ ${profile.company}`}
          </p>

          <p className="profile-location">
            {profile.department} • Batch {profile.batch}
          </p>

          {isOwnProfile && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="edit-btn"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ================= DETAILS ================= */}
      <div className="profile-card glass">
        <h3>Details</h3>

        {!editMode ? (
          <>
            <p>Email: {profile.email}</p>
            <p>Phone: {profile.phone_number}</p>
            <p>Batch: {profile.batch}</p>

            {profile.company && <p>Company: {profile.company}</p>}
            {profile.designation && <p>Role: {profile.designation}</p>}
          </>
        ) : (
          <>
            <input
              value={profile.full_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              placeholder="Full name"
            />

            <input
              value={profile.phone_number || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone_number: e.target.value })
              }
              placeholder="Phone"
            />

            <input
              value={profile.batch || ""}
              onChange={(e) =>
                setProfile({ ...profile, batch: e.target.value })
              }
              placeholder="Batch"
            />

            <button onClick={saveProfile} className="save-btn">
              Save
            </button>
          </>
        )}
      </div>

      {/* ================= ACTIVITY ================= */}
      <div className="profile-card glass">
        <div className="card-header">
          <h3>Activity</h3>
        </div>

        {posts.length === 0 ? (
          <p className="empty-text">No posts yet</p>
        ) : (
          <div className="activity-feed">
            {posts.map((p) => (
              <div key={p.post_id} className="activity-post glass">

                {/* HEADER */}
                <div className="post-header">
                  <img
                    src={
                      p.author_image
                        ? `http://localhost:5000${p.author_image}`
                        : "/default-avatar.png"
                    }
                    alt=""
                    className="post-avatar"
                  />

                  <div>
                    <div className="post-name">{p.author_name}</div>
                    <div className="post-time">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="post-content">
                  {p.content}
                </div>

                {/* IMAGE */}
                {p.image && (
                  <img
                    src={`http://localhost:5000${p.image}`}
                    alt=""
                    className="post-image"
                  />
                )}

                {/* ACTIONS */}
                <div className="post-actions">
                  <button>Like</button>
                  <button>Comment</button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Profile;