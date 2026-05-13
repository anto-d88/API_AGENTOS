import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import opsRoutes from "./routes/ops.js";
import testRoutes from "./routes/test.js";

import { runStockWorker } from "./workers/stockWorker.js";
import { runDirectorWorker } from "./workers/directorWorker.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "AgentOS Backend Railway opérationnel"
  });
});

app.use("/api", testRoutes);
app.use("/api/ops", opsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AgentOS Backend lancé sur port ${PORT}`);
  console.log("🤖 Workers AgentOS démarrés");

  runStockWorker();
  runDirectorWorker();

  setInterval(() => {
    runStockWorker();
  }, 1000 * 60 * 5);

  setInterval(() => {
    runDirectorWorker();
  }, 1000 * 60 * 15);
});