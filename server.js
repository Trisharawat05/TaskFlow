const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());

// ── Auth Middleware ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", ts: Date.now() }));

// ── User Routes ─────────────────────────────────────────────────────────────
app.get("/api/user/profile", authenticate, async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/user/profile", authenticate, async (req, res) => {
  try {
    const { displayName, preferences } = req.body;
    await db.collection("users").doc(req.user.uid).set(
      { displayName, preferences, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Task Routes ─────────────────────────────────────────────────────────────
// GET /api/tasks — list tasks (supports ?status=&priority=&category= filters)
app.get("/api/tasks", authenticate, async (req, res) => {
  try {
    let query = db.collection("tasks").where("userId", "==", req.user.uid);
    const { status, priority, category } = req.query;
    if (status)   query = query.where("status", "==", status);
    if (priority) query = query.where("priority", "==", priority);
    if (category) query = query.where("category", "==", category);
    query = query.orderBy("createdAt", "desc");

    const snap = await query.get();
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create task
app.post("/api/tasks", authenticate, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title required" });

    const task = {
      userId: req.user.uid,
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "medium",
      category: category || "general",
      status: "todo",
      dueDate: dueDate || null,
      tags: tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("tasks").add(task);
    res.status(201).json({ id: ref.id, ...task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id — update task
app.put("/api/tasks/:id", authenticate, async (req, res) => {
  try {
    const ref = db.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.user.uid)
      return res.status(404).json({ error: "Task not found" });

    const updates = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    delete updates.userId;
    await ref.update(updates);
    res.json({ id: req.params.id, ...doc.data(), ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — delete task
app.delete("/api/tasks/:id", authenticate, async (req, res) => {
  try {
    const ref = db.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.user.uid)
      return res.status(404).json({ error: "Task not found" });
    await ref.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/status — toggle status quickly
app.patch("/api/tasks/:id/status", authenticate, async (req, res) => {
  try {
    const ref = db.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.user.uid)
      return res.status(404).json({ error: "Task not found" });
    await ref.update({
      status: req.body.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — dashboard stats
app.get("/api/stats", authenticate, async (req, res) => {
  try {
    const snap = await db.collection("tasks").where("userId", "==", req.user.uid).get();
    const tasks = snap.docs.map((d) => d.data());
    const now = new Date();
    res.json({
      total:      tasks.length,
      todo:       tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      done:       tasks.filter((t) => t.status === "done").length,
      overdue:    tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done").length,
      high:       tasks.filter((t) => t.priority === "high").length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TaskFlow API running on :${PORT}`));
module.exports = app;
