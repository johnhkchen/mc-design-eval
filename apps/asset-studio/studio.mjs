#!/usr/bin/env node
// Command line for the asset studio, the same file for both sides. Node 18+, no dependencies.
// Get it from the desk itself:  curl -O https://johns-mac-mini.emerald-wage.ts.net:8650/studio.mjs
//
//   STUDIO_URL  the desk (default https://johns-mac-mini.emerald-wage.ts.net:8650)
//   STUDIO_AS   who you are: client, studio, owner (default client)
//
//   node studio.mjs list                              every thread, newest activity last
//   node studio.mjs inbox                             threads with messages you haven't read
//   node studio.mjs show 0001                         a thread and its messages (marks it read)
//   node studio.mjs open "Title" [--kind request|wip|protocol|question] [--body "..." | --body-file f.md] [pictures...]
//   node studio.mjs say 0001 [--body "..." | --body-file f.md] [--status s] [pictures...]
//   node studio.mjs status 0001 approved
//   node studio.mjs get 0001 [dir]                    download a thread's files
//   node studio.mjs watch                             print a line for each new message from someone else (runs forever)
//   node studio.mjs brief | protocol                  print the studio's brief or the working protocol
//   node studio.mjs annotate <asset> <x,y,z> <kind> "text" [--rev n] [--storey n] [--thread id]
//   node studio.mjs annotate-bulk <floorplan.json> [--rev n] [--thread id]    every note in a floorplan.py --json report
//   node studio.mjs notes <asset> [--status open]     an asset's notes
//   node studio.mjs search "words"                    full-text search over every note
//   node studio.mjs resolve <N-0001> "what fixed it" [--rev n]
//   node studio.mjs shared                            the shared code tree (both sides' tools, by language)
//   node studio.mjs pull <shared path> [dest]         fetch a shared file
//   node studio.mjs push <file> <shared path> --note "why" [--port-of <shared path>] [--lang rust]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";

const argv = process.argv.slice(2), flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith("--") ? (flags[argv[i].slice(2)] = argv[++i]) : pos.push(argv[i]);
const URL_ = (flags.url || process.env.STUDIO_URL || "https://johns-mac-mini.emerald-wage.ts.net:8650").replace(/\/$/, "");
const AS = flags.as || process.env.STUDIO_AS || "client";
const [cmd, ...rest] = pos;

