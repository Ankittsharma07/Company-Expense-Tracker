import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("combined"));

const corsOptions = {
  origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(","),
  credentials: true,
};
app.use(cors(corsOptions));

registerRoutes(app);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

export default app;
