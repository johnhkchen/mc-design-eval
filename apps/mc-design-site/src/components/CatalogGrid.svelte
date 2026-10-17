<script>
  import CatalogCard from "./CatalogCard.svelte";
  // The catalog, filterable by building type.
  let { entries } = $props();
  const types = ["all", ...new Set(entries.map((e) => e.type))];
  const count = (t) => (t === "all" ? entries.length : entries.filter((e) => e.type === t).length);
  let type = $state("all");
  const shown = $derived(type === "all" ? entries : entries.filter((e) => e.type === type));
</script>

<div class="filters" role="group" aria-label="Filter by type">
  {#each types as t}
    <button class:on={type === t} aria-pressed={type === t} onclick={() => (type = t)}>{t} <span class="n">{count(t)}</span></button>
  {/each}
</div>
<div class="cards">
  {#each shown as e (e.id)}
    <CatalogCard {e} />
  {/each}
</div>

<style>
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  button { font: 500 .85rem/1 var(--body); text-transform: capitalize; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--rule); background: var(--sheet); color: var(--ink); cursor: pointer; }
  .n { font-family: var(--mono); font-size: .78em; opacity: .7; }
  button.on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
</style>
