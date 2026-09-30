import express from "express";
import http from "node:http";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { ensureDatabase, sequelize } from "./configs/database.js";
import "./models/index.js";
import { seed } from "./configs/seed.js";
import { registerSockets } from "./controllers/socket.js";
import health from "./routes/health.js";
const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "16kb" }));
app.use("/api", health);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 65536,
});
registerSockets(io);
try {
  await ensureDatabase();
  await sequelize.sync();
  await seed();
  server.listen(
    Number(process.env.PORT || 3001),
    process.env.HOST || "127.0.0.1",
    () => console.log("Liqa server ready"),
  );
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
async function shutdown() {
  io.close();
  server.close();
  await sequelize.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
