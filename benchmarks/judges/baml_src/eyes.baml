// ClaudeEyes: a Claude Code client that SEES; the stock ClaudeCodeClient folds the prompt to text and drops media.

// Prompt parts go to `claude -p` as stream-json content blocks, so images arrive as images, in one turn, no tools.
class ClaudeEyes {
    executable: string,
    model: string,
    cwd: string?,
    timeout_ms: int,

    implements ai.Client {
        function id(self) -> string {
            `claude-eyes/${self.model}`
        }

        function render(
            self,
            input: ai.ModelTurnInput,
        ) -> baml.http.Request throws ai.errors.PreviewUnsupported {
            throw ai.errors.PreviewUnsupported { provider: "claude-eyes", detail: "a local process, not an HTTP request" }
        }

        function invoke(self, input: ai.ModelTurnInput) -> ai.ModelTurn {
            eyes_invoke(self, input)
        }
    }
}

// The rendered prompt as Anthropic content blocks: text stays text, images become base64 image blocks.
function content_blocks(prompt: ai.Prompt) -> json[] {
    let blocks: json[] = [];
    for (let m in prompt.messages()) {
        for (let p in m.parts) {
            match (p) {
                let s: string => {
                    if (s.length() > 0) {
                        blocks.push({ "type": "text", "text": s });
                    }
                },
                let img: baml.media.Image => {
                    blocks.push(
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": img.mime_type() ?? "image/png",
                                "data": img.base64(),
                            },
                        },
                    );
                },
                _ => {
                    null
                },
            };
        }
    }
    blocks
}

function eyes_fail(detail: string) -> ai.errors.NetworkFailure {
    ai.errors.NetworkFailure {
        status_code: null,
        provider: "claude-eyes",
        detail: detail,
        raw_body: null,
    }
}

function eyes_invoke(c: ClaudeEyes, input: ai.ModelTurnInput) -> ai.ModelTurn {
    let prompt = input.prompt(ai.internal.build_output_format(input.output_type));
    let line = baml.json.stringify(
        { "type": "user", "message": { "role": "user", "content": content_blocks(prompt) } },
    );
    let schema = baml.json.schema(input.output_type) catch_all (e) {
        _ => throw eyes_fail(`no JSON schema for the output type: ${e}`)
    };
    let args = [
        "-p",
        "--input-format",
        "stream-json",
        "--output-format",
        "stream-json",
        "--verbose",
        "--model",
        c.model,
        "--no-session-persistence",
        "--tools",
        "",
        "--json-schema",
        baml.json.stringify(schema),
    ];
    let out = baml.sys.exec(
        c.executable,
        args,
        baml.sys.ProcessOptions {
            cwd: c.cwd,
            env: null,
            timeout_ms: c.timeout_ms,
            stdin: line + "\n",
            stderr: null,
        },
    ) catch_all (e) {
        _ => throw eyes_fail(`the Claude Code CLI failed to run: ${e}`)
    };
    let text = string.from_utf8(out.stdout) catch_all (_) {
        _ => ""
    };
    let result: json = null;
    for (let l in text.lines()) {
        if (l.includes("\"type\":\"result\"")) {
            result
                = baml.json.parse(l) catch_all (_) {
                    _ => null
                };
        }
    }
    if (result == null || baml.json.path_or<bool>(result, ".is_error", false)) {
        throw ai.errors.ProviderError {
            provider: "claude-eyes",
            message: baml.json.path_or<string>(result, ".result", `no result (exit ${out.exit_code})`),
            error_type: baml.json.path_or<string>(result, ".subtype", "error"),
            error_code: null,
            raw_body: text.slice(0, 2000),
            status_code: null,
        }
    }
    let structured = baml.json.path<json>(result, ".structured_output") catch_all (_) {
        _ => {
            baml.json.parse(baml.json.path_or<string>(result, ".result", "")) catch_all (_) {
                _ => {
                    throw ai.errors.ParseFailed { provider: "claude-eyes", raw_output: text.slice(0, 2000) }
                }
            }
        }
    };
    let usage = ai.events.Usage {
        input_tokens: baml.json.path_or<int>(result, ".usage.input_tokens", 0),
        output_tokens: baml.json.path_or<int>(result, ".usage.output_tokens", 0),
        cached_input_tokens: baml.json.path_or<int?>(result, ".usage.cache_read_input_tokens", null),
        reasoning_tokens: null,
        cache_write_input_tokens: baml.json.path_or<int?>(result, ".usage.cache_creation_input_tokens", null),
        uncached_input_tokens: null,
    };
    ai.ModelTurn {
        parsed_output: null,
        content: [ai.content.Text { text: baml.json.stringify(structured) }],
        stop_reason: ai.content.StopReason.Complete,
        usage: usage,
        model: c.model,
        calls: [],
    }
}
