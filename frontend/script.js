// Front-end only interactions — no real compilation happens here.
// Wire this up to your backend/API to actually execute code.

const codeArea = document.getElementById("code");
const gutter = document.getElementById("gutter");
const langSelect = document.getElementById("language");
const fileExt = document.getElementById("file-ext");
const posLabel = document.getElementById("pos");
const consoleEl = document.getElementById("console");

function updateGutter() {
    const lines = codeArea.value.split("\n").length || 1;
    gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join("");
}

function updatePosition() {
    const value = codeArea.value.substring(0, codeArea.selectionStart);
    const lines = value.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    posLabel.textContent = `Ln ${line}, Col ${col}`;
}

function updateFileExtension() {
    const opt = langSelect.options[langSelect.selectedIndex];
    fileExt.textContent = opt.dataset.ext || "";
}

async function runCode() {
    const code = codeArea.value.trim();
    const language = langSelect.value;

    if (!code) {
        consoleEl.innerHTML = `<span class="console-line muted">$ nothing to run — write some code first</span>`;
        return;
    }

    consoleEl.innerHTML = `<span class="console-line muted">$ compiling ${language} …</span>`;

    try {
        const response = await fetch("http://localhost:5000/api/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                language
            })
        });

        const data = await response.json();
        console.log(data);

        const output = data.output ?? data.stdout ?? JSON.stringify(data, null, 2);
        const error = data.error ?? data.stderr;

        let html = `<span class="console-line muted">$ compiling ${language} …</span>\n`;
        if (output) {
            html += `<span class="console-line">${escapeHtml(output)}</span>`;
        }
        if (error) {
            html += `\n<span class="console-line error">${escapeHtml(error)}</span>`;
        }
        consoleEl.innerHTML = html;
    } catch (err) {
        console.error(err);
        consoleEl.innerHTML =
            `<span class="console-line muted">$ compiling ${language} …</span>\n` +
            `<span class="console-line error">$ could not reach the server — is it running on localhost:5000?</span>`;
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function clearConsole() {
    consoleEl.innerHTML = `<span class="console-line muted">$ waiting for input…</span>`;
}

codeArea.addEventListener("input", () => {
    updateGutter();
    updatePosition();
});

function enableTabIndent() {
    const code = document.getElementById("code");

    code.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            code.setRangeText("    ", code.selectionStart, code.selectionEnd, "end");
        }
    });
}

function enableAutoPairs() {
    const pairs = {
        "{": "}",
        "(": ")",
        "[": "]",
        '"': '"',
        "'": "'"
    };

    codeArea.addEventListener("keydown", (e) => {
        if (!(e.key in pairs)) return;

        e.preventDefault();

        const close = pairs[e.key];
        const pos = codeArea.selectionStart;

        codeArea.setRangeText(e.key + close, pos, codeArea.selectionEnd, "end");
        codeArea.selectionStart = codeArea.selectionEnd = pos + 1;
    });
}

function enableAutoIndent() {
    codeArea.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const pos = codeArea.selectionStart;
        const before = codeArea.value.slice(0, pos);
        const line = before.split("\n").pop();

        const indent = line.match(/^\s*/)[0];

        if (codeArea.value[pos - 1] === "{" && codeArea.value[pos] === "}") {
            codeArea.setRangeText("\n" + indent + "    \n" + indent, pos, pos, "end");
            codeArea.selectionStart = codeArea.selectionEnd = pos + indent.length + 5;
        } else {
            codeArea.setRangeText("\n" + indent, pos, pos, "end");
        }
    });
}

codeArea.addEventListener("keyup", updatePosition);
codeArea.addEventListener("click", updatePosition);
langSelect.addEventListener("change", updateFileExtension);

enableTabIndent(); 
updateGutter();
updatePosition();
updateFileExtension();
enableAutoPairs();
enableAutoIndent();