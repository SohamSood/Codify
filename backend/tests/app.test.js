const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");

let server;
let baseUrl;

test.before(async () => {
    // Never hit the live compiler API in tests.
    process.env.ONLINE_COMPILER_API_KEY = "";
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
    server?.close();
});

async function post(path, body, rawBody) {
    const res = await fetch(baseUrl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody !== undefined ? rawBody : JSON.stringify(body)
    });
    return { status: res.status, json: await res.json() };
}

test("GET / returns a health message", async () => {
    const res = await fetch(baseUrl + "/");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { message: "Backend Running Successfully" });
});

test("GET /api returns a health message", async () => {
    const res = await fetch(baseUrl + "/api");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { message: "Backend Running Successfully" });
});

test("unknown routes return JSON 404", async () => {
    const res = await fetch(baseUrl + "/nope");
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "Not found" });
});

test("POST /api/execute rejects an unsupported language", async () => {
    const { status, json } = await post("/api/execute", { code: "x", language: "ruby" });
    assert.equal(status, 400);
    assert.deepEqual(json, { error: "Unsupported language" });
});

test("POST /api/execute rejects a missing code", async () => {
    const { status, json } = await post("/api/execute", { language: "python" });
    assert.equal(status, 400);
    assert.deepEqual(json, { error: "code is required" });
});

test("POST /api/execute rejects a non-string code", async () => {
    const { status, json } = await post("/api/execute", { code: 123, language: "python" });
    assert.equal(status, 400);
    assert.deepEqual(json, { error: "code is required" });
});

test("POST /api/execute rejects a malformed JSON body", async () => {
    const { status, json } = await post("/api/execute", undefined, "{not json");
    assert.equal(status, 400);
    assert.deepEqual(json, { error: "Invalid JSON body" });
});

test("POST /api/execute returns 503 when the API key is not configured", async () => {
    const { status, json } = await post("/api/execute", { code: "print(1)", language: "python" });
    assert.equal(status, 503);
    assert.deepEqual(json, { error: "Online compiler API key is not configured" });
});
