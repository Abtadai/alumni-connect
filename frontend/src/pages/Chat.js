import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api";

const socket = io("http://localhost:5000");

function Chat() {
  const userId = Number(localStorage.getItem("userId"));
  const [searchParams] = useSearchParams();

  const initialUser = searchParams.get("user")
    ? Number(searchParams.get("user"))
    : null;

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeUser, setActiveUser] = useState(initialUser);
  const [text, setText] = useState("");
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [unread, setUnread] = useState({}); // 🔴 unread tracker

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!userId) return;
    socket.emit("join", userId);
  }, [userId]);

  /* ================= LOAD CONTACTS ================= */
  useEffect(() => {
    if (!userId) return;

    api.get(`/chat/contacts/${userId}`)
      .then((res) => {
        setContacts((res.data || []).map(Number));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  /* ================= FETCH CONTACT NAMES ================= */
  useEffect(() => {
    if (contacts.length === 0) return;

    api.get("/users/by-ids", {
      params: { ids: contacts.join(",") },
    })
      .then((res) => {
        const map = {};
        (res.data || []).forEach((u) => {
          map[Number(u.user_id)] = {
            name: u.full_name,
          };
        });
        setUserMap(map);
      })
      .catch(console.error);
  }, [contacts]);

  /* ================= FETCH MESSAGES ================= */
  useEffect(() => {
    if (!userId || !activeUser) return;

    api.get("/chat/conversation", {
      params: { user1: userId, user2: activeUser },
    })
      .then((res) => setMessages(res.data || []))
      .catch(console.error);
  }, [userId, activeUser]);

  /* ================= RECEIVE ================= */
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => {
        if (prev.find((m) => m.message_id === data.message_id)) return prev;
        return [...prev, data];
      });

      const other =
        data.sender_id === userId
          ? data.receiver_id
          : data.sender_id;

      // 🔴 unread logic
      if (other !== activeUser) {
        setUnread((prev) => ({
          ...prev,
          [other]: true,
        }));
      }

      if (!contacts.includes(other)) {
        setContacts((prev) => [...prev, other]);
      }
    });

    return () => socket.off("receive_message");
  }, [contacts, userId, activeUser]);

  /* ================= SEND ================= */
  const sendMessage = () => {
    if (!text.trim() || !activeUser) return;

    socket.emit("send_message", {
      sender_id: userId,
      receiver_id: activeUser,
      message_text: text,
    });

    setText("");
  };

  /* ================= SEARCH ================= */
  const searchUsers = async () => {
    if (!search.trim()) return;

    try {
      const res = await api.get(`/users/search?q=${search}`);
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <h3>Chats</h3>

        <input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
        />

        {/* SEARCH */}
        {search && results.length === 0 && (
          <p className="empty-text">No results found</p>
        )}

        {results.map((u) => (
          <div
            key={u.user_id}
            className="chat-contact"
            onClick={() => {
              setActiveUser(u.user_id);
              setResults([]);
              setSearch("");
            }}
          >
            <span className="contact-name">
              {u.full_name}
            </span>
          </div>
        ))}

        {/* CONTACT LIST */}
        {loading ? (
          <p className="empty-text">Loading chats...</p>
        ) : contacts.length === 0 ? (
          <p className="empty-text">No conversations yet</p>
        ) : (
          contacts.map((id) => (
            <div
              key={id}
              className={`chat-contact ${
                activeUser === id ? "active" : ""
              }`}
              onClick={() => {
                setActiveUser(id);

                // 🔴 reset unread
                setUnread((prev) => ({
                  ...prev,
                  [id]: false,
                }));
              }}
            >
              <span className="contact-name">
                {userMap[id]?.name || "Loading..."}
              </span>

              {unread[id] && (
                <span className="unread-dot"></span>
              )}
            </div>
          ))
        )}
      </aside>

      <main className="chat-main">
        {!activeUser ? (
          <div className="chat-empty">Select a chat</div>
        ) : (
          <>
            <div className="chat-header">
              {userMap[activeUser]?.name || "Chat"}
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="empty-text">No messages yet 👋</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${
                      m.sender_id === userId ? "sent" : "received"
                    }`}
                  >
                    {m.message_text}
                  </div>
                ))
              )}
            </div>

            <div className="chat-input">
              <input
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Chat;