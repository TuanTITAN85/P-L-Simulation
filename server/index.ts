import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { requireAnyRole } from "./middleware/auth";
import authRouter         from "./routes/auth";
import projectsRouter     from "./routes/projects";
import adminRouter        from "./routes/admin";
import aiRouter           from "./routes/ai";
import usersRouter        from "./routes/users";
import linesRouter        from "./routes/lines";
import projectImportRouter from "./routes/projectImport";
// Phase 2 routes
import lineServicesRouter  from "./routes/lineServices";
import usersPmRouter       from "./routes/usersPm";
import usersDclRouter      from "./routes/usersDcl";
import usersPmoRouter      from "./routes/usersPmo";
import masterProjectsRouter from "./routes/masterProjects";
import workflowRouter      from "./routes/workflow";
import actualDataNewRouter from "./routes/actualDataNew";
import systemUsersRouter   from "./routes/systemUsers";
import azureUserRouter     from "./routes/azureUser";
// Phase 4 routes
import pmProjectsRouter    from "./routes/pmProjects";
// Phase 5 routes
import reviewQueueRouter   from "./routes/reviewQueue";

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── Auth (public endpoints — no auth middleware) ─────────────────────────────
app.use("/api", authRouter);

// ─── Legacy routes (users table auth) ────────────────────────────────────────
app.use("/api", usersRouter);
app.use("/api", linesRouter);

// ─── Phase 2 routes (system_users multi-role auth) ───────────────────────────
app.use("/api", projectImportRouter);
app.use("/api", lineServicesRouter);
app.use("/api", usersPmRouter);
app.use("/api", usersDclRouter);
app.use("/api", usersPmoRouter);
app.use("/api", masterProjectsRouter);
app.use("/api", workflowRouter);
app.use("/api", actualDataNewRouter);
app.use("/api", systemUsersRouter);
app.use("/api", azureUserRouter);

// ─── Phase 4 routes ───────────────────────────────────────────────────────────
app.use("/api", pmProjectsRouter);

// ─── Phase 5 routes ───────────────────────────────────────────────────────────
app.use("/api", reviewQueueRouter);

// ─── Existing routes — apply requireAnyRole globally ─────────────────────────
app.use("/api", requireAnyRole, projectsRouter);
app.use("/api", requireAnyRole, adminRouter);
app.use("/api/ai", requireAnyRole, aiRouter);

// ─── Serve Vite-built frontend in production ──────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
