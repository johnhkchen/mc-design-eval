// A late-1990s glass-and-concrete office tower on a seven-storey stone podium, the Commercial Bay kind. The lidar's
// 168-block diagonal spine is one slim ~40-storey tower (glass curtain, white fins, a mast); the 136/100/80/60/40 steps
// are setbacks stepping in to the 28-block podium; the south-west wing is one storey. The lidar roofs are smoothed to
// those tiers (nearest). Hollow: one block of shell, air behind the glass, a floor slab per storey, a slab under every
// shell cell that stands on air. Shopfronts and a double door on the low east face; warm glowstone and shroomlight in
// some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667911.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 48, D = 34, H = 181;
const DATUM = 6, STOREY = 4;                                  // floor lines at y = 6, 10, 14 ...
const TIERS = [20, 28, 40, 60, 80, 100, 136, 168];            // the lidar roofs smoothed to these tops

const nearestTier = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

// Each footprint cell: its ground and its top (layers built; the roof cap is at top - 1). A lean-to where the lidar
// sees no building above the ground gets one storey.
const plan = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = roof <= ground + 3 ? ground + 4 : Math.max(nearestTier(roof), ground + 4);
  plan.set(`${x},${z}`, { x, z, g: ground, top });
}
const at = (x, z) => plan.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.top ?? 0;                   // outside the footprint nothing stands
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];              // E, W, S, N

// The shell: a cell with a neighbour that has no building at this layer, so the walls run round every layer.
const shell = (x, z, y) => DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const floorLine = (y) => y >= DATUM && (y - DATUM) % STOREY === 0;

// The shell's material at a layer: base course, stone ground storey, then 4-high storeys (slab, two glass rows, sill).
function facade(c, y) {
  const { x, z, g: ground, top } = c;
  const out = DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
  const u = out.some(([dx]) => dx) ? z : x;                    // position along the face
  const low = ground <= 2 && out.some(([dx]) => dx === 1);     // the low east face is the shopfront
  if (y === ground) return { block: "polished_andesite" };      // base course
  if (y < DATUM) {
    if (y === DATUM - 1) return { block: "light_gray_concrete" };
    if (u % 3 === 0) return { block: low ? "white_concrete" : "stone_bricks" };
    return low ? { block: "light_blue_stained_glass" } : { pane: true };
  }
  const m = (y - DATUM) % STOREY;
  if (m === 0) return { block: "light_gray_concrete" };         // floor line
  if (m === 3) return { block: "white_concrete" };              // sill and head
  const fin = top >= 100 ? u % 4 === 0 : u % 3 === 0;          // tower curtain wall has wider glass
  return fin ? { block: "white_concrete" } : { pane: true };
}

const g = new Voxels([W, H, D]);
const panes = [];                                             // glass panes, connected after the rest is set
const lights = [];                                            // window rows that get a warm light behind them

// The entrance: two cells on the low east face nearest the middle of the face.
const east = [...plan.values()].filter((c) => c.g <= 1 && topAt(c.x + 1, c.z) === 0);
const eastAt = new Map(east.map((c) => [c.z, c]));
const pair = east.filter((c) => eastAt.has(c.z + 1)).sort((a, b) => Math.abs(a.z - D / 2) - Math.abs(b.z - D / 2))[0];
const doorAt = new Map();                                     // "x,y,z" -> door block state
if (pair) for (const c of [pair, eastAt.get(pair.z + 1)]) {
  doorAt.set(`${c.x},${c.g},${c.z}`, { block: "dark_oak_door", state: { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } });
  doorAt.set(`${c.x},${c.g + 1},${c.z}`, { block: "dark_oak_door", state: { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" } });
  doorAt.set(`${c.x},${c.g + 2},${c.z}`, { block: "stone_bricks" });   // lintel over the doors
}

for (const c of plan.values()) {
  const { x, z, g: ground, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }          // foundation to the ground
    const door = doorAt.get(`${x},${y},${z}`);
    if (door) { g.set(x, y, z, door.block, door.state); continue; }
    if (y === top - 1) { g.set(x, y, z, shell(x, z, y) ? "stone_bricks" : "smooth_stone"); continue; }   // roof cap, cornice on the edge
    if (shell(x, z, y)) {
      const f = facade(c, y);
      if (f.pane) { g.set(x, y, z, "light_blue_stained_glass_pane"); panes.push({ x, y, z }); }
      else g.set(x, y, z, f.block);
      if (f.pane && (y - DATUM) % STOREY === 1 && (x * 7 + y * 3 + z) % 9 === 0) {
        const out = DIRS.find(([dx, dz]) => topAt(x + dx, z + dz) <= y);   // the room behind this window
        const ix = x - out[0], iz = z - out[1];
        if (!shell(ix, iz, y) && topAt(ix, iz) > y) lights.push({ x: ix, y, z: iz, block: (x + z) % 2 ? "glowstone" : "shroomlight" });
      }
      continue;
    }
    // Inside: a floor at ground level and at each floor line, and a ceiling under any shell standing above (no hanging).
    if (y === ground || floorLine(y) || shell(x, z, y + 1)) g.set(x, y, z, "light_gray_concrete");
  }
  if (shell(x, z, top - 1) && top < H) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// Roof plant: 2x2 boxes on the low roofs, interior cells only, with an iron grille on top.
for (const c of plan.values()) {
  const { x, z, top } = c;
  if (top > 60 || shell(x, z, top - 1) || (x * 3 + z * 5) % 13 !== 0) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].map(([a, b]) => at(a, b));
  if (block.some((b) => !b || b.top !== top || shell(b.x, b.z, top - 1))) continue;
  for (const b of block) {
    g.set(b.x, top, b.z, "light_gray_concrete"); g.set(b.x, top + 1, b.z, "light_gray_concrete");
    g.set(b.x, top + 2, b.z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
  }
}

// The tower's mast: iron bars and a lightning rod on the highest cell nearest the spine's middle.
const tall = [...plan.values()].filter((c) => c.top >= 160);
if (tall.length) {
  const mx = tall.reduce((s, c) => s + c.x, 0) / tall.length, mz = tall.reduce((s, c) => s + c.z, 0) / tall.length;
  const m = tall.sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz))[0];
  for (let y = m.top; y < m.top + 4; y++) g.set(m.x, y, m.z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  g.set(m.x, m.top + 4, m.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

for (const l of lights) g.set(l.x, l.y, l.z, l.block);

// Panes join their neighbours in the wall: a pane is connected to any block beside it on the same layer.
const occupied = (x, y, z) => g.val(x, y, z) !== 0;
for (const p of panes) {
  const { x, y, z } = p;
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: String(occupied(x, y, z - 1)), south: String(occupied(x, y, z + 1)),
    east: String(occupied(x + 1, y, z)), west: String(occupied(x - 1, y, z)), waterlogged: "false",
  });
}

console.log(g.save(`${DIR}/way_292667911.nbt`));
