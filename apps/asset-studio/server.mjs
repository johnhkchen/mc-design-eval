#!/usr/bin/env node
// Asset studio: a work desk between this pipeline (the studio) and a client project (the mod agent).
// Everything lives in files under threads/, so git holds the whole history: requests, messages, WIP
// pictures, deliverables. Agents connect over MCP at /mcp; people use the desk at /desk; / explains how to
// connect. No dependencies. Binds 127.0.0.1; reach it on the tailnet through
//   tailscale serve --bg --https=8650 http://127.0.0.1:5190
//
//   node server.mjs [--port 5190] [--commit]
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { makeMcp } from "./mcp.mjs";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync, createReadStream } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const THREADS = join(HERE, "threads");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg("--port", process.env.STUDIO_PORT || 5190);
const MAX_UPLOAD = 50 << 20;                                       // 50 MB a file
const KINDS = ["request", "wip", "protocol", "question"];
const STATUSES = ["open", "planned", "approved", "building", "delivered", "closed", "parked"];
const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".md": "text/markdown; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".nbt": "application/octet-stream", ".zip": "application/zip", ".mp4": "video/mp4" };

mkdirSync(THREADS, { recursive: true });
let version = Date.now();                                          // bumped on every write; /api/wait long-polls on it
const waiters = new Set();
const bump = () => { version++; for (const w of waiters) w(); waiters.clear(); scheduleCommit(); };

// --commit: a quiet minute after the last write, commit threads/ (only that path) so git keeps every exchange
const COMMIT = process.argv.includes("--commit");
let commitTimer = null;
function scheduleCommit() {
  if (!COMMIT) return;
  clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    const git = (...a) => spawnSync("git", a, { cwd: HERE, encoding: "utf8" });
    git("add", "--", "threads", "shared");
    if (git("diff", "--cached", "--quiet", "--", "threads", "shared").status === 0) return;
    const r = git("commit", "-q", "-m", `asset studio: desk activity ${now().slice(0, 16)}`, "--", "threads", "shared");
    if (r.status) { console.error(`commit failed, retrying: ${(r.stderr || "").trim()}`); scheduleCommit(); }
  }, 60000);
}

const now = () => new Date().toISOString();
const safe = (s) => /^[\w][\w.-]{0,120}$/.test(s) && !s.includes("..");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "thread";
const who = (s) => (String(s || "").toLowerCase().match(/^[a-z][\w-]{0,31}$/) || [null])[0];

const dirOf = (id) => safe(id) && existsSync(join(THREADS, id, "thread.json")) ? join(THREADS, id) : null;
const readThread = (d) => JSON.parse(readFileSync(join(d, "thread.json"), "utf8"));
const writeThread = (d, t) => writeFileSync(join(d, "thread.json"), JSON.stringify(t, null, 2) + "\n");

// a message file: front matter (from, at, attachments, status) then the markdown body
function readMessages(d) {
  const md = join(d, "messages");
  if (!existsSync(md)) return [];
  return readdirSync(md).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const txt = readFileSync(join(md, f), "utf8");
    const m = txt.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const head = m ? Object.fromEntries(m[1].split("\n").map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2]])) : {};
    return { n: parseInt(f), file: f, from: head.from, at: head.at, status: head.status || undefined,
      attachments: head.attachments ? head.attachments.split(",").map((s) => s.trim()).filter(Boolean) : [], body: m ? m[2] : txt };
  });
}

function addMessage(d, t, { from, body, attachments = [], status }) {
  if (status === "approved" && from !== "owner") throw new Error("only the owner approves");
  const msgs = readMessages(d), n = (msgs.at(-1)?.n || 0) + 1;
  const att = attachments.filter((a) => safe(a) && existsSync(join(d, "files", a)));
  mkdirSync(join(d, "messages"), { recursive: true });
  const head = [`from: ${from}`, `at: ${now()}`, att.length && `attachments: ${att.join(", ")}`, status && `status: ${status}`].filter(Boolean);
  const file = `${String(n).padStart(4, "0")}-${from}.md`;
  writeFileSync(join(d, "messages", file), `---\n${head.join("\n")}\n---\n${String(body || "").trimEnd()}\n`);
  if (status) setStatus(t, status, from);
  t.updated = now(); t.seen = { ...(t.seen || {}), [from]: n };
  writeThread(d, t); bump();
  return { n, file, attachments: att };
}

function setStatus(t, status, by) {
  if (!STATUSES.includes(status) || t.status === status) return;
  if (status === "approved" && by !== "owner") throw new Error("only the owner approves");
  t.status = status; (t.history ||= []).push({ status, by, at: now() });
}

function summary(id) {
  const d = join(THREADS, id), t = readThread(d), msgs = readMessages(d), last = msgs.at(-1);
  return { id, title: t.title, kind: t.kind, status: t.status, opened_by: t.opened_by, created: t.created, updated: t.updated,
    messages: msgs.length, last_from: last?.from, seen: t.seen || {} };
}
const allThreads = () => readdirSync(THREADS).filter((f) => existsSync(join(THREADS, f, "thread.json"))).sort().map(summary);

