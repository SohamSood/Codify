/**
 * Minimal fixed-window, in-memory per-IP rate limiter.
 * Suitable for a single-instance deployment (Render free tier).
 * For multi-instance setups, back this with a shared store.
 */

function envInt(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}

function createRateLimiter({ windowMs = 60 * 1000, max = 60 } = {}) {
    const hits = new Map();

    // Drop expired windows periodically so memory stays bounded.
    const sweeper = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (now >= entry.resetAt) hits.delete(key);
        }
    }, windowMs);
    sweeper.unref?.();

    return function rateLimiter(req, res, next) {
        const now = Date.now();
        const key = req.ip || req.socket?.remoteAddress || "unknown";

        let entry = hits.get(key);
        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        if (entry.count > max) {
            const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.set("Retry-After", String(retryAfterSec));
            return res.status(429).json({
                error: "Too many requests — please wait a moment and try again"
            });
        }

        return next();
    };
}

module.exports = { createRateLimiter, envInt };
