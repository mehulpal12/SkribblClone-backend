import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { roomHandler } from "./socket/roomHandler";
import { gameHandler } from "./socket/gameHandler";

dotenv.config();

const app = express();
// Priority: Always read Render's dynamic environment port first
const PORT = process.env.PORT || 5000;

// 1. Global Midlewares
app.use(cors({
    origin:"*"
}));
app.use(express.json());

app.listen(PORT,()=>{
    console.log("Server is running on port",PORT);
})

// 2. HTTP Routes (Place this BEFORE Socket server attachment so it resolves instantly)
app.get("/", (req, res) => {
    res.status(200).send("Hello World!");
});

app.get("/test", (req, res) => {
    res.status(200).send("Hello World!");
});
app.get("/health", (_, res) => {
  res.json({
    success: true,
    timestamp: Date.now()
  });
});


// 3. Create Server Instantiation
const server = http.createServer(app);

// 4. WebSocket Initializations
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);
    roomHandler(socket, io);
    gameHandler(socket, io);
});

// 5. Port & Host Binding Configuration
// We pass "0.0.0.0" to allow Render's load balancers to route traffic directly to your app
server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running smoothly on port ${PORT}`);
});