function createThread({ from, title, kind, body }) {
  const seq = allThreads().reduce((m, s) => Math.max(m, parseInt(s.id) || 0), 0) + 1;
  const id = `${String(seq).padStart(4, "0")}-${slug(title)}`, d = join(THREADS, id);
  mkdirSync(join(d, "files"), { recursive: true });
  const t = { id, title: String(title).slice(0, 200), kind: KINDS.includes(kind) ? kind : "request", status: "open", opened_by: from,
    created: now(), updated: now(), history: [{ status: "open", by: from, at: now() }], seen: {} };
  writeThread(d, t);
  if (body) addMessage(d, t, { from, body }); else bump();
  return id;
}

function saveFile(d, t, name, buf) {
  if (!safe(name)) throw new Error("file names: letters, digits, . _ -");
  mkdirSync(join(d, "files"), { recursive: true });
  writeFileSync(join(d, "files", name), buf); t.updated = now(); writeThread(d, t); bump();
}

function markSeen(d, t, as) { t.seen = { ...(t.seen || {}), [as]: readMessages(d).at(-1)?.n || 0 }; writeThread(d, t); }

// threads with a message from someone else after `as` last read or wrote
const inbox = (as) => allThreads().filter((s) => {
  if (!s.messages) return false;
  const msgs = readMessages(join(THREADS, s.id)), seen = s.seen[as] || 0;
  return msgs.some((m) => m.n > seen && m.from !== as);
});

// the address the caller used (tailscale serve passes the ts.net host through), for links in tool results
const baseUrl = (req) => `${req.headers["x-forwarded-proto"] || (req.headers.host?.includes(".ts.net") ? "https" : "http")}://${req.headers["x-forwarded-host"] || req.headers.host}`;

let mcpFn = null;                                                 // built on first use, after everything below is defined
const mcp = (...a) => (mcpFn ||= makeMcp({ HERE, KINDS, STATUSES, safe, dirOf, readThread, readMessages, allThreads, inbox, summary,
  createThread, addMessage, setStatus, writeThread, saveFile, markSeen, bump, now, SHARED, safePath, putShared, listShared, readIndex }))(...a);

// ---- shared code: a tree both sides read and write (shared/<lang>/...), with an index of who, when, why
const SHARED = join(HERE, "shared"), INDEX = join(SHARED, "index.json");
mkdirSync(SHARED, { recursive: true });
const safePath = (p) => typeof p === "string" && /^[\w][\w./-]{0,200}$/.test(p) && !p.split("/").some((s) => s === ".." || s === "" || s.startsWith(".")) && p !== "index.json";
const readIndex = () => (existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : {});
function putShared(path, buf, { from, note, lang, port_of }) {
  if (!safePath(path)) throw new Error("path: letters, digits, . _ - /, no ..");
  const f = join(SHARED, path); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, buf);
  const idx = readIndex(), prev = idx[path];
  idx[path] = { path, lang: lang || prev?.lang || extname(path).slice(1), author: prev?.author || from, updated: now(), updated_by: from,
    note: note || prev?.note || "", port_of: port_of || prev?.port_of, bytes: buf.length,
    history: [...(prev?.history || []), { at: now(), by: from, note: note || "", bytes: buf.length }].slice(-50) };
  writeFileSync(INDEX, JSON.stringify(idx, null, 2) + "\n"); bump();
  return idx[path];
}
const listShared = () => Object.values(readIndex()).map(({ history, ...e }) => ({ ...e, revisions: history?.length || 0 }));

