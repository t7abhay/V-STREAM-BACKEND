import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/health").get(healthCheck);

export default router;
