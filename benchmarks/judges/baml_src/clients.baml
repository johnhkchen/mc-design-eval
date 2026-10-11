// The lab's judging instruments (moved out of the minecraft-design plugin 2026-10-10: the product no longer judges).
// Every call goes through bin/claude-lean-<effort> (the plugin's lean `claude -p` runner), so cost lands in $MCD_LEDGER.
// `plugin` is the minecraft-design checkout; this lab sits beside it (../mc-design-eval).

function lean(plugin: string, effort: string) -> string {
    `${plugin}/../mc-design-eval/benchmarks/judges/bin/claude-lean-${effort}`
}

// One-shot looker: images go in as image blocks (ClaudeEyes), one turn, no tools.
function eyes(plugin: string, model: string, effort: string, cwd: string) -> ai.Client {
    root.ClaudeEyes { executable: lean(plugin, effort), model: model, cwd: cwd, timeout_ms: 600000 }
}

// One-shot text call: no tools.
function thinker(plugin: string, model: string, effort: string, cwd: string) -> ai.Client {
    claude_code.ClaudeCodeClient.new(
        model = model,
        executable = lean(plugin, effort),
        cwd = cwd,
        timeout_ms = 600000,
    )
}

class CardOut {
    card: string,
}

// Render the plugin's glance card for a build (mcd prints one JSON object).
function card_of(plugin: string, nbt: string, out: string) -> string {
    let out_ = baml.sys.exec(
        "node",
        [`${plugin}/tools/bin/mcd.mjs`, "card", nbt, "--out", out, "--front", "n"],
        baml.sys.ProcessOptions {
            cwd: null,
            env: null,
            timeout_ms: 900000,
            stdin: null,
            stderr: null,
        },
    );
    if (!out_.ok()) {
        throw baml.errors.Io { message: `mcd card ${nbt} failed` };
    }
    baml.json.from_string<CardOut>(string.from_utf8(out_.stdout)).card
}
