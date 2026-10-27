// way 853566320, Mt Eden's rim view: a 1960s concrete-framed office block. A stone base, a three-storey body, a
// four-storey core and a two-storey wing to the low side. White concrete piers frame blue glass in light grey
// spandrels, smooth-stone cornices cap each tier, and a recessed entrance has a canopy and a lantern pair.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_853566320.cells.json`, "utf8"));
const W = 72, H = 28, D = 74;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => footprint.has(key(x, z));
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "z" },
  { name: "south", dx: 0, dz: 1, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "x" },
];

// Massing tiers from the lidar roof height, 0 wing / 1 body / 2 core, then a 5x5 majority so the tiers come out flat.
const rawTier = (roof) => (roof <= 10 ? 0 : roof <= 14 ? 1 : 2);
const raw = new Map(cells.map(([x, z, , roof]) => [key(x, z), rawTier(roof)]));
const tierOf = new Map();
for (const [x, z] of cells) {
  const n = [0, 0, 0];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const t = raw.get(key(x + dx, z + dz)); if (t !== undefined) n[t]++; }
  const best = Math.max(...n), own = raw.get(key(x, z));
  tierOf.set(key(x, z), n[own] === best ? own : n.indexOf(best));
}
const T = (x, z) => tierOf.get(key(x, z));
const perimeter = (x, z) => DIRS.some((d) => !has(x + d.dx, z + d.dz));
// roof surface (top of the last solid block + 1): wing 9, body 13 inside and 14 on its parapet, core 17
const SURF = [9, 13, 17];
const surf = (x, z) => (T(x, z) === 1 && perimeter(x, z) ? 14 : SURF[T(x, z)]);
// the sides of a cell that face open air or a lower roof, with the neighbour's surface (0 if none)
const sidesOf = (x, z) => DIRS.flatMap((d) => {
  const nx = x + d.dx, nz = z + d.dz;
  if (!has(nx, nz)) return [{ d, nbTop: 0, missing: true }];
  if (surf(nx, nz) < surf(x, z)) return [{ d, nbTop: surf(nx, nz), missing: false }];
  return [];
});
const uOf = (d, x, z) => (d.axis === "x" ? x : z);

// The entrance: the side with the most open-air cells, centred on its middle
const count = Object.fromEntries(DIRS.map((d) => [d.name, []]));
for (const [x, z] of cells) for (const s of sidesOf(x, z)) if (s.missing) count[s.d.name].push(uOf(s.d, x, z));
const entranceSide = DIRS.reduce((a, d) => (count[d.name].length > count[a.name].length ? d : a));
const us = count[entranceSide.name].sort((a, b) => a - b);
const entrance = { d: entranceSide, uc: us[Math.floor(us.length / 2)] };

// a role per storey level: base, glass band, spandrel, storey slab (band), cap (parapet / cornice)
const roleAt = (y, L, per) => {
  if (y === 1) return "base";
  if (per && y === (L === 0 ? 8 : L === 1 ? 13 : 16)) return "cap";
  if (y === 2 || y === 3) return "glaze";
  if (y === 4 || y === 8 || y === 12 || y === 16) return "band";
  if (y === 5 || y === 9 || y === 13) return "spand";
  return "glaze";
};
const GLASS = "light_blue_stained_glass";
const MAT = { base: "stone_bricks", cap: "smooth_stone", band: "light_gray_concrete", spand: "light_gray_concrete" };
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const lanterns = [];
let lit = 0;
for (const [x, z] of cells) {
  const L = T(x, z), per = perimeter(x, z), sd = sidesOf(x, z);
  const top = L === 0 ? 8 : L === 1 ? (per ? 13 : 12) : 16;
  g.set(x, 0, z, "stone_bricks");                                             // the foundation and plinth under every cell
  const corner = sd.filter((s) => s.missing).length >= 2;
  for (let y = 1; y <= top; y++) {
    const walls = sd.filter((s) => y >= s.nbTop);
    if (!walls.length) {
      if ([4, 8, 12, 16].includes(y) && y < surf(x, z)) g.set(x, y, z, "white_concrete");   // storey slab, air behind it
      continue;
    }
    const onEntrance = (s) => s.missing && s.d === entrance.d && Math.abs(uOf(s.d, x, z) - entrance.uc) <= 1;
    const ent = walls.find(onEntrance);
    if (ent) {
      const u = uOf(entrance.d, x, z);
      if (y === 4) { g.set(x, y, z, "smooth_stone"); continue; }                // the canopy over the door
      if (y === 2 || y === 3) {
        if (u === entrance.uc) { g.set(x, y, z, "oak_door", DOOR(entrance.d.name, y === 2 ? "lower" : "upper")); continue; }
        if (y === 2) { g.set(x, y, z, "white_concrete"); continue; }
        g.set(x, y, z, "lantern", { hanging: "true" }); continue;
      }
    }
    const role = roleAt(y, L, per);
    const pier = corner || walls.some((s) => uOf(s.d, x, z) % 4 === 0);
    if (role === "glaze") {
      if (pier) g.set(x, y, z, "white_concrete");
      else if ((y === 6 || y === 10 || y === 14) && (x + z + y) % 7 === 0) { g.set(x, y, z, "glowstone"); lit++; }
      else g.set(x, y, z, GLASS);
      if (y === 2 && !pier) for (const s of walls) {                            // shopfront lamp just inside the glass
        const u = uOf(s.d, x, z);
        if (u % 6 === 3 && s.missing) lanterns.push([x - s.d.dx, z - s.d.dz]);
      }
    } else if (role === "base" || role === "cap" || role === "band" || role === "spand") {
      g.set(x, y, z, pier && role === "spand" ? "white_concrete" : MAT[role]);
    }
  }
}
// shopfront lanterns stand on the plinth, just inside the glass
for (const [x, z] of lanterns) if (has(x, z) && !perimeter(x, z)) g.set(x, 1, z, "lantern", { hanging: "false" });

// Roof plant on the body (3x2 boxes) and a lift overrun on the core (2x2)
const free = (x0, z0, w, d, L) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
    if (!has(x, z) || T(x, z) !== L || perimeter(x, z) || sidesOf(x, z).length) return false;
  }
  return true;
};
const used = new Set();
const placeBox = (w, d, L, h, cap) => {
  for (const [x0, z0] of cells) {
    if (x0 < 0) continue;
    if (!free(x0, z0, w, d, L)) continue;
    let clash = false;
    for (let x = x0 - 1; x <= x0 + w; x++) for (let z = z0 - 1; z <= z0 + d; z++) if (used.has(key(x, z))) clash = true;
    if (clash) continue;
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
      used.add(key(x, z));
      const base = SURF[L];
      for (let y = base; y < base + h - 1; y++) g.set(x, y, z, "light_gray_concrete");
      g.set(x, base + h - 1, z, cap);
    }
    return true;
  }
  return false;
};
placeBox(3, 2, 1, 2, "smooth_stone");
placeBox(3, 2, 1, 2, "smooth_stone");
placeBox(2, 2, 2, 3, "smooth_stone");

const res = g.save(`${DIR}/way_853566320.nbt`);
const tiers = [0, 0, 0];
for (const [x, z] of cells) tiers[T(x, z)]++;
console.log(JSON.stringify({ cells: cells.length, tiers, entrance: { side: entrance.d.name, uc: entrance.uc }, lit, ...res }));
