const express = require("express");
const router = express.Router();

const { execute } = require("../controllers/executeController");
const { createRateLimiter, envInt } = require("../middleware/rateLimiter");

// Each execution bills against the upstream compiler API key, so protect
// only the expensive endpoint (health checks stay unlimited).
const executeLimiter = createRateLimiter({
    windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60 * 1000),
    max: envInt("RATE_LIMIT_MAX", 60)
});

router.get("/", (req, res) => {
    res.json({
        message: "Backend Running Successfully"
    });
});

router.post("/execute", executeLimiter, execute);

module.exports = router;
