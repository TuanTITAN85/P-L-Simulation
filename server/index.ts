import "dotenv/config";
import express from "express";
import cors from "cors";
import projectsRouter from "./routes/projects";
import adminRouter from "./routes/admin";
import aiRouter from "./routes/ai";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api", projectsRouter);
app.use("/api", adminRouter);
app.use("/api/ai", aiRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
