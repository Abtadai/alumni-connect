let io;
const db = require("../config/db");

const initSocket = (server) => {
  const { Server } = require("socket.io");

  // io = new Server(server, {
  //   cors: { origin: "http://localhost:3000" },
  // });
  const allowedOrigins = [
    "http://localhost:3000",
    "https://alumni-connect-theta-one.vercel.app"
  ];
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on("send_message", (data) => {
      const { sender_id, receiver_id, message_text } = data;

      db.query(
        `INSERT INTO ChatMessage (sender_id, receiver_id, message_text)
         VALUES (?, ?, ?)`,
        [sender_id, receiver_id, message_text],
        (err, result) => {
          if (err) return;

          const msg = {
            message_id: result.insertId,
            sender_id,
            receiver_id,
            message_text,
            sent_at: new Date(),
          };

          io.to(`user_${receiver_id}`).emit("receive_message", msg);
          socket.emit("receive_message", msg);
        }
      );
    });
  });
};

module.exports = { initSocket };