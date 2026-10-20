// Pier, pilings and decks: deck y3 on every footprint cell, pilings on the edge ring, low dock + slab ramp, pools, planters.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { groundAt, onFootprint, LOW_DOCK, SEAL_POOL, TIDE_POOL, PLANTERS, SPRUCE_PLANKS, STRIPPED_SPRUCE_LOG, DARK_OAK_PLANKS, poolRim, planterTree } from "../vocab.mjs";

export function build(g) {
  const L = LOW_DOCK;
  const inDock = (x, z) => x >= L.x0 && x <= L.x1 && z >= L.z0 && z <= L.z1;
  const cells = [];
  for (let x = 0; x < 120; x++) for (let z = 0; z < 172; z++) if (onFootprint(x, z)) cells.push([x, z]);
  // the ground is laid before the parts, so the deck is written over it; logs carry it down where the ground is lower
  for (const [x, z] of cells) {
    const gr = groundAt(x, z);
    const y = inDock(x, z) && gr < 3 ? L.deckY : 3;
    for (let yy = gr + 1; yy < y; yy++) g.set(x, yy, z, ...B.log("stripped_spruce", "y"));
    g.set(x, y, z, SPRUCE_PLANKS);
  }
  // 2-wide ramp up to the main deck: top slabs, half a step above the dock deck
  for (let x = L.ramp.x0; x <= L.ramp.x1; x++) for (let z = L.ramp.z0; z <= L.ramp.z1; z++)
    if (onFootprint(x, z) && groundAt(x, z) < 3) g.set(x, L.deckY, z, ...B.slab("spruce", "top"));
  // pilings: every 4th cell on the outer ring and on the ring one in
  const edge = (x, z, k) => { for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (Math.abs(dx) + Math.abs(dz) === k || k === 1) { if (!onFootprint(x + dx, z + dz) && (Math.abs(dx) === k || Math.abs(dz) === k) && (k === 1 ? Math.abs(dx) + Math.abs(dz) === 1 : true)) return true; } return false; };
  for (const [x, z] of cells) {
    if ((x + z) % 4) continue;
    if (!(edge(x, z, 1) || edge(x, z, 2))) continue;
    const y = inDock(x, z) && groundAt(x, z) < 3 ? L.deckY : 3;
    for (let yy = 0; yy < y; yy++) g.set(x, yy, z, ...B.log("stripped_spruce", "y"));
    g.set(x, y, z, DARK_OAK_PLANKS);
  }
  const pool = (P) => { const r = P.rim; poolRim(g, [r.x0, r.z0, r.x1, r.z1], 4, 5); };
  pool(SEAL_POOL); pool(TIDE_POOL);
  for (const [x, z] of PLANTERS) {
    let ok = true;
    for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) if (!onFootprint(x + dx, z + dz)) ok = false;
    if (!ok) continue; // 3x3 must stand on deck, never float
    g.set(x + 1, 4, z + 1, ...B.log("oak", "y")); // the palette has no dirt: the log goes first, so the helper's dirt is refused
    planterTree(g, x, z);
  }
}
