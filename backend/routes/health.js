import { Router } from "express";
import { sequelize } from "../configs/database.js";
const router = Router();
router.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
export default router;
