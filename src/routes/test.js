import express from "express";

import { supabase }
from "../services/supabase.js";

const router =
  express.Router();

router.get(
  "/test-db",
  async (req, res) => {

    try {

      const {
        data,
        error
      } = await supabase
        .from("agent_logs")
        .select("*")
        .limit(5);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        error:
          error.message
      });

    }
  }
);

export default router;