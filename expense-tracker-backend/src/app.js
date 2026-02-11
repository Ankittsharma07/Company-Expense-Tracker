import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

const corsOptions = {
  origin: env.corsOrigin,
  credentials: true,
};
app.use(cors(corsOptions));

registerRoutes(app);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("Unhandled error:", err);
  }
  res.status(status).json({
    message: status >= 500 ? "Internal server error" : err.message || "Request failed",
  });
});

export default app;
