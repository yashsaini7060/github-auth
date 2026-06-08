import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import authRouter from "./auth";

// Load .env in development
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true, // Required for cross-origin cookie sending
  })
);

app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${process.env.FRONTEND_URL ?? "http://localhost:5173"}`);
});

export default app;
