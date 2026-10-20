import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Xinyi commercial block: two storeys over a shopfront, stone base,
// quartz spandrels and a cornice, flat roof with a small parapet and plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893364";
const W = 14, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);

const B = Math.min(...cells.map((c) => Math.round(c[2])));
const TOP = B + 11;            // exclusive top of structure; roof surface at TOP
const ROOF = TOP - 1;          // top layer: parapet and roof slab
const CORNICE = TOP - 2;       // stone cornice course
const LIGHT_Y_OFFSET = [6, 7]; // storey heights used for light placement

// Deterministic hash for scattered details
const hh = (a, b, c) => {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

// Per-cell perimeter info
const info = new Map();
for (const [x, z] of cells.map((c) => [Math.round(c[0]), Math.round(c[1])])) {
  const missing = {
    n: !inside(x, z - 1),
    s: !inside(x, z + 1),
    w: !inside(x - 1, z),
    e: !inside(x + 1, z),
  };
  const perim = missing.n || missing.s || missing.w || missing.e;
  info.set(`${x},${z}`, { missing, perim });
}

// Front = south face (z+1 missing). Pick the door cell nearest the centre line.
const frontCells = [...info.entries()]
  .filter(([, v]) => v.perim && v.missing.s)
  .map(([k]) => k.split(",").map(Number));
const cx = (W - 1) / 2;
let doorKey = null;
if (frontCells.length) {
  frontCells.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  doorKey = `${frontCells[0][0]},${frontCells[0][1]}`;
}

const GLASS = "glass_pane";
const PILLAR = "smooth_quartz";

// Pass 1: foundations, floors, walls, roof
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const inf = info.get(`${x},${z}`);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr > ROOF) continue;

  // Storey floor slabs (ground floor and second floor)
  g.set(x, gr, z, "smooth_quartz");
  if (gr + 5 < ROOF) g.set(x, gr + 5, z, "smooth_quartz");

  // Roof slab over the whole footprint
  g.set(x, ROOF, z, "light_gray_concrete");

  if (!inf.perim) {
    // Interior cells: rooftop plant boxes on a few cells
    if (TOP < H && hh(x, z, 3) % 9 === 0) g.set(x, TOP, z, "iron_block");
    continue;
  }

  const onNS = inf.missing.n || inf.missing.s; // face runs along x
  const t = onNS ? x : z;
  const isFront = inf.missing.s;
  const isDoorCell = `${x},${z}` === doorKey;

  for (let y = gr; y <= ROOF; y++) {
    const h = y - gr;

    if (y === ROOF) {
      g.set(x, y, z, "smooth_quartz"); // parapet cap
      continue;
    }
    if (y === CORNICE) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (h === 0) {
      g.set(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (h >= 1 && h <= 3) {
      // Ground floor: shopfront on the front face, windows elsewhere
      if (isFront) {
        if (isDoorCell && (h === 1 || h === 2)) {
          g.set(x, y, z, "oak_door", {
            facing: "south",
            half: h === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (isDoorCell && h === 3) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else if (t % 3 === 0) {
          g.set(x, y, z, PILLAR);
        } else {
          g.set(x, y, z, GLASS);
        }
      } else {
        g.set(x, y, z, t % 3 === 1 ? GLASS : PILLAR);
      }
      continue;
    }
    if (h === 4 || h === 5) {
      g.set(x, y, z, "smooth_quartz"); // spandrel band
      continue;
    }
    if (h >= 6 && y < CORNICE) {
      // Upper storey windows with quartz mullions
      g.set(x, y, z, t % 3 === 1 ? GLASS : PILLAR);
      continue;
    }
    g.set(x, y, z, "smooth_quartz");
  }
}

// Pass 2: warm lights just inside some upper windows (air gap behind glass)
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const inf = info.get(`${x},${z}`);
  if (!inf.perim) continue;
  const onNS = inf.missing.n || inf.missing.s;
  const t = onNS ? x : z;
  // Inward offset opposite to the first missing neighbour
  let dx = 0, dz = 0;
  if (inf.missing.n) dz = 1;
  else if (inf.missing.s) dz = -1;
  else if (inf.missing.w) dx = 1;
  else if (inf.missing.e) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || info.get(`${ix},${iz}`).perim) continue;
  if (t % 3 !== 1) continue;
  for (const off of LIGHT_Y_OFFSET) {
    const y = gr + off;
    if (y >= CORNICE) continue;
    if (hh(x, z, off) % 5 === 0) {
      const block = hh(x, z, off + 11) % 2 === 0 ? "glowstone" : "shroomlight";
      g.set(ix, y, iz, block);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
