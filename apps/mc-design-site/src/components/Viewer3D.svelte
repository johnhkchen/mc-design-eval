<script>
  // One build in 3-D: drag to rotate, scroll or pinch to zoom, right-drag to pan. With `cannon`, a scrubber places the
  // blocks in schematicannon order, so you can watch it print.
  import { onMount } from "svelte";
  import { loadResources, loadBlocks, toStructure, cannonOrder, orbitFor, createView, attachOrbit } from "../lib/deepslate.js";

  let { src, poster = "", label = "", cannon = false, secPerBlock = 1.5 } = $props();
  let canvas, wrap;
  let status = $state("loading");
  let error = $state("");
  let shown = $state(0);
  let total = $state(0);
  let playing = $state(false);

  let view, cam, ordered = [], size, frame = 0, dirty = true, timer = 0;
  const redraw = () => { dirty = true; };
  const fmt = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

  function setShown(n) {
    shown = n;
    view.setStructure(toStructure(ordered.slice(0, n), size));
    redraw();
  }
  function play() {
    if (playing) { playing = false; clearInterval(timer); return; }
    if (shown >= total) setShown(0);
    playing = true;
    const step = Math.max(1, Math.round(total / 240));
    timer = setInterval(() => { if (shown >= total) { playing = false; clearInterval(timer); return; } setShown(Math.min(total, shown + step)); }, 40);
  }

  onMount(() => {
    let alive = true;
    (async () => {
      try {
        const [res, data] = await Promise.all([loadResources(), loadBlocks(src)]);
        if (!alive) return;
        size = data.size; ordered = cannonOrder(data.blocks); total = shown = ordered.length;
        cam = orbitFor(size);
        view = createView(canvas, toStructure(ordered, size), res);
        attachOrbit(wrap, cam, redraw);
        status = "ready";
        const loop = () => { if (!alive) return; if (dirty) { dirty = false; view.draw(cam); } frame = requestAnimationFrame(loop); };
        loop();
        new ResizeObserver(redraw).observe(wrap);
      } catch (e) { status = "error"; error = String(e.message || e); }
    })();
    return () => { alive = false; cancelAnimationFrame(frame); clearInterval(timer); };
  });
</script>

<figure class="viewer">
  <div class="stage" bind:this={wrap} aria-label={label ? `3-D view of ${label}` : "3-D view"}>
    {#if poster && status !== "ready"}<img class="poster" src={poster} alt={label} />{/if}
    <canvas bind:this={canvas} class:hidden={status !== "ready"}></canvas>
    {#if status === "loading"}<span class="note">Loading the 3-D view…</span>{/if}
    {#if status === "error"}<span class="note">3-D view unavailable: {error}</span>{/if}
  </div>
  {#if status === "ready"}
    <figcaption>
      {#if cannon}
        <button class="play" onclick={play} aria-label={playing ? "Pause" : "Watch the schematicannon place it"}>{playing ? "Pause" : "▶ Print"}</button>
        <input type="range" min="0" max={total} value={shown} oninput={(e) => setShown(+e.currentTarget.value)} aria-label="Blocks placed" />
        <span class="mono">{shown.toLocaleString()} / {total.toLocaleString()} blocks · {fmt(shown * secPerBlock)} of cannon time</span>
      {:else}
        <span class="hint">Drag to rotate · scroll to zoom · right-drag to pan</span>
      {/if}
    </figcaption>
  {/if}
</figure>

<style>
  .viewer { margin: 0; display: grid; gap: 10px; }
  .stage { position: relative; aspect-ratio: 4 / 3; max-width: 100%; border-radius: 4px; overflow: hidden; background: var(--sky); touch-action: none; cursor: grab; }
  .stage:active { cursor: grabbing; }
  canvas, .poster { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .poster { object-fit: contain; }
  .hidden { visibility: hidden; }
  .note { position: absolute; left: 12px; bottom: 10px; font-size: .85rem; color: var(--ink-soft); background: var(--paper); padding: 2px 8px; border-radius: 3px; }
  figcaption { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: .88rem; color: var(--ink-soft); }
  input[type="range"] { flex: 1 1 200px; accent-color: var(--accent); }
  .play { font: inherit; font-weight: 600; padding: 6px 12px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); border-radius: 3px; cursor: pointer; }
  .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
</style>
