const express = require("express");
const cors = require("cors");
require("dotenv").config();

const executeRoutes = require("./routes/executeRoutes");

const app = express();

// Render (and most PaaS proxies) terminate TLS and set X-Forwarded-For.
// Trust exactly one hop so req.ip reflects the real client for rate limiting.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api", executeRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Backend Running Successfully"
    });
});

// JSON 404 for unknown routes, matching the API's response style.
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// JSON error handler — body-parser errors otherwise surface as HTML.
app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body too large" });
    }
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON body" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 5000;

// Only listen when executed directly (`node app.js`), not when required by tests.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
