// Way 948317529, Mt Eden / Eden Terrace: a late-Victorian to Edwardian brick shop-and-flats (c.1905-1915), the kind
// that lines the old tram streets off Mt Eden Road. 22 x 18 footprint on a slope falling to the east: the lidar roof
// reads 7 across the bulk and 12-14 along the north-east frontage. So the massing is a three-storey shop-top frontage
// on the north-east (roof at 14, parapet over a cornice), a two-storey middle strip (roof at 10) and a one-and-a-half
// storey wing behind (roof at 7). Walls are red brick with cream plaster string courses, quoins and caps; the ground
// floor on the frontage is a shopfront of glass and dark timber piers under a striped canvas blind, with a timber
// door at mid-frontage. Basalt plinth and basecourse (the volcanic stone of the cone). Flat roofs of grey plaster
// with plant boxes; a brick chimney on the wing. Lanterns hang in some rooms. Interiors are air between the floor
// slabs at 4, 8 and 12 and the decks; no interior walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317529.cells.json`, "utf8"));
const W = 22, D = 18, H = 27;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, z) => `${x},${z}`;
const at = new Map(cells.map(([x, z, ground, roof]) => [k(x, z), { ground, roof }]));
const inside = (x, z) => at.has(k(x, z));

// 3 x 3 mean of the lidar roof over the footprint: the massing tier decision, smooth rather than noisy
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = at.get(k(x + dx, z + dz)); if (o) { s += o.roof; n++; }
  }
  return s / n;
};
// three clean tiers: frontage 14 (three storeys and a parapet), middle 10 (two storeys), wing 7 (one and a half)
const tierOf = (s) => (s >= 11 ? 14 : s >= 9 ? 10 : 7);
let tier = new Map();
for (const [key] of at) { const [x, z] = key.split(",").map(Number); tier.set(key, tierOf(smooth(x, z))); }
// two passes of a majority filter over each cell and its eight neighbours (ties go up): clean tier edges, no fins
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key] of at) {
    const [x, z] = key.split(",").map(Number), votes = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const t = tier.get(k(x + dx, z + dz)); if (t !== undefined) votes.set(t, (votes.get(t) || 0) + 1);
    }
    const best = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    next.set(key, best);
  }
  tier = next;
}

// storey floors (absolute y), the lid over the top storey (the flat roof deck), the cap on every wall
const FLOORS = [4, 8, 12];
const lidOf = (T) => (T === 7 ? T - 1 : T - 2);
const cap = (T) => T - 1;

// the faces of a cell: a side that meets outside the footprint or a neighbour in another tier (a setback face)
const facesOf = (x, z) => {
  const t = tier.get(k(x, z));
  return N4.filter(([dx, dz]) => !inside(x + dx, z + dz) || tier.get(k(x + dx, z + dz)) !== t);
};
// a street face: outside the footprint, on the north-east side (east or north)
const isFront = (x, z, [dx, dz]) => !inside(x + dx, z + dz) && (dx === 1 || dz === -1);

// the shopfront door: a ground-floor front cell in the frontage, at the middle of the frontage run
const frontRun = [];
for (const [key, { ground }] of at) {
  const [x, z] = key.split(",").map(Number);
  if (tier.get(key) !== 14 || ground > 1) continue;
  const f = facesOf(x, z).find((d) => isFront(x, z, d));
  if (f) frontRun.push({ x, z, f, ground });
}
frontRun.sort((a, b) => a.x + a.z - (b.x + b.z) || a.x - b.x);
const door = frontRun[Math.floor(frontRun.length / 2)];

const g = new Voxels([W, H, D]);

for (const [key, { ground }] of at) {
  const [x, z] = key.split(",").map(Number);
  const T = tier.get(key), lid = lidOf(T), top = cap(T);
  const faces = facesOf(x, z);
  const ring = faces.length > 0;
  // no quoins: on this stepped edge every step is a corner, and quoins in every step read as pillars, not brick
  const face = faces[0];

  // the fill below the ground: nothing hangs over a slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // interior: the ground floor deck, the storey slabs up to the lid, and the lid itself
  if (!ring) {
    g.set(x, ground, z, "smooth_stone");
    for (const f of FLOORS) if (f <= lid && f >= ground) g.set(x, f, z, "smooth_stone");
    g.set(x, lid, z, "smooth_stone");
    // roof plant on the deck: an air handler at a spaced grid, a brick flue on the wing
    if (T === 7 && (x + 2 * z) % 11 === 5) { g.set(x, lid + 1, z, "bricks"); g.set(x, lid + 2, z, "bricks"); }
    else if ((x + 3 * z) % 7 === 3) g.set(x, lid + 1, z, "iron_block");
    // a hanging lantern in some rooms, under the deck (a warm light seen through the glass)
    else if (lid - 1 > ground && (x * 3 + z) % 11 === 0) g.set(x, lid - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    continue;
  }

  // the walls of a ring cell, row by row
  for (let y = ground; y <= top; y++) {
    if (door && door.x === x && door.z === z && (y === ground || y === ground + 1)) {
      const dir = door.f[0] === 1 ? "east" : door.f[0] === -1 ? "west" : door.f[1] === 1 ? "south" : "north";
      g.set(x, y, z, "dark_oak_door", { facing: dir, half: y === ground ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === ground) { g.set(x, y, z, "polished_basalt"); continue; }   // basecourse
    if (y === top) { g.set(x, y, z, "smooth_quartz"); continue; }      // cap
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_quartz"); continue; }   // string course
    const front = face && isFront(x, z, face);
    if (y === 4 && front) {                                            // canvas blind over the shopfront
      const t = face[0] !== 0 ? z : x;
      g.set(x, y, z, t % 2 ? "red_wool" : "white_wool");
      continue;
    }
    let floor = 0; for (const f of FLOORS) if (f < y) floor = f;
    const row = floor ? y - floor : y - ground;                         // the row inside its storey
    const lintel = floor ? row === 3 : y === 3;
    if (lintel) { g.set(x, y, z, "smooth_quartz"); continue; }
    const t = face[0] !== 0 ? z : x;
    const win = t % 4 === 1 || t % 4 === 2;
    if (win) {
      const panes = face[0] !== 0
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, "glass_pane", panes);
    } else {
      g.set(x, y, z, front && y < 4 ? "dark_oak_log" : "bricks", front && y < 4 ? { axis: "y" } : undefined);
    }
  }
}

const out = g.save(`${DIR}/way_948317529.nbt`);
console.log("saved", out);
