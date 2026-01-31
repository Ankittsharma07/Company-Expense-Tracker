import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`Expense Tracker API running on port ${env.port}`);
});

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `Port ${env.port} is already in use. Stop the other process or update PORT in .env.`
    );
    process.exit(1);
  }

  console.error("Server startup error:", err);
  process.exit(1);
});
