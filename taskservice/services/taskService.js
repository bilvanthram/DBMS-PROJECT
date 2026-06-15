import Tasks from "../models/tasks.js";
import { getUserId } from "./authService.js";

// Create Task
export async function createTask(data, token) {
    try {
        const crid = getUserId(token);
        data.createdby = crid;
        await Tasks.create(data);
        return { code: 200, message: "New task has been created" };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

// Get All Tasks with Pagination
export async function getAllTasks(PAGE, SIZE, token) {
    try {
        const crid = getUserId(token);
        const page = Number(PAGE);
        const size = Number(SIZE);

        if (isNaN(page) || isNaN(size) || page <= 0 || size <= 0) {
            return {
                code: 400,
                message: "Invalid page or size value",
                page: 1, size: 0, totalrecords: 0, totalpages: 0, tasks: []
            };
        }

        const skip = (page - 1) * size;

        const tasks = await Tasks.find({ createdby: crid })
            .sort({ createdat: -1 })
            .skip(skip)
            .limit(size);

        const totalrecords = await Tasks.countDocuments({ createdby: crid });

        return {
            code: 200,
            message: "Tasks fetched successfully",
            page, size,
            totalrecords,
            totalpages: Math.ceil(totalrecords / size),
            tasks
        };
    } catch (e) {
        return {
            code: 500, message: e.message,
            page: 1, size: 0, totalrecords: 0, totalpages: 0, tasks: []
        };
    }
}

// Search Task (title / description / deadline)
export async function vectorSearch(key, token) {
    try {
        const crid = getUserId(token);
        const regex = new RegExp(key, "i");
        const tasks = await Tasks.find({
            createdby: crid,
            $or: [
                { title: regex },
                { description: regex },
                { deadline: regex }
            ]
        })
            .sort({ createdat: -1 })
            .limit(20);

        return { code: 200, tasks };
    } catch (e) {
        return { code: 500, message: e.message, tasks: [] };
    }
}

// Get Single Task
export async function getTask(id, token) {
    try {
        const crid = getUserId(token);
        const task = await Tasks.findOne({ _id: id, createdby: crid });
        if (!task) {
            return { code: 404, message: "Task not found" };
        }
        return { code: 200, message: "Task fetched successfully", task };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

// Update Task
export async function updateTask(id, data, token) {
    try {
        const crid = getUserId(token);
        delete data.createdby;
        delete data._id;
        delete data.id;

        const result = await Tasks.findOneAndUpdate(
            { _id: id, createdby: crid },
            data,
            { new: true }
        );

        if (!result) {
            return { code: 404, message: "Task not found or not allowed to update" };
        }
        return { code: 200, message: "Task updated successfully" };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

// Delete Task
export async function deleteTask(id, token) {
    try {
        const crid = getUserId(token);
        const result = await Tasks.findOneAndDelete({ _id: id, createdby: crid });
        if (!result) {
            return { code: 404, message: "Task not found or not allowed to delete" };
        }
        return { code: 200, message: "Task has been deleted" };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}
