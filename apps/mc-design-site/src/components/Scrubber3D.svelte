<script>
  // Before and after in 3-D, one camera for both: drag the divider to compare, drag anywhere else to rotate (the split
  // stays put on screen while the land turns under it), scroll or pinch to zoom.
  import { onMount } from "svelte";
  import { loadResources, loadBlocks, toStructure, orbitFor, createView, attachOrbit } from "../lib/deepslate.js";

  let { before, after, poster = "", label = "", beforeLabel = "Before", afterLabel = "After" } = $props();
  let wrap, cBefore, cAfter, fig;
  // shaders: sunlight, cast shadows and haze (lib/shading.js), with the sun's place in the day
  let shaders = $state(true), sun = $state(0.38), canShade = $state(false), full = $state(false);
  const applyShade = () => { for (const v of views) { v.setShaders(shaders); v.setSun(sun); } redraw(); };
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : fig.requestFullscreen?.())?.catch?.(() => {});
  let split = $state(50);
  let status = $state("loading");
  let error = $state("");
  let frame = 0, dirty = true, views = [], cam;
  const redraw = () => { dirty = true; };

  function dragSplit(e) {
    e.stopPropagation(); e.preventDefault();
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    const move = (ev) => { const r = wrap.getBoundingClientRect(); split = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)); };
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  }

  onMount(() => {
    let alive = true;
    (async () => {
      try {
        const [res, a, b] = await Promise.all([loadResources(), loadBlocks(before.src, before), loadBlocks(after.src, after)]);
        if (!alive) return;
        const size = [0, 1, 2].map((i) => Math.max(a.size[i], b.size[i]));
        cam = orbitFor(size);
        views = [createView(cBefore, toStructure(a.blocks, size), res), createView(cAfter, toStructure(b.blocks, size), res)];
        attachOrbit(wrap, cam, redraw);
        canShade = views.every((v) => v.canShade); applyShade();
        // for staged screenshots (scripts set the camera and the sun, then redraw)
        globalThis.__mcdView = { cam, redraw, sun: (t) => { sun = t; applyShade(); } };
        document.addEventListener("fullscreenchange", () => { full = document.fullscreenElement === fig; redraw(); });
        status = "ready";
        const loop = () => { if (!alive) return; if (dirty) { dirty = false; for (const v of views) v.draw(cam); } frame = requestAnimationFrame(loop); };
        loop();
        new ResizeObserver(redraw).observe(wrap);
      } catch (e) { status = "error"; error = String(e.message || e); }
    })();
    return () => { alive = false; cancelAnimationFrame(frame); };
  });
</script>

<figure class="scrubber" bind:this={fig}>
  <div class="stage" bind:this={wrap} aria-label={label ? `${label}: before and after, in 3-D` : "Before and after, in 3-D"}>
    {#if poster && status !== "ready"}<img class="poster" src={poster} alt={label} />{/if}
    <canvas bind:this={cBefore} class:hidden={status !== "ready"}></canvas>
    <canvas bind:this={cAfter} class:hidden={status !== "ready"} style="clip-path: inset(0 0 0 {split}%)"></canvas>
    {#if status === "ready"}
      <span class="tag left">{beforeLabel}</span><span class="tag right">{afterLabel}</span>
      <div class="divider" data-no-orbit style="left: {split}%" onpointerdown={dragSplit} role="presentation"><span class="knob">⟷</span></div>
    {/if}
    {#if status === "loading"}<span class="note">Loading the 3-D view…</span>{/if}
    {#if status === "error"}<span class="note">3-D view unavailable: {error}</span>{/if}
  </div>
  {#if status === "ready"}
    <figcaption>
      <label class="sr" for="split-{label}">Before / after split</label>
      <input id="split-{label}" type="range" min="0" max="100" bind:value={split} />
      {#if canShade}
        <label class="tog"><input type="checkbox" bind:checked={shaders} onchange={applyShade} /> Shaders</label>
        {#if shaders}<label class="sun">Sun <input type="range" min="0" max="1" step="0.01" bind:value={sun} oninput={applyShade} aria-label="Time of day" /></label>{/if}
      {/if}
      <button class="fsb" onclick={toggleFull}>{full ? "Exit full screen" : "Full screen"}</button>
      <span class="hint">Drag the divider to compare · drag the land to rotate · scroll to zoom</span>
    </figcaption>
  {/if}
</figure>

<style>
  .scrubber { margin: 0; display: grid; gap: 10px; }
  .stage { position: relative; aspect-ratio: 16 / 10; max-width: 100%; border-radius: 4px; overflow: hidden; background: var(--render-sky); touch-action: none; cursor: grab; user-select: none; }
  .stage:active { cursor: grabbing; }
  canvas, .poster { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .poster { object-fit: cover; }
  .hidden { visibility: hidden; }
  .divider { position: absolute; top: 0; bottom: 0; width: 28px; margin-left: -14px; cursor: ew-resize; display: grid; place-items: center; }
  .divider::before { content: ""; position: absolute; top: 0; bottom: 0; left: 13px; width: 2px; background: var(--paper); box-shadow: 0 0 0 1px rgb(0 0 0 / .25); }
  .knob { position: relative; width: 34px; height: 34px; border-radius: 50%; background: var(--paper); color: var(--ink); display: grid; place-items: center; font-size: 1rem; box-shadow: 0 1px 4px rgb(0 0 0 / .3); }
  .tag { position: absolute; top: 10px; font: 600 .72rem/1 var(--body); text-transform: uppercase; letter-spacing: .1em; background: var(--paper); color: var(--ink); padding: 5px 8px; border-radius: 3px; }
  .left { left: 10px; } .right { right: 10px; }
  .note { position: absolute; left: 12px; bottom: 10px; font-size: .85rem; color: var(--ink-soft); background: var(--paper); padding: 2px 8px; border-radius: 3px; }
  figcaption { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: .88rem; color: var(--ink-soft); }
  input[type="range"] { flex: 0 1 220px; accent-color: var(--accent); }
  .tog, .sun { display: inline-flex; gap: 6px; align-items: center; }
  .sun input { flex: 0 1 140px; }
  .fsb { font: inherit; font-weight: 600; padding: 5px 10px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); border-radius: 3px; cursor: pointer; }
  .scrubber:fullscreen { background: var(--paper); padding: 12px; display: flex; flex-direction: column; }
  .scrubber:fullscreen .stage { aspect-ratio: auto; flex: 1; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
