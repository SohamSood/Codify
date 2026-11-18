const axios = require("axios");

const DEFAULT_COMPILER_API_URL = "https://api.onlinecompiler.io/api/run-code-sync/";
// Upstream caps execution at ~30s; leave headroom for compile + network.
const DEFAULT_TIMEOUT_MS = 45 * 1000;

const compilerMap = Object.freeze({
    cpp: "g++-15",
    c: "gcc-15",
    python: "python-3.14",
    java: "openjdk-25",
    javascript: "typescript-deno"
});

function getCompiler(language) {
    // Object.hasOwn avoids inherited keys such as "constructor" or
    // "__proto__" slipping through as a valid compiler.
    if (typeof language !== "string" || !Object.hasOwn(compilerMap, language)) {
        return undefined;
    }
    return compilerMap[language];
}

function httpError(status, message) {
    const error = new Error(message);
    error.statusCode = status;
    return error;
}

async function executeCode({ compiler, code }) {
    const apiKey = process.env.ONLINE_COMPILER_API_KEY;
    if (!apiKey) {
        throw httpError(503, "Online compiler API key is not configured");
    }

    const apiUrl = process.env.ONLINE_COMPILER_API_URL || DEFAULT_COMPILER_API_URL;
    const timeoutMs = Number(process.env.EXECUTE_TIMEOUT_MS) > 0
        ? Number(process.env.EXECUTE_TIMEOUT_MS)
        : DEFAULT_TIMEOUT_MS;

    try {
        const response = await axios.post(
            apiUrl,
            {
                compiler,
                code,
                input: ""
            },
            {
                headers: {
                    Authorization: apiKey
                },
                timeout: timeoutMs
            }
        );
        return response.data;
    } catch (err) {
        if (err.code === "ECONNABORTED") {
            throw httpError(504, "Code execution timed out");
        }
        // Normalize upstream failures to a string so the frontend never
        // renders "[object Object]".
        const upstream = err.response?.data;
        const message =
            (typeof upstream === "string" && upstream) ||
            (typeof upstream?.message === "string" && upstream.message) ||
            (typeof upstream?.error === "string" && upstream.error) ||
            err.message;
        throw httpError(500, message);
    }
}

module.exports = { compilerMap, getCompiler, executeCode };
