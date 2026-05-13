import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import testRoutes
from "./routes/test.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {

  return res.status(200).json({
    success: true,
    message:
      "AgentOS Backend Railway opérationnel"
  });

});

app.use("/api", testRoutes);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 AgentOS Backend lancé sur port ${PORT}`
  );

});