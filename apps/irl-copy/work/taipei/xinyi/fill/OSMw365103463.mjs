import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 三普大樓 — 1980s-era mid-rise office/commercial block, about 11 storeys (~5 blocks each).
// Light cream ceramic-tile and concrete facade, quartz pillars between tall aluminium-framed
// window bays, polished granite shopfront base with a dark-oak entrance, a cornice and parapet,
// and a rooftop mechanical penthouse with a steel water tank and lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103463";
const W = 26, H = 71, D = 52;
const ROOF = 59;            // roof surface, blocks above lowest ground
const STOREY = 5;

// ---- footprint -----------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = raw.map(c => Array.isArray(c)
  ? [c[0], c[1], c[2]]
  : [c.x, c.z, c.ground ?? c.g ?? c.y ?? 0]);
const gMin = Math.min(...rows.map(r => r[2]));
const ground = new Map();
for (const [x, z, gr] of rows) ground.set(`${x},${z}`, gr - gMin);

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const has = (x, z) => ground.has(`${x},${z}`);
const outwardOf = (x, z) => {
  for (const d of DIRS) if (!has(x + d[1], z + d[2])) return d;
  return null;
};

const cells = [...ground.entries()].map(([k, g]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g, out: outwardOf(x, z) };
});

// ---- entrance face: the outward face with the most perimeter cells -------
const faceCount = {};
for (const c of cells) if (c.out) faceCount[c.out[0]] = (faceCount[c.out[0]] || 0) + 1;
const faceName = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "south";

// floor lines for a cell: its ground, then every multiple of 5 that leaves a usable storey
const linesFor = (g) => {
  const arr = [g];
  for (let k = 1; k <= 11; k++) {
    const L = k * STOREY;
    if (L > g + 2 && L < ROOF) arr.push(L);
  }
  return arr;
};

// door cell: middle of the entrance face where the ground storey is tall enough
const faceCells = cells
  .filter(c => c.out && c.out[0] === faceName && ((linesFor(c.g)[1] ?? ROOF) - c.g) >= 5)
  .sort((a, b) => (faceName === "north" || faceName === "south") ? a.x - b.x : a.z - b.z);
const doorCell = faceCells.length ? faceCells[Math.floor(faceCells.length / 2)] : null;

// ---- build ---------------------------------------------------------------
const g = new Voxels([W, H, D]);
const S = (x, y, z, id, p) => g.set(x, y, z, id, p);

for (const c of cells) {
  const { x, z, g: gr, out } = c;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  const lines = linesFor(gr);
  for (let i = 0; i < lines.length; i++) {
    const f = lines[i];
    const n = lines[i + 1] ?? ROOF;
    const h = n - f;

    for (let y = f; y < n; y++) {
      const rel = y - f;

      if (!out) {
        // interior: floor slab only, the rest is air behind the glass
        if (rel === 0) S(x, y, z, "light_gray_concrete");
        continue;
      }

      const [, dx, dz] = out;
      const bay = dz !== 0 ? x : z;   // position along the facade
      const isPillarBay = bay % 3 === 0;

      if (rel === 0) {
        S(x, y, z, i === 0 ? "polished_granite" : "smooth_quartz");
      } else if (rel === h - 1) {
        S(x, y, z, "smooth_quartz");   // lintel / spandrel top
      } else if (isPillarBay) {
        S(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        const panesAlongX = dz !== 0;  // on north/south walls panes run east-west
        S(x, y, z, "light_blue_stained_glass_pane", {
          north: panesAlongX ? "false" : "true",
          south: panesAlongX ? "false" : "true",
          east: panesAlongX ? "true" : "false",
          west: panesAlongX ? "true" : "false",
          waterlogged: "false",
        });

        // warm light just inside some windows, standing on the floor slab
        if (rel === 1 && ((bay + i) % 4 === 0)) {
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && !outwardOf(ix, iz)) S(ix, y, iz, "shroomlight");
        }
      }
    }
  }

  // roof deck, cornice and parapet on the perimeter
  S(x, ROOF, z, "light_gray_concrete");
  if (out) {
    S(x, ROOF + 1, z, "smooth_quartz");   // cornice
    S(x, ROOF + 2, z, "white_concrete");   // parapet
  }
}

// ---- entrance ------------------------------------------------------------
if (doorCell) {
  const { x, z, g: gd } = doorCell;
  const h0 = (linesFor(gd)[1] ?? ROOF) - gd;
  const dprops = (half) => ({
    facing: faceName, half, hinge: "left", open: "false", powered: "false",
  });
  S(x, gd + 1, z, "dark_oak_door", dprops("lower"));
  S(x, gd + 2, z, "dark_oak_door", dprops("upper"));
  // hanging lantern under the entrance lintel
  S(x, gd + h0 - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- rooftop: mechanical penthouse, water tank, lightning rod -------------
for (let x = 4; x <= 21; x++) {
  for (let z = 4; z <= 47; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) S(x, y, z, "light_gray_concrete");
  }
}
for (let x = 8; x <= 17; x++) {
  for (let z = 14; z <= 25; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 4; y <= ROOF + 6; y++) S(x, y, z, "iron_block");
  }
}
if (has(12, 19)) {
  for (let y = ROOF + 7; y <= ROOF + 9; y++) S(12, y, 19, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
