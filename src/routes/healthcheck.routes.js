import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

router.route("/health").get(healthCheck);

export default router;