async function api(method, path, data, raw) {
  const r = await fetch(URL_ + path, { method, body: raw ?? (data && JSON.stringify(data)),
    headers: raw ? { "content-type": "application/octet-stream" } : { "content-type": "application/json" } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${t.trim()}`);
  try { return JSON.parse(t); } catch { return t; }
}
const resolve = async (q) => {
  const all = await api("GET", "/api/threads"), hit = all.filter((t) => t.id === q || t.id.startsWith(q));
  if (hit.length !== 1) throw new Error(hit.length ? `"${q}" matches ${hit.map((t) => t.id).join(", ")}` : `no thread "${q}"`);
  return hit[0].id;
};
const text = () => flags["body-file"] ? readFileSync(flags["body-file"], "utf8") : flags.body;
const upload = async (id, paths) => {
  const names = [];
  for (const p of paths) {
    const name = basename(p).replace(/[^\w.-]/g, "_");
    await api("PUT", `/api/threads/${id}/files/${encodeURIComponent(name)}`, null, readFileSync(p));
    names.push(name);
  }
  return names;
};
const line = (t) => `${t.id}  [${t.kind}/${t.status}]  ${t.messages} msg${t.messages === 1 ? "" : "s"}, last ${t.last_from || "-"} ${(t.updated || "").slice(0, 16)}  ${t.title}`;

const cmds = {
  async list() { for (const t of await api("GET", "/api/threads")) console.log(line(t)); },
  async inbox() { const ts = await api("GET", `/api/inbox?as=${AS}`); console.log(ts.length ? ts.map(line).join("\n") : "nothing new"); },
  async show([q]) {
    const id = await resolve(q), t = await api("GET", `/api/threads/${id}`);
    console.log(`# ${t.title}\n${t.id}  kind ${t.kind}  status ${t.status}  opened by ${t.opened_by}\n`);
    for (const m of t.messages) {
      console.log(`--- ${m.n} ${m.from} ${m.at}${m.status ? `  -> ${m.status}` : ""}`);
      if (m.body.trim()) console.log(m.body.trimEnd());
      for (const a of m.attachments) console.log(`  [file] ${URL_}/files/${id}/${a}`);
      console.log();
    }
    await api("POST", `/api/threads/${id}/seen`, { as: AS });
  },
  async open([title, ...files]) {
    if (!title) throw new Error('open "Title" [files...]');
    const t = await api("POST", "/api/threads", { from: AS, title, kind: flags.kind });
    const names = await upload(t.id, files), body = text();
    if (body || names.length) await api("POST", `/api/threads/${t.id}/messages`, { from: AS, body, attachments: names });
    console.log(`opened ${t.id}  ${URL_}/desk#${t.id}`);
  },
  async say([q, ...files]) {
    const id = await resolve(q), names = await upload(id, files);
    const r = await api("POST", `/api/threads/${id}/messages`, { from: AS, body: text(), attachments: names, status: flags.status });
    console.log(`posted ${id} #${r.n}${names.length ? ` with ${names.join(", ")}` : ""}`);
  },
  async status([q, s]) { const id = await resolve(q); console.log(line(await api("PATCH", `/api/threads/${id}`, { status: s, by: AS }))); },
  async get([q, dir]) {
    const id = await resolve(q), t = await api("GET", `/api/threads/${id}`), out = dir || id;
    mkdirSync(out, { recursive: true });
    for (const f of t.files) {
      const r = await fetch(`${URL_}/files/${id}/${encodeURIComponent(f)}`);
      writeFileSync(join(out, f), Buffer.from(await r.arrayBuffer())); console.log(join(out, f));
    }
  },
  async watch() {
    const seen = new Map((await api("GET", "/api/threads")).map((t) => [t.id, t.messages]));
    let v = (await api("GET", "/api/meta")).version;
    console.log(`watching ${URL_} as ${AS}`);
    for (;;) {
      try {
        v = (await api("GET", `/api/wait?since=${v}`)).version;
        for (const t of await api("GET", "/api/threads")) {
          if (t.messages > (seen.get(t.id) ?? 0) && t.last_from !== AS) console.log(`new: ${line(t)}`);
          seen.set(t.id, t.messages);
        }
      } catch (e) { console.error(`watch: ${e.message}`); await new Promise((r) => setTimeout(r, 10000)); }
    }
  },
  async annotate([asset, at, kind, t]) {
    if (!asset || !t) throw new Error('annotate <asset> <x,y,z> <kind> "text"');
    for (const n of await api("POST", "/api/notes", { from: AS, asset, at: at && at !== "-" ? at.split(",").map(Number) : null, kind, text: t, rev: flags.rev != null ? +flags.rev : null, storey: flags.storey != null ? +flags.storey : null, thread: flags.thread })) console.log(n.id);
  },
  async "annotate-bulk"([file]) {
    const r = await api("POST", "/api/notes", { from: AS, floorplan: JSON.parse(readFileSync(file, "utf8")), rev: flags.rev != null ? +flags.rev : null, thread: flags.thread });
    console.log(`${r.length} notes: ${r.map((n) => n.id).join(" ")}`);
  },
  async notes([asset]) { for (const n of await api("GET", `/api/notes?asset=${encodeURIComponent(asset)}${flags.status ? `&status=${flags.status}` : ""}`)) console.log(`${n.id} [${n.status}] ${n.asset}${n.at ? " " + n.at.join(",") : ""} ${n.kind}: ${n.text}${n.resolution ? ` -> ${n.resolution}` : ""}`); },
  async search([q]) { for (const n of await api("GET", `/api/notes?q=${encodeURIComponent(q)}`)) console.log(`${n.id} [${n.status}] ${n.asset} ${n.kind}: ${n.text}`); },
  async resolve([id, t]) { console.log(JSON.stringify(await api("POST", `/api/notes/${id}/resolve`, { by: AS, text: t, by_rev: flags.rev != null ? +flags.rev : null }))); },
  async shared() { for (const e of await api("GET", "/api/shared")) console.log(`${e.path}  [${e.lang}]  ${e.bytes} B  ${e.updated_by} ${e.updated.slice(0, 16)}${e.port_of ? `  port of ${e.port_of}` : ""}  ${e.note}`); },
  async pull([path, dest]) {
    const r = await fetch(`${URL_}/shared/${path}`); if (!r.ok) throw new Error(`no shared file ${path}`);
    const out = dest || basename(path); writeFileSync(out, Buffer.from(await r.arrayBuffer())); console.log(out);
  },
  async push([file, path]) {
    if (!file || !path || !flags.note) throw new Error('push <file> <shared path> --note "why"');
    const q = new URLSearchParams({ from: AS, note: flags.note, ...(flags.lang ? { lang: flags.lang } : {}), ...(flags["port-of"] ? { port_of: flags["port-of"] } : {}) });
    const e = await api("PUT", `/api/shared/${path}?${q}`, null, readFileSync(file));
    console.log(`${path}: revision ${e.history.length}`);
  },
  async brief() { console.log(await api("GET", "/brief")); },
  async protocol() { console.log(await api("GET", "/protocol")); },
};

if (!cmds[cmd]) { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n")); process.exit(cmd ? 1 : 0); }
cmds[cmd](rest).catch((e) => { console.error(e.message); process.exit(1); });
