const express = require("express");
const router = express.Router();
const axios = require("axios");

const compilerMap = {
    cpp: "g++-15",
    c: "gcc-15",
    python: "python-3.14",
    java: "openjdk-25",
    javascript: "typescript-deno"
};

router.get("/", (req, res) => {
    res.json({
        message: "Backend Running Successfully"
    });
});

router.post("/execute", async (req, res) => {
    try {
        const apiKey = process.env.ONLINE_COMPILER_API_KEY;

        const { code, language } = req.body;

        const compiler = compilerMap[language];

        if (!compiler) {
            return res.status(400).json({
                error: "Unsupported language"
            });
        }

        const response = await axios.post(
            "https://api.onlinecompiler.io/api/run-code-sync/",
            {
                compiler,
                code,
                input: ""
            },
            {
                headers: {
                    Authorization: apiKey
                }
            }
        );

        console.log(response.data);

        res.json(response.data);

    } catch (err) {
        console.error(err.response?.data || err.message);

        res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});

module.exports = router;