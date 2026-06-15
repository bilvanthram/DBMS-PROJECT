import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRouter from "./controllers/taskController.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Token"]
}));

app.use(express.json());

app.use("/task", taskRouter);

app.get("/", (req, res) => {
    res.json({ code: 200, message: "Task Service Started...." });
});

// Always return JSON for unknown routes
app.use((req, res) => {
    res.status(404).json({ code: 404, message: "API route not found" });
});

const PORT = process.env.PORT || 8002;

// Start the server only after MongoDB connects
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Task Service running on http://localhost:" + PORT);
    });
});
