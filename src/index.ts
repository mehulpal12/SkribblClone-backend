import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { roomHandler } from "./socket/roomHandler";
import { gameHandler } from "./socket/gameHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

io.on("connection",(socket)=>{
    console.log("Connected:",socket.id);
    roomHandler(socket, io);
     gameHandler(
    socket,
    io
  );

});

server.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});