// A late-1980s glass-and-concrete office block on a stepped plinth, the Queen Street kind: 14 storeys of 4 blocks on a
// stone base, a one-storey setback ring and a small crown. The lidar's roofs are flattened into three tiers (60, 64, 67).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667926.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([43, 80, 36]);

const k = (x, z) => `${x},${z}`;
const roofOf = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const pick = (pred) => new Set([...roofOf].filter(([, r]) => pred(r)).map(([key]) => key));

// y 0 = lowest ground; floors at y = 3 + 4n (ground floor at 3). Podium 60 (whole footprint), setback ring 64, core 67.
const TIERS = [
  { s: pick(() => true), base: 0, top: 60 },
  { s: pick((r) => r >= 62), base: 60, top: 64 },
  { s: pick((r) => r >= 66), base: 64, top: 67 },
];

const outward = (s, x, z) => {
  const o = [];
  if (!s.has(k(x, z - 1))) o.push("N");
  if (!s.has(k(x, z + 1))) o.push("S");
  if (!s.has(k(x + 1, z))) o.push("E");
  if (!s.has(k(x - 1, z))) o.push("W");
  return o;
};
const floorRow = (y, base) => y === base || (y - 3) % 4 === 0;
const glassFor = (x, z) => ((Math.floor(x / 3) + Math.floor(z / 3)) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

// Walls, floors, glazing, cornice and roof of each tier. Interiors are air behind the glass, one slab per storey.
for (const { s, base, top } of TIERS) {
  for (const key of s) {
    const [x, z] = key.split(",").map(Number);
    const out = outward(s, x, z), edge = out.length > 0;
    const ns = out.includes("N") || out.includes("S"), ew = out.includes("E") || out.includes("W");
    const pier = (ns && ew) || (ns && x % 3 === 0) || (ew && z % 3 === 0);   // mullions every 3 along each facade
    if (base === 0) for (let y = 0; y < 3; y++) g.set(x, y, z, y === 2 ? "polished_andesite" : "stone_bricks");   // plinth
    for (let y = Math.max(base, 3); y < top; y++) {
      if (y === top - 1) { g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof
      if (!edge) { if (floorRow(y, base)) g.set(x, y, z, y === 3 ? "smooth_stone" : "light_gray_concrete"); continue; }
      if (y === top - 2) { g.set(x, y, z, "polished_andesite"); continue; }                        // cornice
      if (floorRow(y, base)) { g.set(x, y, z, base === 0 && y === 3 ? "polished_andesite" : "light_gray_concrete"); continue; }
      if (base === 0 && y === 6) { g.set(x, y, z, "stone_bricks"); continue; }                     // shopfront fascia
      if (pier) g.set(x, y, z, base === 0 ? "stone_bricks" : "white_concrete");
      else g.set(x, y, z, glassFor(x, z));
    }
  }
}

// Warm lights: a lantern on the floor slab behind some glazed bays.
for (const { s, base, top } of TIERS) {
  for (const key of s) {
    const [x, z] = key.split(",").map(Number);
    const out = outward(s, x, z);
    if (!out.length) continue;
    const [dx, dz] = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] }[out[0]];
    const ix = x + dx, iz = z + dz;
    if (!s.has(k(ix, iz)) || outward(s, ix, iz).length) continue;
    for (let y = Math.max(base, 3) + 1; y < top - 2; y++) {
      if ((y - 3) % 4 !== 1 || (x * 7 + z * 3 + y) % 5 !== 0) continue;
      g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Entrance on the north face nearest the middle: a dark oak door in the shopfront, two outer posts and a beam canopy.
const podium = TIERS[0].s;
const entrance = [...podium].map((c) => c.split(",").map(Number))
  .filter(([x, z]) => outward(podium, x, z).includes("N"))
  .sort((a, b) => Math.abs(a[0] - 21) - Math.abs(b[0] - 21))[0];
if (entrance) {
  const [xd, zd] = entrance;
  g.set(xd, 4, zd, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xd, 5, zd, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    const px = xd + dx, pz = zd - 1;
    if (podium.has(k(px, pz))) continue;
    for (let y = 0; y < 6; y++) g.set(px, y, pz, "stone_bricks");
    g.set(px, 6, pz, "polished_andesite");
  }
  for (let dx = -1; dx <= 1; dx++) g.set(xd + dx, 6, zd - 1, "polished_andesite");
  // lanterns inside the door, on the floor slab
  for (const dx of [-1, 1]) if (podium.has(k(xd + dx, zd + 1)) && !outward(podium, xd + dx, zd + 1).length)
    g.set(xd + dx, 4, zd + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a 3 x 3 plant box on the podium terrace, a lift and vent on the crown.
const findSpot = (region, avoid) => {
  for (const key of region) {
    const [x, z] = key.split(",").map(Number);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) if (!region.has(k(x + dx, z + dz))) ok = false;
    if (ok && (!avoid || Math.hypot(x - avoid[0], z - avoid[1]) >= 8)) return [x, z];
  }
  return null;
};
const terrace = new Set([...TIERS[0].s].filter((c) => !TIERS[1].s.has(c)));
const boxes = [];
const first = findSpot(terrace, null);
if (first) boxes.push([...first, 60, 2, "light_gray_concrete", "iron_block"]);
const second = first && findSpot(terrace, first);
if (second) boxes.push([...second, 60, 2, "light_gray_concrete", "iron_block"]);
const lift = findSpot(TIERS[2].s, null);
if (lift) boxes.push([...lift, 67, 3, "white_concrete", "iron_block"]);
for (const [cx, cz, y0, h, wall, vent] of boxes) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
    for (let y = y0; y < y0 + h; y++) g.set(cx + dx, y, cz + dz, wall);
  g.set(cx, y0 + h, cz, vent);
}

// Every wall, roof and lantern stands on a block below it. Interior floor slabs span air between the walls, so they are
// checked by their wall support instead: a slab cell must have a solid neighbour in its row.
const slabRow = (y) => (y - 3) % 4 === 0 || [59, 60, 63, 64, 66].includes(y);   // floors, tier bases and interior roofs
const hanging = [];
for (let y = 1; y < 80; y++) for (let z = 0; z < 36; z++) for (let x = 0; x < 43; x++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if (slabRow(y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz))) continue;
  if (y === 6 && g.get(x, y, z)?.block === "minecraft:polished_andesite") continue;   // canopy beam on its posts
  hanging.push([x, y, z]);
}
const counts = { blocks: g.count(), hanging: hanging.length, sample: hanging.slice(0, 5) };
console.log(JSON.stringify(counts));
g.save(`${DIR}/way_292667926.nbt`);
