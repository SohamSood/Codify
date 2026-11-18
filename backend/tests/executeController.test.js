const test = require("node:test");
const assert = require("node:assert/strict");

const { validateExecuteInput } = require("../controllers/executeController");
const { getCompiler, compilerMap } = require("../services/executionService");

test("validateExecuteInput accepts a valid submission", () => {
    assert.equal(validateExecuteInput("print(1)", "python"), null);
});

test("validateExecuteInput rejects a missing code", () => {
    assert.equal(validateExecuteInput(undefined, "python"), "code is required");
});

test("validateExecuteInput rejects a non-string code", () => {
    assert.equal(validateExecuteInput(42, "python"), "code is required");
});

test("validateExecuteInput rejects empty or whitespace-only code", () => {
    assert.equal(validateExecuteInput("", "python"), "code is required");
    assert.equal(validateExecuteInput("   \n  ", "python"), "code is required");
});

test("validateExecuteInput rejects code over the 50KB limit", () => {
    const big = "a".repeat(50 * 1024 + 1);
    assert.equal(validateExecuteInput(big, "python"), "code exceeds the 50KB size limit");
});

test("validateExecuteInput rejects an unsupported language", () => {
    assert.equal(validateExecuteInput("x", "ruby"), "Unsupported language");
    assert.equal(validateExecuteInput("x", undefined), "Unsupported language");
    assert.equal(validateExecuteInput("x", 123), "Unsupported language");
});

test("getCompiler returns compilers for every mapped language", () => {
    for (const language of Object.keys(compilerMap)) {
        assert.equal(typeof getCompiler(language), "string");
    }
});

test("getCompiler does not expose inherited object keys", () => {
    assert.equal(getCompiler("__proto__"), undefined);
    assert.equal(getCompiler("constructor"), undefined);
    assert.equal(getCompiler("toString"), undefined);
});
