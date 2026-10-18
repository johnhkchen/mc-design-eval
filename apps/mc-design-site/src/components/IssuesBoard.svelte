<script>
  // The fix system's page: open issues grouped by kind, each group selectable as a batch for one fix job; reported
  // issues from people; the jobs with their before/after counts, accepted or rejected here; and what each kind of fix
  // has achieved so far.
  import { catalogNo } from "../data/catalog-ids.js";
  import { AUTOFIX, TIERS } from "../lib/fixes.js";
  let { catalog } = $props();
  const byId = Object.fromEntries(catalog.map((e) => [e.id, e]));
  let data = $state({ issues: [], jobs: [], kinds: {} }), canWrite = $state(false), error = $state(""), loaded = $state(false);
  let picked = $state({}), notes = $state({}), tiers = $state({}), budgets = $state({}), showFixed = $state(false);
  let report = $state({ building: catalog[0]?.id ?? "", kind: "", what: "" });

  const token = () => { try { return localStorage.getItem("boardToken") || ""; } catch { return ""; } };
  const api = async (path, opts = {}) => {
    const r = await fetch(path, { ...opts, headers: { "content-type": "application/json", ...(token() ? { authorization: `Bearer ${token()}` } : {}), ...(opts.headers || {}) } });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j;
  };
  async function load() {
    try { data = await api("/api/issues"); canWrite = (await api("/api/session")).canWrite; loaded = true; error = ""; } catch (e) { error = e.message; }
  }
  $effect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); });

  const open = $derived(data.issues.filter((i) => i.status === "open"));
  // kind -> building -> issues; kinds with the most buildings first
  const groups = $derived.by(() => {
    const g = {};
    for (const i of data.issues) { if (i.status === "fixed" && !showFixed) continue; ((g[i.kind] ??= {})[i.building] ??= []).push(i); }
    return Object.entries(g).map(([kind, bs]) => ({ kind, buildings: Object.entries(bs), open: Object.values(bs).filter((is) => is.some((i) => i.status === "open")).length }))
      .sort((a, b) => b.open - a.open || a.kind.localeCompare(b.kind));
  });
  const inJob = $derived(new Set(data.jobs.filter((j) => ["queued", "running", "review"].includes(j.status)).flatMap((j) => j.buildings.map((b) => `${j.kind}|${b}`))));
  // what each kind of fix has done: jobs accepted, buildings attempted, buildings whose issues of that kind cleared
  const study = $derived.by(() => {
    const s = {};
    for (const j of data.jobs) { if (!j.result) continue; const k = (s[j.kind] ??= { jobs: 0, tried: 0, auto: 0, model: 0, escalated: 0, cost: 0, accepted: 0 });
      k.jobs++; k.cost += j.result.cost || 0; if (j.status === "accepted") k.accepted++; k.escalated += escalatable(j).length;
      k.tried += Object.keys(j.result.buildings ?? {}).length + escalatable(j).length;
      for (const r of Object.values(j.result.buildings ?? {})) if (!(r.after?.[j.kind] > 0)) { if ((r.tier ?? j.tier) === "auto") k.auto++; else k.model++; } }
    return Object.entries(s);
  });

  const toggle = (kind, b) => { const k = `${kind}|${b}`; picked = { ...picked, [k]: !picked[k] }; };
  const pickAll = (g) => { const p = { ...picked }; const on = !g.buildings.every(([b]) => p[`${g.kind}|${b}`] || inJob.has(`${g.kind}|${b}`));
    for (const [b, is] of g.buildings) if (is.some((i) => i.status === "open") && !inJob.has(`${g.kind}|${b}`)) p[`${g.kind}|${b}`] = on; picked = p; };
  const chosen = (kind) => Object.entries(picked).filter(([k, v]) => v && k.startsWith(kind + "|")).map(([k]) => k.slice(kind.length + 1));
  async function schedule(kind) {
    const tier = tiers[kind] || "auto";
    try { await api("/api/fix-jobs", { method: "POST", body: JSON.stringify({ kind, buildings: chosen(kind), note: notes[kind] || "", tier, budget: budgets[kind] ?? TIERS[tier].budget }) });
      picked = Object.fromEntries(Object.entries(picked).filter(([k]) => !k.startsWith(kind + "|"))); notes = { ...notes, [kind]: "" }; await load(); } catch (e) { error = e.message; }
  }
  // one line per message and status: the same fault at several places reads once, with its places
  const lines = (is) => { const m = new Map(); for (const i of is) { const what = i.what.replace(/\s*@?-?\d+,-?\d+,-?\d+/g, "").replace(/\s*\(\)/g, ""), key = `${i.status}|${what}`; const l = m.get(key) ?? { key, what, status: i.status, items: [], at: [] }; l.items.push(i); if (i.at) l.at.push(i.at.join(",")); m.set(key, l); } return [...m.values()]; };
  const setMany = async (items, status) => { try { for (const i of items) await api(`/api/issues/${i.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { error = e.message; } };
  const setIssue = async (id, status) => { try { await api(`/api/issues/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { error = e.message; } };
  // escalation: a person moves what code couldn't fix up to a model tier, as a new job with a cost cap
  const escalatable = (j) => (j.result?.remaining ?? []).filter((r) => !/already clear|not in the catalog/.test(r.reason)).map((r) => r.id);
  async function escalate(j, tier) {
    try { await api("/api/fix-jobs", { method: "POST", body: JSON.stringify({ kind: j.kind, buildings: escalatable(j), note: j.note, tier, budget: TIERS[tier].budget }) }); await load(); } catch (e) { error = e.message; }
  }
  const setJob = async (id, status) => { try { await api(`/api/fix-jobs/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { error = e.message; } };
  async function sendReport(ev) {
    ev.preventDefault();
    try { await api("/api/issues", { method: "POST", body: JSON.stringify(report) }); report = { ...report, what: "" }; await load(); } catch (e) { error = e.message; }
  }
  const counts = (o) => Object.entries(o || {}).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ") || "none";
  const kinds = $derived([...new Set([...Object.keys(data.kinds), ...data.issues.map((i) => i.kind)])]);
</script>

{#if error}<p class="err" role="alert">{error}</p>{/if}
{#if !loaded}<p class="muted">Loading issues…</p>{:else}
  <dl class="facts">
    <div><dt>open issues</dt><dd>{open.length}</dd></div>
    <div><dt>buildings affected</dt><dd>{new Set(open.map((i) => i.building)).size} / {catalog.length}</dd></div>
    <div><dt>kinds</dt><dd>{new Set(open.map((i) => i.kind)).size}</dd></div>
    <div><dt>fix jobs</dt><dd>{data.jobs.length}</dd></div>
  </dl>
  {#if !canWrite}<p class="muted small">Viewing is public. Scheduling fixes, waiving and reporting need the admin token (set it on the board page) until Discord sign-in.</p>{/if}

  <label class="small muted"><input type="checkbox" bind:checked={showFixed} /> show fixed issues</label>

  {#each groups as g (g.kind)}
    <section class="group">
      <header>
        <h2>{g.kind} <span class="n">{g.open} building{g.open === 1 ? "" : "s"}</span> <span class="chip" data-s={AUTOFIX.includes(g.kind) ? "fixed" : "open"}>{AUTOFIX.includes(g.kind) ? "fixed by code" : "needs a model"}</span></h2>
        {#if data.kinds[g.kind]}<p class="muted">{data.kinds[g.kind]}</p>{/if}
      </header>
      <ul class="rows">
        {#each g.buildings as [b, is] (b)}
          {@const e = byId[b]}
          {@const busy = inJob.has(`${g.kind}|${b}`)}
          <li class:done={is.every((i) => i.status !== "open")}>
            <input type="checkbox" aria-label={`Select ${e?.name ?? b}`} checked={!!picked[`${g.kind}|${b}`]} disabled={!canWrite || busy || is.every((i) => i.status !== "open")} onchange={() => toggle(g.kind, b)} />
            <a class="thumb" href={`/catalog/${b}/`}>{#if e}<img src={e.image} alt="" loading="lazy" width="64" height="64" />{/if}</a>
            <div class="what">
              <a href={`/catalog/${b}/`}><b>{e ? `No. ${catalogNo(e)} ${e.name}` : b}</b></a>
              {#if busy}<span class="chip q">in a fix job</span>{/if}
              <ul>
                {#each lines(is) as l (l.key)}
                  <li><span class="chip" data-s={l.status}>{l.status}</span> {l.what}{#if l.items.length > 1} <b>×{l.items.length}</b>{/if}{#if l.at.length} <span class="mono">@{l.at.slice(0, 6).join("; ")}{l.at.length > 6 ? "…" : ""}</span>{/if}
                    {#if canWrite && l.status === "open"}<button class="link" onclick={() => setMany(l.items, "waived")} title="Intended, not an error">waive</button>{/if}
                    {#if canWrite && l.status === "waived"}<button class="link" onclick={() => setMany(l.items, "open")}>reopen</button>{/if}
                  </li>
                {/each}
              </ul>
            </div>
          </li>
        {/each}
      </ul>
      {#if canWrite && g.open}
        <div class="batch">
          <button class="ghost" onclick={() => pickAll(g)}>Select all</button>
          <input type="text" placeholder="Note for the fixer (optional): how to fix it" bind:value={notes[g.kind]} />
          <select bind:value={tiers[g.kind]} aria-label="Who fixes it">{#each Object.entries(TIERS) as [t, info] (t)}<option value={t}>{info.label}</option>{/each}</select>
          {#if (tiers[g.kind] || "auto") !== "auto"}<label class="small">cap $<input class="cap" type="number" min="0.1" max="20" step="0.1" bind:value={budgets[g.kind]} placeholder={TIERS[tiers[g.kind]].budget} /></label>{/if}
          <button class="btn" disabled={!chosen(g.kind).length} onclick={() => schedule(g.kind)}>Schedule fix for {chosen(g.kind).length || "…"}</button>
          {#if !AUTOFIX.includes(g.kind) && (tiers[g.kind] || "auto") === "auto"}<span class="small muted">No code fixer for this kind yet: an auto job comes straight back for escalation.</span>{/if}
        </div>
      {/if}
    </section>
  {/each}

  <section class="group">
    <h2>Fix jobs</h2>
    {#if !data.jobs.length}<p class="muted">None yet. Select buildings with the same issue above and schedule a fix: one revision fixes them together.</p>{/if}
    {#each data.jobs as j (j.id)}
      <article class="job">
        <header><span class="chip" data-s={j.status}>{j.status}</span> <span class="chip">{j.tier === "auto" || !j.tier ? "code" : j.tier}{j.budget ? ` · cap $${j.budget}` : ""}</span> <b>{j.kind}</b> · {j.buildings.length} building{j.buildings.length === 1 ? "" : "s"} <span class="muted mono">{j.id} · {new Date(j.createdAt).toLocaleString()}</span></header>
        {#if j.note}<p class="muted">“{j.note}”</p>{/if}
        {#if j.result?.buildings}
          <p class="small muted">{j.result.summary ?? ""} {#if j.result.cost != null}· ${j.result.cost.toFixed(2)}{/if}{#if j.result.minutes} · {j.result.minutes} min{/if}</p>
          <div class="cands">
            {#each Object.entries(j.result.buildings) as [b, r] (b)}
              <figure>
                {#if r.image}<img src={r.image} alt={`${byId[b]?.name ?? b} after the fix`} loading="lazy" />{/if}
                <figcaption><b>{byId[b]?.name ?? b}</b><br /><span class="small">before: {counts(r.before)}<br />after: {counts(r.after)}</span></figcaption>
              </figure>
            {/each}
          </div>
        {:else}<p class="small muted">Buildings: {j.buildings.map((b) => byId[b]?.name ?? b).join(", ")}</p>{/if}
        {#if j.result?.remaining?.length}
          <ul class="small muted rem">{#each j.result.remaining as r (r.id)}<li>{byId[r.id]?.name ?? r.id}: {r.reason}</li>{/each}</ul>
        {/if}
        {#if canWrite && escalatable(j).length && ["escalate", "review", "accepted", "rejected"].includes(j.status) && !data.jobs.some((o) => o.createdAt > j.createdAt && o.kind === j.kind && o.tier !== "auto" && escalatable(j).every((b) => o.buildings.includes(b)))}
          <div class="batch"><span class="small">Escalate the {escalatable(j).length} left:</span>
            <button class="ghost" onclick={() => escalate(j, "haiku")}>Escalate to Haiku (cap ${TIERS.haiku.budget})</button>
            <button class="ghost" onclick={() => escalate(j, "sonnet")}>Escalate to Sonnet (cap ${TIERS.sonnet.budget})</button></div>
        {/if}
        {#if j.result?.error}<p class="err">{j.result.error}</p>{/if}
        {#if canWrite && j.status === "review"}
          <div class="batch"><button class="btn" onclick={() => setJob(j.id, "accepted")}>Accept into the catalog</button><button class="ghost" onclick={() => setJob(j.id, "rejected")}>Reject</button></div>
        {/if}
      </article>
    {/each}
  </section>

  {#if study.length}
    <section class="group">
      <h2>What the fixes have done</h2>
      <div class="scroll"><table>
        <thead><tr><th>kind</th><th>jobs</th><th>buildings tried</th><th>cleared by code</th><th>cleared by a model</th><th>left for escalation</th><th>accepted</th><th>model cost</th></tr></thead>
        <tbody>{#each study as [k, s] (k)}<tr><td>{k}</td><td>{s.jobs}</td><td>{s.tried}</td><td>{s.auto}</td><td>{s.model}</td><td>{s.escalated}</td><td>{s.accepted}</td><td>${s.cost.toFixed(2)}</td></tr>{/each}</tbody>
      </table></div>
    </section>
  {/if}

  {#if canWrite}
    <section class="group">
      <h2>Report an issue</h2>
      <p class="muted">For what the checks can't see: a roof that doesn't read as its style, ragged dormers, a colour that's off.</p>
      <form class="report" onsubmit={sendReport}>
        <label>Building <select bind:value={report.building}>{#each catalog as e (e.id)}<option value={e.id}>No. {catalogNo(e)} {e.name}</option>{/each}</select></label>
        <label>Kind <input list="kinds" bind:value={report.kind} placeholder="e.g. roof doesn't read" required /></label>
        <datalist id="kinds">{#each kinds as k (k)}<option value={k}></option>{/each}</datalist>
        <label class="wide">What's wrong <input bind:value={report.what} placeholder="the gambrel's knee doesn't show from the street" required /></label>
        <button class="btn" type="submit">Report</button>
      </form>
    </section>
  {/if}
{/if}

<style>
  .facts { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-block: 1px solid var(--rule); }
  .facts div { padding: 14px 16px; display: grid; gap: 2px; }
  .facts div + div { border-left: 1px solid var(--rule); }
  .facts dt { font: 600 .72rem/1.3 var(--body); text-transform: uppercase; letter-spacing: .12em; color: var(--ink-soft); }
  .facts dd { margin: 0; font: 600 1.6rem/1.1 var(--display); order: -1; font-variant-numeric: tabular-nums; }
  @media (max-width: 640px) { .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .facts div:nth-child(3) { border-left: 0; } .facts div:nth-child(n+3) { border-top: 1px solid var(--rule); } }
  .group { display: grid; gap: 12px; padding-block: 24px; border-bottom: 1px solid var(--rule); }
  .group h2 { font-size: 1.4rem; text-transform: capitalize; }
  .n { font: 500 .85rem/1 var(--body); color: var(--ink-soft); text-transform: none; }
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .rows > li { display: grid; grid-template-columns: auto 64px minmax(0, 1fr); gap: 12px; align-items: start; }
  .rows > li.done { opacity: .6; }
  .thumb img { width: 64px; height: 64px; border-radius: 3px; background: var(--render-sky); object-fit: cover; }
  .what ul { margin: 4px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: .9rem; }
  .what a { color: inherit; text-decoration: none; }
  .chip { display: inline-block; font: 600 .68rem/1 var(--body); text-transform: uppercase; letter-spacing: .08em; padding: 3px 6px; border-radius: 3px; border: 1px solid var(--rule); color: var(--ink-soft); }
  .chip[data-s="open"], .chip[data-s="queued"] { color: var(--mark); border-color: var(--mark); }
  .chip[data-s="fixed"], .chip[data-s="accepted"] { color: var(--accent); border-color: var(--accent); }
  .chip[data-s="running"], .chip[data-s="review"], .chip.q { color: var(--ink); border-color: var(--ink); }
  .mono { font-family: var(--mono); font-size: .8rem; color: var(--ink-soft); }
  .batch { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .batch input { flex: 1 1 240px; min-width: 0; }
  input[type="text"], input:not([type]), select { font: inherit; padding: 8px 10px; border: 1px solid var(--rule); border-radius: 3px; background: var(--sheet); color: var(--ink); }
  button.ghost { font: 600 .9rem/1 var(--body); padding: 10px 14px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); border-radius: 3px; cursor: pointer; }
  button.btn { cursor: pointer; } button.btn:disabled { opacity: .5; cursor: default; }
  button.link { font: inherit; font-size: .8rem; background: none; border: 0; color: var(--accent); text-decoration: underline; cursor: pointer; padding: 0 4px; }
  .job { display: grid; gap: 6px; padding-block: 10px; border-top: 1px solid var(--rule); }
  .cands { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr)); gap: 14px; }
  .cands figure { margin: 0; display: grid; gap: 4px; }
  .cands img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 3px; background: var(--render-sky); }
  .small { font-size: .85rem; }
  .err { color: var(--mark); }
  .cap { width: 5em; }
  .rem { margin: 0; padding-left: 1.2em; }
  .report { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 10px; align-items: end; }
  .report label { display: grid; gap: 4px; font-size: .85rem; color: var(--ink-soft); }
  .report .wide { grid-column: 1 / -1; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; font-size: .9rem; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 12px 6px 0; border-bottom: 1px solid var(--rule); }
  th { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-soft); }
</style>
