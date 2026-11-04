const express = require("express")
const http = require("http");
const { Schema, default: mongoose } = require("mongoose");
const { type } = require("os");
const path = require("path")
const {Server} = require("socket.io")
require("dotenv").config();

const app = express();
app.use(express.static(path.resolve("./public")));
const server = http.createServer(app)
const io = new Server(server);
const PORT = 9000;

const messageSchema = new Schema({
    message: {
        type: String, 
        required: true,
    },
    clientId: {
        type: String, 
        required: true,
    }
}, {timestamps: true});

const Message = mongoose.model("message", messageSchema);

// Socket.io

io.on("connection", async (socket) => {

    try{
        const messages = await Message.find().sort({createdAt: -1}).limit(100).lean();
        socket.emit("chat-history", messages.reverse());
    } catch(error){
        console.error("error fetching messages", error)
    }


    socket.on("user-message", async (data)=> {
        try{
            const newMessage = await Message.create({
                message: data.message,
                clientId: data.clientId
            });

            io.emit("message", newMessage);
        } catch(error){
            console.error("error saving message", error)
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id)
    })
})

app.get("/", (req, res) => {
    return res.sendFile("/public/index.html")
})


mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`server started at ${PORT}`));
}).catch((error)=>{
    console.error("MongoDb connection failed:", error)
});


