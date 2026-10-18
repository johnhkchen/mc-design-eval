<script>
  // The fix system's page, run like a bakery: a cake that comes out wrong in a way code can repair gets a button (fixed
  // by code, accepted here into the catalog); one that can't is tagged, and the tagged ones of a kind are studied
  // together for why the recipe keeps making them. Studies gather their evidence by code; a model reads it only when a
  // person asks, with a cost cap. An accepted study is a recipe change to make in the plugin.
  import { catalogNo } from "../data/catalog-ids.js";
  import { AUTOFIX, TIERS } from "../lib/fixes.js";
  let { catalog } = $props();
  const byId = Object.fromEntries(catalog.map((e) => [e.id, e]));
  let data = $state({ issues: [], jobs: [], kinds: {} }), canWrite = $state(false), error = $state(""), loaded = $state(false);
  let notes = $state({}), showFixed = $state(false), busy = $state({});
  let report = $state({ building: catalog[0]?.id ?? "", kind: "", what: "" });

  const token = () => { try { return localStorage.getItem("boardToken") || ""; } catch { return ""; } };
  const api = async (path, opts = {}) => {
    const r = await fetch(path, { ...opts, headers: { "content-type": "application/json", ...(token() ? { authorization: `Bearer ${token()}` } : {}), ...(opts.headers || {}) } });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j;
  };
  async function load() {
    try { data = await api("/api/issues"); canWrite = (await api("/api/session")).canWrite; loaded = true; error = ""; } catch (e) { error = e.message; }
  }
  $effect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); });

  const typeOf = (j) => j.type ?? "fix";
  const fixJobs = $derived(data.jobs.filter((j) => typeOf(j) === "fix")), studies = $derived(data.jobs.filter((j) => typeOf(j) === "study"));
  const open = $derived(data.issues.filter((i) => i.status === "open"));
  const active = (j) => ["queued", "running"].includes(j.status);
  const inJob = $derived(new Set(fixJobs.filter((j) => active(j) || j.status === "review").flatMap((j) => j.buildings.map((b) => `${j.kind}|${b}`))));
  // what code tried and couldn't fix (the latest fix job of the kind that listed the building): tagged for study
  const codeFailed = $derived.by(() => { const m = new Map();
    for (const j of [...fixJobs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      for (const b of Object.keys(j.result?.buildings ?? {})) m.delete(`${j.kind}|${b}`);
      for (const r of j.result?.remaining ?? []) if (!/already clear|not in the catalog/.test(r.reason)) m.set(`${j.kind}|${r.id}`, r.reason); }
    return m; });
  const fixable = (i) => AUTOFIX.includes(i.kind) && !codeFailed.has(`${i.kind}|${i.building}`);
  // kind -> building -> issues, for one section; kinds with the most buildings first
  const groupBy = (issues) => { const g = {};
    for (const i of issues) ((g[i.kind] ??= {})[i.building] ??= []).push(i);
    return Object.entries(g).map(([kind, bs]) => ({ kind, buildings: Object.entries(bs), open: Object.values(bs).filter((is) => is.some((i) => i.status === "open")).length }))
      .sort((a, b) => b.open - a.open || a.kind.localeCompare(b.kind)); };
  const shown = (i) => i.status !== "fixed" || showFixed;
  const fixGroups = $derived(groupBy(data.issues.filter((i) => shown(i) && i.status !== "waived" && fixable(i))));
  const studyGroups = $derived(groupBy(data.issues.filter((i) => shown(i) && !fixable(i))));
  // how often a kind has come out, ever (fixed ones count: they came out that way too); waived ones were intended
  const history = (kind) => { const is = data.issues.filter((i) => i.kind === kind && i.status !== "waived" && byId[i.building]), series = {};
    for (const b of new Set(is.map((i) => i.building))) series[byId[b].series] = (series[byId[b].series] || 0) + 1;
    return { buildings: [...new Set(is.map((i) => i.building))], open: new Set(is.filter((i) => i.status === "open").map((i) => i.building)).size, fixed: new Set(is.filter((i) => i.status === "fixed").map((i) => i.building)).size, series }; };
  const latestStudy = (kind) => studies.filter((j) => j.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const evidence = (kind) => latestStudy(kind).find((j) => j.result?.packet && j.status !== "failed");

  const fixList = (g) => g.buildings.filter(([b, is]) => is.some((i) => i.status === "open") && !inJob.has(`${g.kind}|${b}`)).map(([b]) => b);
  async function post(job, key) {
    busy = { ...busy, [key]: true };
    try { await api("/api/fix-jobs", { method: "POST", body: JSON.stringify(job) }); await load(); } catch (e) { error = e.message; } finally { busy = { ...busy, [key]: false }; }
  }
  const fix = (g) => post({ type: "fix", kind: g.kind, buildings: fixList(g) }, `fix|${g.kind}`);
  const study = (kind, tier) => post({ type: "study", kind, buildings: history(kind).buildings, note: notes[kind] || "", tier, budget: TIERS[tier].budget }, `study|${kind}|${tier}`);
  // one line per message and status: the same fault at several places reads once, with its places
  const lines = (is) => { const m = new Map(); for (const i of is) { const what = i.what.replace(/\s*@?-?\d+,-?\d+,-?\d+/g, "").replace(/\s*\(\)/g, ""), key = `${i.status}|${what}`; const l = m.get(key) ?? { key, what, status: i.status, items: [], at: [] }; l.items.push(i); if (i.at) l.at.push(i.at.join(",")); m.set(key, l); } return [...m.values()]; };
  const setMany = async (items, status) => { try { for (const i of items) await api(`/api/issues/${i.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { error = e.message; } };
  const setJob = async (id, status) => { try { await api(`/api/fix-jobs/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { error = e.message; } };
  async function sendReport(ev) {
    ev.preventDefault();
    try { await api("/api/issues", { method: "POST", body: JSON.stringify(report) }); report = { ...report, what: "" }; await load(); } catch (e) { error = e.message; }
  }
  const counts = (o) => Object.entries(o || {}).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ") || "none";
  const kinds = $derived([...new Set([...Object.keys(data.kinds), ...data.issues.map((i) => i.kind)])]);
  const recipe = $derived(studies.filter((j) => j.status === "accepted" && j.result?.diagnosis));
  // per kind: how often it came out, what code fixed (accepted), what's tagged, what the studies cost
  const tally = $derived.by(() => { const s = {};
    for (const k of new Set(data.issues.filter((i) => i.status !== "waived").map((i) => i.kind))) { const h = history(k);
      s[k] = { buildings: h.buildings.length, open: h.open, code: 0, tagged: new Set(open.filter((i) => i.kind === k && !fixable(i)).map((i) => i.building)).size, studies: 0, cost: 0 }; }
    for (const j of fixJobs) if (j.status === "accepted" && s[j.kind]) s[j.kind].code += Object.keys(j.result?.buildings ?? {}).length;
    for (const j of studies) if (s[j.kind]) { s[j.kind].studies++; s[j.kind].cost += j.result?.cost || 0; }
    return Object.entries(s).sort((a, b) => b[1].buildings - a[1].buildings); });
</script>

{#snippet rows(g)}
  <ul class="rows">
    {#each g.buildings as [b, is] (b)}
      {@const e = byId[b]}
      <li class:done={is.every((i) => i.status !== "open")}>
        <a class="thumb" href={`/catalog/${b}/`}>{#if e}<img src={e.image} alt="" loading="lazy" width="64" height="64" />{/if}</a>
        <div class="what">
          <a href={`/catalog/${b}/`}><b>{e ? `No. ${catalogNo(e)} ${e.name}` : b}</b></a>
          {#if inJob.has(`${g.kind}|${b}`)}<span class="chip q">being fixed</span>{/if}
          {#if codeFailed.has(`${g.kind}|${b}`)}<span class="chip">code couldn't: {codeFailed.get(`${g.kind}|${b}`)}</span>{/if}
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
{/snippet}

{#snippet diagnosis(d)}
  <dl class="diag">
    <div><dt>where</dt><dd><b>{d.where}</b></dd></div>
    <div><dt>why</dt><dd>{d.cause}</dd></div>
    {#if d.change?.what}<div><dt>change</dt><dd><span class="mono">{d.change.file}</span> {d.change.what}</dd></div>{/if}
    {#if d.fixer}<div><dt>a code fixer?</dt><dd>{d.fixer}</dd></div>{/if}
    {#if d.check}<div><dt>the check</dt><dd>{d.check}</dd></div>{/if}
    {#if d.evidence?.length}<div><dt>evidence</dt><dd><ul>{#each d.evidence as ev, k (k)}<li class="mono">{ev}</li>{/each}</ul></dd></div>{/if}
  </dl>
{/snippet}

{#if error}<p class="err" role="alert">{error}</p>{/if}
{#if !loaded}<p class="muted">Loading issues…</p>{:else}
  <dl class="facts">
    <div><dt>open issues</dt><dd>{open.length}</dd></div>
    <div><dt>code can fix</dt><dd>{new Set(open.filter(fixable).map((i) => `${i.kind}|${i.building}`)).size}</dd></div>
    <div><dt>tagged for study</dt><dd>{new Set(open.filter((i) => !fixable(i)).map((i) => `${i.kind}|${i.building}`)).size}</dd></div>
    <div><dt>buildings affected</dt><dd>{new Set(open.map((i) => i.building)).size} / {catalog.length}</dd></div>
  </dl>
  {#if !canWrite}<p class="muted small">Viewing is public. Fixing, studying, waiving and reporting need the admin token (set it on the board page) until Discord sign-in.</p>{/if}
  <label class="small muted"><input type="checkbox" bind:checked={showFixed} /> show fixed issues</label>

  <section class="part">
    <h2 class="sec">Fix by code</h2>
    <p class="muted">Kinds the toolkit repairs without a model. A fix is kept only when the checks show it cleared and nothing else got worse, and it joins the catalog when you accept it below.</p>
    {#if !fixGroups.length}<p class="small muted">Nothing open that code can fix.</p>{/if}
    {#each fixGroups as g (g.kind)}
      <section class="group">
        <header class="head">
          <div><h3>{g.kind} <span class="n">{g.open} building{g.open === 1 ? "" : "s"}</span></h3>{#if data.kinds[g.kind]}<p class="muted">{data.kinds[g.kind]}</p>{/if}</div>
          {#if canWrite && fixList(g).length}<button class="btn" disabled={busy[`fix|${g.kind}`]} onclick={() => fix(g)}>Fix {fixList(g).length} by code</button>{/if}
        </header>
        {@render rows(g)}
      </section>
    {/each}
  </section>

  <section class="part">
    <h2 class="sec">Tagged for study</h2>
    <p class="muted">What code can't fix isn't fixed one building at a time. Each kind is studied across every build that came out this way, to find where in the recipe it comes from: the brief, the planner, the crews, the toolkit, or the check itself. Gathering the evidence is code; a model reads it only when you ask, with the cap shown.</p>
    {#if !studyGroups.length}<p class="small muted">Nothing tagged.</p>{/if}
    {#each studyGroups as g (g.kind)}
      {@const h = history(g.kind)}
      {@const ev = evidence(g.kind)}
      {@const last = latestStudy(g.kind)[0]}
      <section class="group">
        <header class="head">
          <div><h3>{g.kind} <span class="n">{g.open} open</span></h3>{#if data.kinds[g.kind]}<p class="muted">{data.kinds[g.kind]}</p>{/if}
            <p class="small">Came out this way in {h.buildings.length} building{h.buildings.length === 1 ? "" : "s"} ({Object.entries(h.series).map(([k, n]) => `${k} ${n}`).join(", ")}){h.fixed ? `, ${h.fixed} fixed since` : ""}.</p></div>
        </header>
        {@render rows(g)}
        {#if last?.result?.diagnosis}<div class="study"><p class="small muted">{last.tier} read the evidence ({last.status}{last.result.cost ? `, $${last.result.cost.toFixed(2)}` : ""}):</p>{@render diagnosis(last.result.diagnosis)}</div>{/if}
        {#if canWrite && h.buildings.length}
          {@const running = latestStudy(g.kind).some(active)}
          <div class="batch">
            {#if running}<span class="chip q">studying…</span>
            {:else if !ev}<button class="ghost" disabled={busy[`study|${g.kind}|auto`]} onclick={() => study(g.kind, "auto")}>Gather the evidence (no model)</button>
            {:else}
              <a class="small" href={ev.result.packet} target="_blank" rel="noopener">The evidence ({ev.result.counts?.occurrences} occurrences)</a>
              <input type="text" placeholder="A note for the reader (optional)" bind:value={notes[g.kind]} />
              <button class="ghost" disabled={busy[`study|${g.kind}|haiku`]} onclick={() => study(g.kind, "haiku")}>Ask Haiku why (cap ${TIERS.haiku.budget})</button>
              <button class="ghost" disabled={busy[`study|${g.kind}|sonnet`]} onclick={() => study(g.kind, "sonnet")}>Ask Sonnet why (cap ${TIERS.sonnet.budget})</button>
              <button class="link" onclick={() => study(g.kind, "auto")}>gather again</button>
            {/if}
          </div>
        {/if}
      </section>
    {/each}
  </section>

  {#if recipe.length}
    <section class="part">
      <h2 class="sec">Recipe changes to make</h2>
      <p class="muted">Diagnoses you accepted: changes to the plugin so these stop coming out.</p>
      {#each recipe as j (j.id)}<article class="job"><header><b>{j.kind}</b> <span class="muted mono">{j.id}</span></header>{@render diagnosis(j.result.diagnosis)}</article>{/each}
    </section>
  {/if}

  <section class="part">
    <h2 class="sec">Jobs</h2>
    {#if !data.jobs.length}<p class="muted">None yet.</p>{/if}
    {#each data.jobs as j (j.id)}
      <article class="job">
        <header><span class="chip" data-s={j.status}>{j.status}</span> <span class="chip">{typeOf(j)} · {j.tier === "auto" || !j.tier ? "code" : j.tier}{j.budget ? ` · cap $${j.budget}` : ""}</span> <b>{j.kind}</b> · {j.buildings.length} building{j.buildings.length === 1 ? "" : "s"} <span class="muted mono">{j.id} · {new Date(j.createdAt).toLocaleString()}</span></header>
        {#if j.note}<p class="muted">“{j.note}”</p>{/if}
        {#if j.result?.summary}<p class="small muted">{j.result.summary}{#if j.result.cost} · ${j.result.cost.toFixed(2)}{/if}{#if j.result.minutes} · {j.result.minutes} min{/if}{#if j.result.stopped} · stopped: {j.result.stopped}{/if}</p>{/if}
        {#if typeOf(j) === "fix" && j.result?.buildings && Object.keys(j.result.buildings).length}
          <div class="cands">
            {#each Object.entries(j.result.buildings) as [b, r] (b)}
              <figure>
                {#if r.image}<img src={r.image} alt={`${byId[b]?.name ?? b} after the fix`} loading="lazy" />{/if}
                <figcaption><b>{byId[b]?.name ?? b}</b><br /><span class="small">before: {counts(r.before)}<br />after: {counts(r.after)}</span></figcaption>
              </figure>
            {/each}
          </div>
        {/if}
        {#if j.result?.remaining?.length}<ul class="small muted rem">{#each j.result.remaining as r (r.id)}<li>{byId[r.id]?.name ?? r.id}: {r.reason}</li>{/each}</ul>{/if}
        {#if typeOf(j) === "study" && j.result?.packet}<p class="small"><a href={j.result.packet} target="_blank" rel="noopener">The evidence</a></p>{/if}
        {#if j.result?.error}<p class="err">{j.result.error}</p>{/if}
        {#if canWrite && j.status === "review" && typeOf(j) === "fix"}
          <div class="batch"><button class="btn" onclick={() => setJob(j.id, "accepted")}>Accept into the catalog</button><button class="ghost" onclick={() => setJob(j.id, "rejected")}>Reject</button></div>
        {/if}
        {#if canWrite && j.status === "review" && typeOf(j) === "study" && j.result?.diagnosis}
          <div class="batch"><button class="btn" onclick={() => setJob(j.id, "accepted")}>Accept: a recipe change to make</button><button class="ghost" onclick={() => setJob(j.id, "rejected")}>Reject</button></div>
        {/if}
      </article>
    {/each}
  </section>

  {#if tally.length}
    <section class="part">
      <h2 class="sec">By kind</h2>
      <div class="scroll"><table>
        <thead><tr><th>kind</th><th>buildings ever</th><th>open</th><th>fixed by code</th><th>tagged</th><th>studies</th><th>study cost</th></tr></thead>
        <tbody>{#each tally as [k, s] (k)}<tr><td>{k}</td><td>{s.buildings}</td><td>{s.open}</td><td>{s.code}</td><td>{s.tagged}</td><td>{s.studies}</td><td>${s.cost.toFixed(2)}</td></tr>{/each}</tbody>
      </table></div>
    </section>
  {/if}

  {#if canWrite}
    <section class="part">
      <h2 class="sec">Report an issue</h2>
      <p class="muted">For what the checks can't see: a roof that doesn't read as its style, ragged dormers, a colour that's off. Reports are tagged for study with the rest.</p>
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
  .part { display: grid; gap: 8px; padding-block: 28px 8px; }
  .sec { font-size: 1.6rem; }
  .group { display: grid; gap: 12px; padding-block: 20px; border-top: 1px solid var(--rule); }
  .group h3 { font-size: 1.25rem; text-transform: capitalize; margin: 0; }
  .head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: start; }
  .head > div { min-width: 0; flex: 1 1 280px; display: grid; gap: 4px; }
  .head p { margin: 0; }
  .study { display: grid; gap: 6px; padding: 12px 14px; border-left: 3px solid var(--accent); background: var(--sheet); }
  .study p { margin: 0; }
  .diag { margin: 0; display: grid; gap: 6px; font-size: .9rem; }
  .diag div { display: grid; grid-template-columns: 9em minmax(0, 1fr); gap: 10px; }
  .diag dt { font: 600 .72rem/1.6 var(--body); text-transform: uppercase; letter-spacing: .1em; color: var(--ink-soft); }
  .diag dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  .diag ul { margin: 0; padding-left: 1.1em; }
  @media (max-width: 520px) { .diag div { grid-template-columns: minmax(0, 1fr); gap: 0; } }
  .n { font: 500 .85rem/1 var(--body); color: var(--ink-soft); text-transform: none; }
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .rows > li { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 12px; align-items: start; }
  .rows > li.done { opacity: .6; }
  .thumb img { width: 64px; height: 64px; border-radius: 3px; background: var(--render-sky); object-fit: cover; }
  .what ul { margin: 4px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: .9rem; }
  .what a { color: inherit; text-decoration: none; }
  .chip { display: inline-block; font: 600 .68rem/1 var(--body); text-transform: uppercase; letter-spacing: .08em; padding: 3px 6px; border-radius: 3px; border: 1px solid var(--rule); color: var(--ink-soft); }
  .chip[data-s="open"], .chip[data-s="queued"] { color: var(--mark); border-color: var(--mark); }
  .chip[data-s="fixed"], .chip[data-s="accepted"] { color: var(--accent); border-color: var(--accent); }
  .chip[data-s="tagged"] { color: var(--ink); }
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
  .rem { margin: 0; padding-left: 1.2em; }
  .report { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 10px; align-items: end; }
  .report label { display: grid; gap: 4px; font-size: .85rem; color: var(--ink-soft); }
  .report .wide { grid-column: 1 / -1; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; font-size: .9rem; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 12px 6px 0; border-bottom: 1px solid var(--rule); }
  th { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-soft); }
</style>
