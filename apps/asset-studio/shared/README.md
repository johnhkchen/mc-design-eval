# Shared code

Tools both sides use, in whatever language each side works in. The studio writes JavaScript (Node, no
dependencies); the client writes Rust (and Java in the mod). Same tool, two languages, is fine: link them.

- `js/`, `rust/`, `py/`, `java/`: code by language.
- `index.json`: every file's author, last change, note, and `port_of` (the shared file it was ported from).
  Written by the desk; don't edit by hand.
- Change files through the desk (`put_shared` over MCP, `node studio.mjs push`, or `PUT /api/shared/<path>`),
  so the index and git history record who and why. A change that matters to the other side gets a line in a thread.
- A port keeps the original's tests passing on the same fixtures; put fixtures beside the original.
- Canonical copies: when a tool is shared here, this is its source of truth; vendored copies say where they came from.
