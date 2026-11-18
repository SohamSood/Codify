const test = require("node:test");
const assert = require("node:assert/strict");

const { createRateLimiter, envInt } = require("../middleware/rateLimiter");

function mockRes() {
    return {
        statusCode: 200,
        headers: {},
        set(name, value) {
            this.headers[name] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

function runLimiter(limiter, ip) {
    const req = { ip };
    const res = mockRes();
    let passed = false;
    limiter(req, res, () => {
        passed = true;
    });
    return { res, passed };
}

test("allows requests up to the maximum, then blocks", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

    for (let i = 0; i < 3; i++) {
        const { res, passed } = runLimiter(limiter, "1.2.3.4");
        assert.equal(passed, true, `request ${i + 1} should pass`);
        assert.equal(res.statusCode, 200);
    }

    const { res, passed } = runLimiter(limiter, "1.2.3.4");
    assert.equal(passed, false);
    assert.equal(res.statusCode, 429);
    assert.ok(res.headers["Retry-After"]);
    assert.match(res.body.error, /Too many requests/);
});

test("tracks each IP independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    assert.equal(runLimiter(limiter, "1.1.1.1").passed, true);
    assert.equal(runLimiter(limiter, "2.2.2.2").passed, true);
    assert.equal(runLimiter(limiter, "1.1.1.1").passed, false);
});

test("starts a new window after windowMs elapses", () => {
    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;

    try {
        const limiter = createRateLimiter({ windowMs: 1_000, max: 1 });

        assert.equal(runLimiter(limiter, "3.3.3.3").passed, true);
        assert.equal(runLimiter(limiter, "3.3.3.3").passed, false);

        now += 1_001;
        assert.equal(runLimiter(limiter, "3.3.3.3").passed, true);
    } finally {
        Date.now = realNow;
    }
});

test("envInt reads positive integers and falls back otherwise", () => {
    const realEnv = process.env.TEST_LIMIT;
    try {
        process.env.TEST_LIMIT = "5";
        assert.equal(envInt("TEST_LIMIT", 10), 5);

        process.env.TEST_LIMIT = "abc";
        assert.equal(envInt("TEST_LIMIT", 10), 10);

        process.env.TEST_LIMIT = "-3";
        assert.equal(envInt("TEST_LIMIT", 10), 10);

        delete process.env.TEST_LIMIT;
        assert.equal(envInt("TEST_LIMIT", 10), 10);
    } finally {
        if (realEnv === undefined) delete process.env.TEST_LIMIT;
        else process.env.TEST_LIMIT = realEnv;
    }
});
