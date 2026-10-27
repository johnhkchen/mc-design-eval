// The desk as an MCP server: Streamable HTTP at POST /mcp, answered with plain JSON (no server-initiated
// stream). Who's calling comes from the URL: /mcp?as=client (the default), ?as=studio, ?as=owner.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const IMAGES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
const TEXTS = [".md", ".txt", ".json", ".mjs", ".js", ".csv", ".snbt", ".mcfunction", ".yml", ".yaml", ".toml"];
const INLINE_IMAGE = 4 << 20;                                      // pictures past this come back as links

export function makeMcp(desk) {
  const { HERE, KINDS, STATUSES } = desk;
  const resolve = (q) => {
    const hit = desk.allThreads().filter((t) => t.id === q || t.id.startsWith(String(q)));
    if (hit.length !== 1) throw new Error(hit.length ? `"${q}" matches ${hit.map((t) => t.id).join(", ")}` : `no thread "${q}"`);
    return desk.dirOf(hit[0].id);
  };
  const attach = (d, t, list = []) => list.map((a) => {
    const name = String(a.name || "").replace(/[^\w.-]/g, "_");
    const buf = a.data_base64 != null ? Buffer.from(a.data_base64, "base64") : Buffer.from(String(a.text ?? ""), "utf8");
    desk.saveFile(d, t, name, buf);
    return name;
  });
  const line = (s) => `${s.id}  [${s.kind}/${s.status}]  ${s.messages} message${s.messages === 1 ? "" : "s"}, last from ${s.last_from || "-"} at ${(s.updated || "").slice(0, 16)}  ${s.title}`;
  const text = (s) => ({ content: [{ type: "text", text: s }] });

  const attachmentsSchema = { type: "array", description: "Files to attach: pictures, .nbt, code, data.", items: { type: "object",
    properties: { name: { type: "string", description: "File name: letters, digits, . _ -" },
      data_base64: { type: "string", description: "File bytes, base64 (pictures, .nbt, anything binary)" },
      text: { type: "string", description: "Or the file's text, for text files" } }, required: ["name"] } };

  const tools = {
    read_brief: { description: "What the asset studio makes, what it costs, and how to ask. Read this first.", inputSchema: { type: "object", properties: {} },
      run: () => text(readFileSync(join(HERE, "BRIEF.md"), "utf8")) },
    read_protocol: { description: "How the studio and client work together: thread kinds, statuses, a request's life. Either side can propose changes in a protocol thread.",
      inputSchema: { type: "object", properties: {} }, run: () => text(readFileSync(join(HERE, "PROTOCOL.md"), "utf8")) },
    list_threads: { description: "Every thread on the desk with its kind, status and last activity.", inputSchema: { type: "object", properties: {} },
      run: () => text(desk.allThreads().map(line).join("\n") || "No threads yet.") },
    check_inbox: { description: "Threads with messages you haven't read yet.", inputSchema: { type: "object", properties: {} },
      run: (_, ctx) => text(desk.inbox(ctx.as).map(line).join("\n") || "Nothing new.") },
    read_thread: { description: "A thread's messages, with its pictures inline. Marks it read for you. The id can be its number, e.g. 0001.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      run: ({ id }, ctx) => {
        const d = resolve(id), t = desk.readThread(d), msgs = desk.readMessages(d), content = [];
        content.push({ type: "text", text: `# ${t.title}\n${t.id}  kind ${t.kind}  status ${t.status}  opened by ${t.opened_by}` });
        for (const m of msgs) {
          const links = m.attachments.map((a) => `  [file] ${a}  ${ctx.base}/files/${t.id}/${a}`).join("\n");
          content.push({ type: "text", text: `--- ${m.n} ${m.from} ${m.at}${m.status ? `  status -> ${m.status}` : ""}\n${m.body.trimEnd()}${links ? "\n" + links : ""}` });
          for (const a of m.attachments) {
            const p = join(d, "files", a), mime = IMAGES[extname(a).toLowerCase()];
            if (mime && existsSync(p) && statSync(p).size <= INLINE_IMAGE) content.push({ type: "image", data: readFileSync(p).toString("base64"), mimeType: mime });
          }
        }
        desk.markSeen(d, t, ctx.as);
        return { content };
      } },
    open_thread: { description: `Start a thread. kind: ${KINDS.join(", ")} (request: something to make; wip: integration screenshots and progress; protocol: a change to how we work; question: anything else).`,
      inputSchema: { type: "object", properties: { title: { type: "string" }, kind: { type: "string", enum: KINDS }, body: { type: "string", description: "Markdown" },
        attachments: attachmentsSchema }, required: ["title"] },
      run: ({ title, kind, body, attachments }, ctx) => {
        const id = desk.createThread({ from: ctx.as, title, kind }), d = desk.dirOf(id), t = desk.readThread(d);
        const names = attach(d, t, attachments);
        if (body || names.length) desk.addMessage(d, desk.readThread(d), { from: ctx.as, body, attachments: names });
        return text(`Opened ${id}. ${ctx.base}/desk#${id}`);
      } },
    post_message: { description: `Reply in a thread, optionally attaching files and moving its status (${STATUSES.join(", ")}; only the owner sets approved).`,
      inputSchema: { type: "object", properties: { id: { type: "string" }, body: { type: "string", description: "Markdown" },
        status: { type: "string", enum: STATUSES }, attachments: attachmentsSchema }, required: ["id"] },
      run: ({ id, body, status, attachments }, ctx) => {
        const d = resolve(id), t = desk.readThread(d);
        if (status === "approved" && ctx.as !== "owner") throw new Error("only the owner approves");
        const names = attach(d, t, attachments);
        if (!body && !names.length) throw new Error("body or attachments needed");
        const r = desk.addMessage(d, desk.readThread(d), { from: ctx.as, body, attachments: names, status });
        return text(`Posted message ${r.n} in ${t.id}${names.length ? ` with ${names.join(", ")}` : ""}.`);
      } },
    set_status: { description: `Move a thread's status: ${STATUSES.join(", ")}. Only the owner sets approved.`,
      inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string", enum: STATUSES } }, required: ["id", "status"] },
      run: ({ id, status }, ctx) => {
        const d = resolve(id), t = desk.readThread(d);
        desk.setStatus(t, status, ctx.as); t.updated = desk.now(); desk.writeThread(d, t); desk.bump();
        return text(`${t.id} is ${t.status}.`);
      } },
    get_file: { description: "Fetch a file from a thread: pictures come back as images, text files as text, anything else (e.g. .nbt) as base64 when under 4 MB, else a download link.",
      inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id", "name"] },
      run: ({ id, name }, ctx) => {
        const d = resolve(id), t = desk.readThread(d), p = join(d, "files", String(name));
        if (!desk.safe(String(name)) || !existsSync(p)) throw new Error(`no file "${name}"; files: ${readdirSync(join(d, "files")).join(", ")}`);
        const ext = extname(p).toLowerCase(), size = statSync(p).size, url = `${ctx.base}/files/${t.id}/${name}`;
        if (IMAGES[ext] && size <= INLINE_IMAGE) return { content: [{ type: "image", data: readFileSync(p).toString("base64"), mimeType: IMAGES[ext] }] };
        if (TEXTS.includes(ext)) return text(readFileSync(p, "utf8"));
        if (size <= INLINE_IMAGE) return text(`${name} (${size} bytes), base64:\n${readFileSync(p).toString("base64")}`);
        return text(`${name} is ${size} bytes; download it from ${url}`);
      } },
  };

  tools.list_shared = { description: "The shared code tree both sides read and write (shared/<lang>/...): every file with its language, author, last change, note and port_of (the file it was ported from). Read it before writing a tool the other side may already have.",
    inputSchema: { type: "object", properties: {} },
    run: () => text(desk.listShared().map((e) => `${e.path}  [${e.lang}]  ${e.bytes} B  by ${e.author}, last ${e.updated_by} ${e.updated.slice(0, 16)}${e.port_of ? `  port of ${e.port_of}` : ""}  ${e.note}`).join("\n") || "Empty.") };
  tools.read_shared = { description: "Read a file from the shared code tree, with its history.",
    inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    run: ({ path }) => {
      if (!desk.safePath(path) || !existsSync(join(desk.SHARED, path))) throw new Error(`no shared file "${path}"`);
      const e = desk.readIndex()[path] || {};
      return text(`# ${path}  (${e.lang || "?"}, by ${e.author || "?"}${e.port_of ? `, port of ${e.port_of}` : ""})\n${(e.history || []).map((h) => `- ${h.at.slice(0, 16)} ${h.by}: ${h.note}`).join("\n")}\n\n${readFileSync(join(desk.SHARED, path), "utf8")}`);
    } };
  tools.put_shared = { description: "Add or update a file in the shared code tree (git-tracked; the index records who, when and why). Put code under its language: js/, rust/, py/. When you port a file to your language, say so with port_of so both stay linked. Say in a thread when a change matters to the other side.",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "e.g. rust/check_asset/src/lib.rs or js/check-asset.mjs" },
      text: { type: "string" }, data_base64: { type: "string" }, note: { type: "string", description: "what changed and why" },
      lang: { type: "string" }, port_of: { type: "string", description: "the shared path this is a port of" } }, required: ["path", "note"] },
    run: ({ path, text: t, data_base64, note, lang, port_of }, ctx) => {
      const buf = data_base64 != null ? Buffer.from(data_base64, "base64") : Buffer.from(String(t ?? ""), "utf8");
      const e = desk.putShared(path, buf, { from: ctx.as, note, lang, port_of });
      return text(`Saved ${path} (${e.bytes} B, revision ${e.history.length}). ${ctx.base}/shared/${path}`);
    } };

  const noteLine = (n) => `${n.id} [${n.status}] ${n.asset}${n.rev != null ? ` rev ${n.rev}` : ""}${n.at ? ` at ${JSON.stringify(n.at)}` : ""}${n.storey != null ? ` storey ${n.storey}` : ""} ${n.kind}: ${n.text}${n.resolution ? `  -> resolved${n.resolved_by_rev != null ? ` by rev ${n.resolved_by_rev}` : ""}: ${n.resolution}` : ""}  (${n.author}${n.thread ? `, thread ${n.thread}` : ""})`;
  tools.annotate = { description: "Pin a note (a finding) to a cell of an asset at a revision: what's wrong or worth knowing there. Notes are searchable and resolved by a later revision. For many at once (e.g. floorplan.py --json), pass floorplan instead.",
    inputSchema: { type: "object", properties: { asset: { type: "string", description: "the structure's id or file name" }, rev: { type: "number" }, at: { type: "array", items: { type: "number" } },
      storey: { type: "number" }, kind: { type: "string", description: "e.g. unmade-bed, through-room, idle-floor, narrow, dark, flat-wall" }, text: { type: "string" }, thread: { type: "string" },
      floorplan: { type: "array", description: "floorplan.py --json output: every report's notes, pinned to its file", items: { type: "object" } } } },
    run: (a, ctx) => { const list = a.floorplan ? desk.fromFloorplan(a.floorplan, a) : [a]; return text(desk.addNotes(list, ctx.as).map(noteLine).join("\n")); } };
  tools.notes = { description: "An asset's notes (open and resolved), optionally for one revision or status.",
    inputSchema: { type: "object", properties: { asset: { type: "string" }, rev: { type: "number" }, status: { type: "string", enum: ["open", "resolved"] } }, required: ["asset"] },
    run: (a) => text(desk.listNotes(a).map(noteLine).join("\n") || "No notes.") };
  tools.search_notes = { description: "Full-text search over every note: kind, text, asset, resolution. All words must match.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, status: { type: "string", enum: ["open", "resolved"] } }, required: ["query"] },
    run: ({ query, status }) => text(desk.listNotes({ q: query, status }).map(noteLine).join("\n") || "No matches.") };
  tools.resolve_note = { description: "Mark a note resolved by a later revision, with what fixed it.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, by_rev: { type: "number" }, text: { type: "string" } }, required: ["id", "text"] },
    run: ({ id, by_rev, text: t }, ctx) => text(noteLine(desk.resolveNote(id, { by_rev, text: t, by: ctx.as }))) };

  const instructions = "The asset studio's work desk. Read the brief (read_brief) and protocol (read_protocol) first. " +
    "Open a thread for each piece of work (open_thread), attach pictures and files as base64, and check_inbox for replies. " +
    "Screenshots of deliveries running in your project are the most useful thing to send back. " +
    "Shared code lives in the shared tree (list_shared, read_shared, put_shared): both sides' tools by language, linked by port_of; check it before writing a tool.";

  function handle(msg, ctx) {
    const { id, method, params = {} } = msg || {};
    const ok = (result) => ({ jsonrpc: "2.0", id, result });
    const err = (code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
    if (!msg || msg.jsonrpc !== "2.0" || typeof method !== "string") return err(-32600, "invalid request");
    if (id === undefined) return null;                             // notifications (initialized, cancelled) need no answer
    try {
      switch (method) {
        case "initialize": return ok({ protocolVersion: VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0],
          capabilities: { tools: { listChanged: false } }, serverInfo: { name: "asset-studio", version: "0.1.0" }, instructions });
        case "ping": return ok({});
        case "tools/list": return ok({ tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) });
        case "tools/call": {
          const t = tools[params.name];
          if (!t) return err(-32602, `unknown tool ${params.name}`);
          try { return ok(t.run(params.arguments || {}, ctx)); }
          catch (e) { return ok({ content: [{ type: "text", text: e.message }], isError: true }); }
        }
        default: return err(-32601, `method not found: ${method}`);
      }
    } catch (e) { return err(-32603, e.message); }
  }

  return async (raw, ctx) => {
    let msg; try { msg = JSON.parse(raw); } catch { return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }; }
    if (Array.isArray(msg)) { const out = msg.map((m) => handle(m, ctx)).filter(Boolean); return out.length ? out : null; }
    return handle(msg, ctx);
  };
}