// ---- http
const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body, null, 2) + "\n" : body);
};
const fail = (res, code, msg) => send(res, code, { error: msg });
const body = (req, limit = 1 << 20) => new Promise((ok, no) => {
  const chunks = []; let n = 0;
  req.on("data", (c) => { n += c.length; if (n > limit) { no(new Error("too large")); req.destroy(); } else chunks.push(c); });
  req.on("end", () => ok(Buffer.concat(chunks))); req.on("error", no);
});
const json = async (req) => { const b = await body(req); try { return JSON.parse(b.toString() || "{}"); } catch { throw new Error("bad json"); } };
const file = (res, p) => {
  if (!existsSync(p) || !statSync(p).isFile()) return fail(res, 404, "not found");
  res.writeHead(200, { "content-type": TYPES[extname(p).toLowerCase()] || "application/octet-stream", "content-length": statSync(p).size });
  createReadStream(p).pipe(res);
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"), p = url.pathname.split("/").filter(Boolean).map(decodeURIComponent), M = req.method;
  try {
    if (M === "GET" && p.length === 0) return file(res, join(HERE, "public", "index.html"));
    if (M === "GET" && p[0] === "desk" && p.length === 1) return file(res, join(HERE, "public", "desk.html"));
    if (M === "GET" && p[0] === "health") return send(res, 200, { ok: true, threads: allThreads().length });
    if (p[0] === "mcp" && p.length === 1) {
      if (M !== "POST") return send(res, 405, { error: "POST JSON-RPC here (Streamable HTTP, JSON responses; no server stream)" });
      const raw = await body(req, MAX_UPLOAD * 1.5);
      const out = await mcp(raw.toString(), { as: who(url.searchParams.get("as")) || "client", base: baseUrl(req) });
      if (out === null) { res.writeHead(202); return res.end(); }
      res.writeHead(200, { "content-type": "application/json", "mcp-session-id": req.headers["mcp-session-id"] || "desk" });
      return res.end(JSON.stringify(out));
    }
    if (M === "GET" && p.length === 1 && ["brief", "protocol", "readme"].includes(p[0])) return file(res, join(HERE, p[0].toUpperCase() + ".md"));
    if (M === "GET" && p[0] === "studio.mjs") return file(res, join(HERE, "studio.mjs"));
    if (M === "GET" && p[0] === "shared" && p.length > 1) { const sp = p.slice(1).join("/"); return safePath(sp) ? file(res, join(SHARED, sp)) : fail(res, 404, "not found"); }
    if (M === "GET" && p[0] === "tools" && p.length === 2 && safe(p[1]) && p[1].endsWith(".mjs")) return file(res, join(HERE, "tools", p[1]));
    if (M === "GET" && p[0] === "files" && p.length === 3) { const d = dirOf(p[1]); return d && safe(p[2]) ? file(res, join(d, "files", p[2])) : fail(res, 404, "not found"); }
    if (p[0] !== "api") return fail(res, 404, "not found");

    if (M === "GET" && p[1] === "wait") {                          // long-poll: returns when anything changes, or after 25 s
      const since = +url.searchParams.get("since") || 0;
      if (version > since) return send(res, 200, { version });
      const w = () => send(res, 200, { version }); waiters.add(w);
      const tm = setTimeout(() => { waiters.delete(w); send(res, 200, { version }); }, 25000);
      return req.on("close", () => { clearTimeout(tm); waiters.delete(w); });
    }
    if (M === "GET" && p[1] === "inbox") { const as = who(url.searchParams.get("as")); return as ? send(res, 200, inbox(as)) : fail(res, 400, "?as=<name> needed"); }
    if (p[1] === "shared") {
      if (M === "GET" && p.length === 2) return send(res, 200, listShared());
      if (M === "PUT" && p.length > 2) {
        const sp = p.slice(2).join("/"), from = who(url.searchParams.get("from"));
        if (!from) return fail(res, 400, "?from=<name> needed");
        const buf = await body(req, MAX_UPLOAD);
        return send(res, 201, putShared(sp, buf, { from, note: url.searchParams.get("note"), lang: url.searchParams.get("lang"), port_of: url.searchParams.get("port_of") }));
      }
      return fail(res, 404, "not found");
    }
    if (M === "GET" && p[1] === "meta") return send(res, 200, { kinds: KINDS, statuses: STATUSES, version });
    if (p[1] !== "threads") return fail(res, 404, "not found");

    if (p.length === 2 && M === "GET") return send(res, 200, allThreads());
    if (p.length === 2 && M === "POST") {
      const b = await json(req), from = who(b.from);
      if (!from || !b.title) return fail(res, 400, "from and title needed");
      return send(res, 201, summary(createThread({ from, title: b.title, kind: b.kind, body: b.body })));
    }

    const d = dirOf(p[2]);
    if (!d) return fail(res, 404, "no such thread");
    const t = readThread(d);
    if (p.length === 3 && M === "GET") return send(res, 200, { ...summary(p[2]), history: t.history, messages: readMessages(d),
      files: existsSync(join(d, "files")) ? readdirSync(join(d, "files")).filter(safe) : [] });
    if (p.length === 3 && M === "PATCH") {
      const b = await json(req), by = who(b.by);
      if (!by || !STATUSES.includes(b.status)) return fail(res, 400, `by and status (${STATUSES.join("|")}) needed`);
      setStatus(t, b.status, by); t.updated = now(); writeThread(d, t); bump();
      return send(res, 200, summary(p[2]));
    }
    if (p[3] === "messages" && M === "POST") {
      const b = await json(req), from = who(b.from);
      if (!from || !(b.body || b.attachments?.length)) return fail(res, 400, "from and body (or attachments) needed");
      return send(res, 201, addMessage(d, t, { from, body: b.body, attachments: b.attachments || [], status: STATUSES.includes(b.status) ? b.status : undefined }));
    }
    if (p[3] === "seen" && M === "POST") {
      const as = who((await json(req)).as); if (!as) return fail(res, 400, "as needed");
      markSeen(d, t, as);
      return send(res, 200, { ok: true });
    }
    if (p[3] === "files" && p.length === 5 && M === "PUT") {
      if (!safe(p[4])) return fail(res, 400, "file names: letters, digits, . _ -");
      const buf = await body(req, MAX_UPLOAD);
      saveFile(d, t, p[4], buf);
      return send(res, 201, { name: p[4], bytes: buf.length, url: `/files/${p[2]}/${p[4]}` });
    }
    return fail(res, 404, "not found");
  } catch (e) { return fail(res, e.message === "too large" ? 413 : 400, e.message); }
}).listen(PORT, "127.0.0.1", () => console.log(`asset studio on http://127.0.0.1:${PORT} (threads in ${THREADS})`));
