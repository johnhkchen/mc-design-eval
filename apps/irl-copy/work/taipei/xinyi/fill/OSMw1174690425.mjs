import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690425.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690425.nbt";

const W = 40, H = 23, D = 23;
const ROOF = 10;          // roof slab / cornice block row; top face at 11 above lowest ground

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFp.has(key(x, z));

// outward directions, in priority order
const FACES = [
  { f: "N", dx: 0, dz: -1, facing: "north" },
  { f: "S", dx: 0, dz: 1, facing: "south" },
  { f: "W", dx: -1, dz: 0, facing: "west" },
  { f: "E", dx: 1, dz: 0, facing: "east" },
];
const faceInfo = Object.fromEntries(FACES.map((o) => [o.f, o]));

// edge cells -> outward face
const edge = new Map();
for (const [x, z] of cells) {
  const miss = FACES.filter((o) => !has(x + o.dx, z + o.dz));
  if (miss.length) edge.set(key(x, z), miss[0].f);
}

// door: on the face with the most edge cells (prefer south on ties)
const counts = { N: [], S: [], E: [], W: [] };
for (const [x, z] of cells) {
  const f = edge.get(key(x, z));
  if (!f) continue;
  const idx = f === "N" || f === "S" ? x : z;
  counts[f].push(idx);
}
let doorFace = "S";
for (const f of ["S", "N", "E", "W"]) if (counts[f].length > counts[doorFace].length) doorFace = f;
const doorIdxs = counts[doorFace].slice().sort((a, b) => a - b);
const doorIdx = doorIdxs.length ? doorIdxs[Math.floor(doorIdxs.length / 2)] : -1;

// warm lights behind selected upper-storey windows
const glow = new Set();
for (const [x, z] of cells) {
  const f = edge.get(key(x, z));
  if (!f) continue;
  const o = faceInfo[f];
  const idx = f === "N" || f === "S" ? x : z;
  if (idx % 6 !== 1) continue;
  const ix = x - o.dx, iz = z - o.dz;
  if (has(ix, iz) && !edge.has(key(ix, iz))) glow.add(`${ix},7,${iz}`);
}

const g = new Voxels([W, H, D]);

const paneProps = (f) =>
  f === "N" || f === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr > ROOF) continue;

  const face = edge.get(key(x, z));

  if (!face) {
    // interior: floor slabs per storey, roof, rooftop plant; air between
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y === 5) g.set(x, y, z, "smooth_stone");
      else if (y === ROOF) g.set(x, y, z, "gray_concrete");
    }
    if (ROOF + 1 < H) {
      if (x % 8 === 4 && z % 5 === 2) g.set(x, ROOF + 1, z, "light_gray_concrete");
      if (x === 20 && z === 11) g.set(x, ROOF + 1, z, "lightning_rod");
    }
    continue;
  }

  // facade cell
  const o = faceInfo[face];
  const idx = face === "N" || face === "S" ? x : z;
  const hasDoor = face === doorFace && idx === doorIdx && gr + 2 <= 3;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }        // base course
    if (y === ROOF) { g.set(x, y, z, "polished_andesite"); continue; }     // cornice / parapet cap
    if (y === 9 || y === 4) { g.set(x, y, z, "light_gray_concrete"); continue; } // storey lines
    if (y === 5) { g.set(x, y, z, "white_concrete"); continue; }           // spandrel
    const s1 = y <= 3;
    const s2 = y >= 6 && y <= 8;
    if (!(s1 || s2)) { g.set(x, y, z, "white_concrete"); continue; }

    if (s1 && hasDoor) {
      if (y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", { facing: o.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", { facing: o.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }

    const mullion = s1 ? idx % 3 === 0 : idx % 4 === 0;
    if (mullion) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane", paneProps(face));
  }
}

for (const k of glow) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, "glowstone");
}

g.save(OUT);
console.log("saved", OUT, { doorFace, doorIdx, glow: glow.size, cells: cells.length });
