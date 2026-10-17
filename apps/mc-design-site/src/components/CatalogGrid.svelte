<script>
  // The catalog, filterable by building type.
  let { entries } = $props();
  const types = ["all", ...new Set(entries.map((e) => e.type))];
  let type = $state("all");
  const shown = $derived(type === "all" ? entries : entries.filter((e) => e.type === type));
</script>

<div class="filters" role="group" aria-label="Filter by type">
  {#each types as t}
    <button class:on={type === t} aria-pressed={type === t} onclick={() => (type = t)}>{t}</button>
  {/each}
</div>
<div class="cards">
  {#each shown as e (e.id)}
    <a class="card" href={`/catalog/${e.id}/`}>
      <div class="thumb"><img src={e.image} alt={e.name} loading="lazy" width="525" height="525" /></div>
      <span class="eyebrow"><span class="no">No. {e.id.split("-")[1]}</span> · {e.type}</span>
      <h3>{e.name}</h3>
      <span class="spec">{e.footprint.join(" × ")} plot · {e.blocks.toLocaleString()} blocks</span>
    </a>
  {/each}
</div>

<style>
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  button { font: 500 .85rem/1 var(--body); text-transform: capitalize; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--rule); background: var(--sheet); color: var(--ink); cursor: pointer; }
  button.on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
</style>
