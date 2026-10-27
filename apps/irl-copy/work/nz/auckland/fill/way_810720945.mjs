// Seascape: a 1990s glass office tower on a stone podium, its roof stepping down through the lidar tiers from a 240-block
// crown (the highest roofs) to 200, 160 and 120, with lower wings at 80 and 40. Lidar roof heights are median-filtered over
// 5x5 and snapped to those tiers, so each tier is flat. Walls are a one-block skin with a floor slab every 4 blocks and air
// behind the glass: blue-green panes in white concrete spandrels and light-grey mullions; the ground storey is clear shopfront
// under a stone fascia with a centred entrance; some windows show glowstone; a plant box and an aviation light sit on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const ID = "way_810720945";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 72, H = 252, D = 52;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(`${x},${z}`, { x, z, gr, roof });
const inFp = (x, z) => cell.has(`${x},${z}`);

// lidar roof (blocks above y 0) at or above a threshold -> its flat tier; below 30 blocks, a three-storey podium
const TIERS = [[220, 240], [180, 200], [150, 160], [110, 120], [60, 80], [30, 40]];
const tierTop = (m) => (TIERS.find(([min]) => m >= min) ?? [0, 12])[1];
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const top = new Map();
for (const c of cell.values()) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = cell.get(`${c.x + dx},${c.z + dz}`); if (n) near.push(n.roof); }
  top.set(`${c.x},${c.z}`, tierTop(median(near)));
}
const Tof = (x, z) => (inFp(x, z) ? top.get(`${x},${z}`) : -1);

// the faces of a footprint cell at height y that show to air: a neighbour outside, or one whose wall has ended below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || y >= Tof(x + dx, z + dz));
const lit = (x, y, z) => (x * 7 + z * 13 + Math.floor(y / 4) * 5) % 5 === 0;
// a pane runs along the face it sits in: on an x-facing face it runs along z, and the reverse
const pane = (missX) => {
  const a = missX ? "true" : "false", b = missX ? "false" : "true";
  return { east: b, north: a, south: a, west: b, waterlogged: "false" };
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const c of cell.values()) {
  const { x, z, gr } = c, Tc = top.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // the foundation, so nothing floats on the slope
  for (let y = gr; y < Tc; y++) {
    const ex = exposed(x, z, y), skin = ex.length > 0;
    if (y === gr) { put(x, y, z, skin ? "polished_andesite" : "smooth_quartz"); continue; }   // base course, then the floor
    if (y === Tc - 1) { put(x, y, z, skin ? "smooth_stone" : "gray_concrete"); continue; }   // coping, and the roof deck inside
    if (y === Tc - 2) { if (skin) put(x, y, z, "white_concrete"); continue; }               // parapet band
    const yy = y % 4;
    if (yy === 0) { put(x, y, z, "smooth_quartz"); continue; }                              // floor slab (belt course on the skin)
    if (!skin) continue;                                                                    // the air behind the glass
    if (yy === 3) { put(x, y, z, y < 4 ? "stone_bricks" : "white_concrete"); continue; }    // fascia or spandrel under each band
    const missX = ex.some(([dx]) => dx), missZ = ex.some(([, dz]) => dz);
    const along = missX && missZ ? null : missX ? z : x;
    if (along === null || along % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // mullion
    if (y < 4) put(x, y, z, "glass_pane", pane(missX));                                     // clear shopfront glass
    else put(x, y, z, (x * 5 + z * 3 + Math.floor(y / 4)) % 7 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", pane(missX));
  }
}

// lit windows: a glowstone just inside the glass, on the storey's window row
for (const c of cell.values()) {
  const { x, z, gr } = c, Tc = top.get(`${x},${z}`);
  for (let y = gr + 1; y < Tc - 2; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || !lit(x, y, z)) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && Tof(ix, iz) > y + 1 && exposed(ix, iz, y).length === 0) put(ix, y, iz, "glowstone");
  }
}

// entrance: the north face's lowest ground, centred; a stone step up into the building, dark oak doors, a fascia lintel
const north = [...cell.values()].filter((c) => !inFp(c.x, c.z - 1));
const minG = Math.min(...north.map((c) => c.gr));
const pool = north.filter((c) => c.gr === minG);
const meanX = pool.reduce((s, c) => s + c.x, 0) / pool.length;
const ent = pool.reduce((a, c) => (Math.abs(c.x - meanX) < Math.abs(a.x - meanX) ? c : a));
const { x: ex0, z: ez0, gr: eg } = ent;
put(ex0, eg, ez0, "polished_andesite_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
put(ex0, eg + 1, ez0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex0, eg + 2, ez0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -2; dx <= 2; dx++) if (inFp(ex0 + dx, ez0)) put(ex0 + dx, eg + 3, ez0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// roof plant: boxes on the lower tiers' decks, and on the crown a plant room with a mast and an aviation light
const interior = (x, z, Tc) => DIRS.every(([dx, dz]) => inFp(x + dx, z + dz) && Tof(x + dx, z + dz) >= Tc);
for (const c of cell.values()) {
  const { x, z } = c, Tc = top.get(`${x},${z}`);
  if (Tc === 240 || Tc < 120 || !interior(x, z, Tc) || (x * 3 + z * 5) % 11 !== 0) continue;
  put(x, Tc, z, "light_gray_concrete"); put(x, Tc + 1, z, "light_gray_concrete");
}
const crown = [...cell.values()].filter((c) => top.get(`${c.x},${c.z}`) === 240);
if (crown.length) {
  const cx = Math.round(crown.reduce((s, c) => s + c.x, 0) / crown.length), cz = Math.round(crown.reduce((s, c) => s + c.z, 0) / crown.length);
  for (let z = cz - 4; z <= cz + 4; z++) for (let x = cx - 4; x <= cx + 4; x++) {
    if (!inFp(x, z) || Tof(x, z) !== 240 || !interior(x, z, 240)) continue;
    const edge = Math.abs(x - cx) === 4 || Math.abs(z - cz) === 4;
    put(x, 240, z, edge ? "white_concrete" : "light_gray_concrete");
    put(x, 241, z, edge ? "light_gray_concrete" : "light_blue_stained_glass");
    put(x, 242, z, "smooth_stone");
  }
  // the mast stands on a plant-room cell (the crown's middle may be a courtyard or an edge)
  const mast = [...cell.values()].filter((c) => Tof(c.x, c.z) === 240 && interior(c.x, c.z, 240) && Math.abs(c.x - cx) <= 4 && Math.abs(c.z - cz) <= 4)
    .reduce((a, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(a.x - cx, a.z - cz) ? c : a));
  for (let y = 243; y <= 248; y++) put(mast.x, y, mast.z, "iron_bars");
  put(mast.x, 249, mast.z, "redstone_lamp", { lit: "true" });
}

// a check: solid blocks with air under them and nothing beside them at their height (a float)
let floats = 0, solid = 0;
g.forEachCell((i) => {
  solid++;
  const x = i % W, y = Math.floor(i / W) % H, z = Math.floor(i / (W * H));
  if (y === 0 || g.val(x, y - 1, z)) return;
  if (!DIRS.some(([dx, dz]) => g.val(x + dx, y, z + dz))) floats++;
});
const out = g.save(`${DIR}/${ID}.nbt`);
console.log(JSON.stringify({ footprint: cells.length, solid, floats, ...out }));
