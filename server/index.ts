import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { requireAnyRole } from "./middleware/auth";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import adminRouter from "./routes/admin";
import aiRouter from "./routes/ai";
import usersRouter from "./routes/users";
import linesRouter from "./routes/lines";
import projectImportRouter from "./routes/projectImport";

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Local login — no auth middleware (public endpoint)
app.use("/api", authRouter);

// New auth routes — auth middleware applied inside each router
app.use("/api", usersRouter);
app.use("/api", linesRouter);
app.use("/api", projectImportRouter);

// Existing routes — apply requireAnyRole globally
// (write operations add requirePmoOrDcl inside their route handlers)
app.use("/api", requireAnyRole, projectsRouter);
app.use("/api", requireAnyRole, adminRouter);
app.use("/api/ai", requireAnyRole, aiRouter);

// Serve Vite-built frontend in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  // SPA fallback — all non-API routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
