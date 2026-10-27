import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Kordia: a late-1980s office block on a stone plinth, stepped in tiers of white concrete and cyan tinted glass, a
// lobby on the lowest street face, lightning-rod mast on the north-east core (the broadcaster's roof). The lidar roof
// heights snap to five flat tiers, all on 4-block storey lines; each column is solid from y 0 up to its ground, and
// above it the walls, floor slabs and roof are solid while the interior stays air.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_374372300.cells.json`, "utf8"));
const X = 53, Y = 49, Z = 73;

// lidar roof -> absolute tier top (roof 9 = the wing, 36 = the core); never below 4 blocks over the ground
const tierTop = (r) => (r <= 12 ? 8 : r <= 27 ? 20 : r <= 31 ? 28 : r <= 34 ? 32 : 36);
const col = new Map();
for (const [x, z, g, r] of cells) {
  const minT = Math.ceil((g + 4) / 4) * 4;
  col.set(`${x},${z}`, { x, z, g, T: Math.max(tierTop(r), minT) });
}
const SIDES = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const OPP = { n: "s", s: "n", e: "w", w: "e" };
const neighbour = (c, d) => col.get(`${c.x + SIDES[d][0]},${c.z + SIDES[d][1]}`);

// a floor slab at the ground, then every 4 blocks (never directly on the ground row, so no double slabs)
const isFloor = (c, y) => y === c.g || (y % 4 === 0 && y - c.g >= 2);
const floorBase = (c, y) => { let f = y; while (f > c.g && !isFloor(c, f)) f--; return f; };
// sides open to the sky or the street at y: outside the footprint, or above the neighbour's tier
const exposed = (c, y) => Object.keys(SIDES).filter((d) => { const n = neighbour(c, d); return !n || y >= n.T; });
const outside = (c) => Object.keys(SIDES).filter((d) => !neighbour(c, d));

// the building's centre, for picking the entrance and the mast
const all = [...col.values()];
const cx = all.reduce((s, c) => s + c.x, 0) / all.length, cz = all.reduce((s, c) => s + c.z, 0) / all.length;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < Y) g.set(x, y, z, block, state); };

// the entrance: the lowest street-facing wall of a main tier, nearest the middle of its face
let door = null;
for (const c of all) {
  const out = outside(c);
  if (out.length !== 1 || c.T < 20) continue;
  const d = out[0], off = d === "n" || d === "s" ? Math.abs(c.x - cx) : Math.abs(c.z - cz);
  const score = c.g * 100 + off;
  if (!door || score < door.score) door = { c, d, score };
}
const doorKey = door ? `${door.c.x},${door.c.z}` : null;

// the mast's foot: the middle of the highest tier, away from its edge
const top = all.filter((c) => c.T === 36 && outside(c).length === 0);
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
const mast = top.reduce((best, c) => (!best || Math.hypot(c.x - mx, c.z - mz) < Math.hypot(best.x - mx, best.z - mz) ? c : best), null);

// the 2x2 roof boxes on the mid tiers: the cells whose (x % 9, z % 9) are (4..5, 4..5), all interior, one tier
const box2 = (x0, z0, T) => [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]].every(([x, z]) => {
  const c = col.get(`${x},${z}`); return c && c.T === T && outside(c).length === 0;
});
const equipAt = (c) => {
  if (c.T === 36 || c.x % 9 < 4 || c.x % 9 > 5 || c.z % 9 < 4 || c.z % 9 > 5) return false;
  return box2(c.x - (c.x % 9 - 4), c.z - (c.z % 9 - 4), c.T);
};

for (const c of all) {
  const { x, z, g: gr, T } = c;
  // foundation: solid under the ground line, rusticated on the street faces (pilasters every 3 blocks)
  const out = outside(c);
  for (let y = 0; y < gr; y++) put(x, y, z, out.length && (x % 3 === 0 || z % 3 === 0) ? "polished_andesite" : "stone_bricks");
  // parapet on the footprint's edge, roof cover under it
  put(x, T - 1, z, "stone");
  if (out.length) put(x, T, z, "white_concrete");
  else if (equipAt(c)) { put(x, T, z, "gray_concrete"); put(x, T + 1, z, "gray_concrete"); }
  for (let y = gr; y < T - 1; y++) {
    const ex = exposed(c, y);
    if (isFloor(c, y)) { put(x, y, z, y === gr && ex.length ? "stone_bricks" : "light_gray_concrete"); continue; }
    if (!ex.length) continue;                                  // interior air
    if (y === T - 2) { put(x, y, z, "stone_bricks"); continue; }  // cornice
    const fb = floorBase(c, y), rel = y - fb, d = ex[0];
    const coord = d === "n" || d === "s" ? x : z;
    if (fb === gr && rel === 1) { put(x, y, z, "polished_andesite"); continue; } // the ground-storey base course
    if (rel === 1) { put(x, y, z, "white_concrete"); continue; }                  // spandrel
    const mullion = ex.length > 1 || coord % 3 === 0;                             // corner piers and 3-block mullions
    put(x, y, z, mullion ? "gray_concrete" : "cyan_stained_glass");
  }
}

// the door in the lobby wall, with its lintel above, and the lobby lights
if (door) {
  const { c, d } = door;
  put(c.x, c.g, c.z, "iron_door", { facing: OPP[d], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 1, c.z, "iron_door", { facing: OPP[d], half: "upper", hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 2, c.z, "stone_bricks");
}

// warm light: a lantern on the floor of each interior 6-block grid point, a glowstone behind some windows
for (const c of all) {
  const { x, z, g: gr, T } = c;
  for (let y = gr; y < T - 2; y++) {
    if (isFloor(c, y) && y + 1 < T - 1 && exposed(c, y + 1).length === 0 && x % 6 === 3 && z % 6 === 3) {
      put(x, y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
  // a glowstone on the floor just inside one window row in nine
  for (let y = gr; y < T - 2; y++) {
    const ex = exposed(c, y), fb = floorBase(c, y);
    if (!ex.length || y - fb !== 2 || (x * 7 + z * 13 + y) % 9 !== 0) continue;
    const ic = col.get(`${x - SIDES[ex[0]][0]},${z - SIDES[ex[0]][1]}`);
    if (ic && ic.g <= fb && fb + 1 < ic.T - 1 && !exposed(ic, fb + 1).length) put(ic.x, fb + 1, ic.z, "glowstone");
  }
}

// the mast: lightning rods on the core's roof
if (mast) for (let y = mast.T; y < mast.T + 12; y++) put(mast.x, y, mast.z, "lightning_rod", { facing: "up", powered: "false" });

const stats = g.save(`${DIR}/${"way_374372300"}.nbt`);
console.log(JSON.stringify({ cells: all.length, door: door && { x: door.c.x, z: door.c.z, side: door.d, g: door.c.g }, mast: mast && { x: mast.x, z: mast.z }, ...stats }));
