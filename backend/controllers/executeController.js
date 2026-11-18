const { executeCode, getCompiler } = require("../services/executionService");

// Keep individual submissions well under the upstream service's limits
// and the express.json() body limit set in app.js.
const MAX_CODE_BYTES = 50 * 1024;

function validateExecuteInput(code, language) {
    if (typeof code !== "string" || code.trim() === "") {
        return "code is required";
    }
    if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
        return "code exceeds the 50KB size limit";
    }
    if (!getCompiler(language)) {
        return "Unsupported language";
    }
    return null;
}

async function execute(req, res) {
    const { code, language } = req.body ?? {};

    const validationError = validateExecuteInput(code, language);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const result = await executeCode({ compiler: getCompiler(language), code });
        console.log(`[execute] ${language} -> ${result?.status ?? "done"}`);
        return res.json(result);
    } catch (err) {
        const status = err.statusCode || 500;
        console.error(`[execute] ${language} failed (${status}): ${err.message}`);
        return res.status(status).json({ error: err.message });
    }
}

module.exports = { execute, validateExecuteInput };
