// We never actually CALL this client — the harness pipes BAML's rendered prompt through
// `claude -p` (subscription) and feeds the text back to BAML's parser (modular API:
// b.request.* to render, b.parse.* to SAP-parse). The client only shapes `.request`.
client<llm> ClaudeStub {
  provider anthropic
  options {
    model "claude-opus-4-8"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 32000
  }
}
