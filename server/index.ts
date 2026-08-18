import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "MERSAD server is running" });
});

app.post("/api/test-email", (_req, res) => {
  res.status(503).json({
    success: false,
    error: "Email provider is not configured",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`MERSAD server running on http://localhost:${PORT}`);
  });
}

export default app;
