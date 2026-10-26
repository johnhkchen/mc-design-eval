import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 800 17th St NW, Washington DC: Commercial-Office-Large, roof about 20 blocks above lowest ground.
// Read as a mid-century (c. 1960s-70s) Modern office: limestone-clad piers, light precast spandrels,
// tinted glass ribbons, a stone base course, a lit lobby entrance on the street face and a stepped roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 34, D = 44, H = 32;
const STOREY = 3;      // blocks per storey (about 7 m at 0.42 blocks/m)
const MAX_TOP = H - 6; // leave headroom for parapet and roof plant

const cells = JSON.parse(readFileSync(`${DIR}/DC70001.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(key(x, z), { x, z, g: Math.max(0, Math.round(gr)), roof: Number(roof) });
}
const has = (x, z) => raw.has(key(x, z));

// Neighbourhood median over the footprint (3x3 incl. self).
function medianOf(map, c, field) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = map.get(key(c.x + dx, c.z + dz));
      if (n) vals.push(n[field]);
    }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}

// Pass 1: lidar noise -> 3-block tiers.
const pass1 = new Map();
for (const c of raw.values()) {
  const med = medianOf(raw, c, "roof");
  const top = Math.min(MAX_TOP, Math.max(c.g + STOREY, Math.round(med / STOREY) * STOREY));
  pass1.set(key(c.x, c.z), { ...c, top });
}
// Pass 2: remove single-cell spikes and stubs so tiers read as clean masses.
const tiers = new Map();
for (const c of pass1.values()) {
  const med = medianOf(pass1, c, "top");
  const top = Math.min(MAX_TOP, Math.max(c.g + STOREY, med));
  tiers.set(key(c.x, c.z), { ...c, top });
}

// Facade description for an exposed footprint cell.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { axis: "z", bay: x, inx: 0, inz: 1, front: z === 0 };
  if (!has(x, z + 1)) return { axis: "z", bay: x, inx: 0, inz: -1, front: false };
  if (!has(x - 1, z)) return { axis: "x", bay: z, inx: 1, inz: 0, front: false };
  if (!has(x + 1, z)) return { axis: "x", bay: z, inx: -1, inz: 0, front: false };
  return null;
}

const g = new Voxels([W, H, D]);

const glassProps = (axis) =>
  axis === "z"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const wallProps = { up: "true", north: "low", south: "low", east: "low", west: "low", waterlogged: "false" };

for (const c of tiers.values()) {
  const { x, z, g: gr, top } = c;
  const face = faceOf(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const st = Math.floor(rel / STOREY);
    const off = rel % STOREY;

    if (!face) {
      // Interior: air, with a floor slab at each storey base and a roof surface on top.
      if (y === top - 1 || off === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const pier = face.bay % 3 === 0;

    // Roof: stone cornice with a low parapet cap.
    if (y === top - 1) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (y === top - 2 && st > 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    // Base course.
    if (st === 0 && off === 0) {
      g.set(x, y, z, "polished_granite");
      continue;
    }
    // Lobby doors on the street face.
    if (face.front && st === 0 && off <= 1 && (x === 16 || x === 17)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: off === 0 ? "lower" : "upper",
        hinge: x === 16 ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    // Lit pilasters flanking the entrance.
    if (face.front && st === 0 && off === 1 && (x === 15 || x === 18)) {
      g.set(x, y, z, "glowstone");
      continue;
    }
    // Entrance canopy lintel.
    if (face.front && st === 0 && off === 2 && x >= 13 && x <= 20) {
      g.set(x, y, z, "polished_granite");
      continue;
    }
    // Glazing ribbon (off 1) between piers.
    if (off === 1) {
      if (pier) g.set(x, y, z, "calcite");
      else g.set(x, y, z, "light_blue_stained_glass_pane", glassProps(face.axis));
      continue;
    }
    // Spandrels: lighter precast band under the glass, darker sill above.
    if (pier) g.set(x, y, z, "calcite");
    else g.set(x, y, z, off === 0 ? "polished_andesite" : "light_gray_concrete");
  }

  // Parapet cap above the cornice on facade cells where the tier allows it.
  if (face && top + 1 < H && top < MAX_TOP + 1) {
    g.set(x, top, z, "stone_brick_wall", wallProps);
  }
}

// Canopy overhang: a shelf one cell out from the street wall at lintel height.
for (let x = 13; x <= 20; x++) {
  const c = tiers.get(key(x, 1));
  if (!c) continue;
  const y = c.g + 2;
  if (y < c.top - 1) g.set(x, y, 1, "polished_granite");
}

// Warm light behind some of the glass (glowstone in the interior cell behind the pane).
for (const c of tiers.values()) {
  const face = faceOf(c.x, c.z);
  if (!face || face.front) continue;
  for (let y = c.g; y < c.top - 1; y++) {
    const rel = y - c.g;
    const st = Math.floor(rel / STOREY);
    if (rel % STOREY !== 1 || st === 0 || face.bay % 3 === 0) continue;
    if ((c.x * 31 + c.z * 17 + st * 7) % 5 !== 0) continue;
    const n = tiers.get(key(c.x + face.inx, c.z + face.inz));
    if (!n || y < n.g || y >= n.top - 1) continue;
    g.set(n.x, y, n.z, "glowstone");
  }
}

// Rooftop plant: small stone penthouses on a loose grid where the roof is flat over a 3x3 block.
for (const c of tiers.values()) {
  if (faceOf(c.x, c.z)) continue;
  if (c.x % 11 !== 5 || c.z % 11 !== 5) continue;
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++)
    for (let dx = -1; dx <= 1 && ok; dx++) {
      const n = tiers.get(key(c.x + dx, c.z + dz));
      if (!n || n.top !== c.top || faceOf(n.x, n.z)) ok = false;
    }
  if (!ok || c.top + 2 >= H) continue;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      g.set(c.x + dx, c.top, c.z + dz, "stone_bricks");
      g.set(c.x + dx, c.top + 1, c.z + dz, "stone_bricks");
    }
  g.set(c.x, c.top + 1, c.z, "light_blue_stained_glass_pane", glassProps("z"));
}

g.save(`${DIR}/DC70001.nbt`);
