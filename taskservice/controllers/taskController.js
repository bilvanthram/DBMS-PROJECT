import express from "express";
import * as taskService from "../services/taskService.js";

const router = express.Router();

// Read the token from either the "Token" header or "Authorization" header.
function readToken(req) {
    return req.headers["token"] || req.headers["authorization"];
}

router.post("/createtask", async (req, res) => {
    const response = await taskService.createTask(req.body, readToken(req));
    res.json(response);
});

router.get("/getalltasks/:PAGE/:SIZE", async (req, res) => {
    const { PAGE, SIZE } = req.params;
    const response = await taskService.getAllTasks(PAGE, SIZE, readToken(req));
    res.json(response);
});

router.get("/vectorsearch/:KEY", async (req, res) => {
    const { KEY } = req.params;
    const response = await taskService.vectorSearch(KEY, readToken(req));
    res.json(response);
});

router.get("/gettask/:ID", async (req, res) => {
    const { ID } = req.params;
    const response = await taskService.getTask(ID, readToken(req));
    res.json(response);
});

router.put("/updatetask/:ID", async (req, res) => {
    const { ID } = req.params;
    const response = await taskService.updateTask(ID, req.body, readToken(req));
    res.json(response);
});

router.delete("/deletetask/:ID", async (req, res) => {
    const { ID } = req.params;
    const response = await taskService.deleteTask(ID, readToken(req));
    res.json(response);
});

export default router;
