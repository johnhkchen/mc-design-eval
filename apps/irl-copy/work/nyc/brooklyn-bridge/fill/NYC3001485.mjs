import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001485.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001485.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 14, H = 26, D = 6;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, gr: Math.max(0, Math.round(gr)), roof: Number(roof) });
}
const inFp = (x, z) => map.has(key(x, z));

function exposed(x, z) {
  return {
    n: !inFp(x, z - 1), // -z
    s: !inFp(x, z + 1), // +z
    w: !inFp(x - 1, z), // -x
    e: !inFp(x + 1, z), // +x
  };
}
const isPerimeter = (x, z) => {
  const f = exposed(x, z);
  return f.n || f.s || f.w || f.e;
};

// ---- massing: flat roof line on a 3-block storey grid from the lidar median ----
const roofs = cells.map(c => Number(c[3])).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(22, Math.max(6, 3 * Math.round(med / 3)));

function cellTop(gr) {
  return Math.min(23, Math.max(T, 3 * Math.ceil((gr + 3) / 3)));
}

// ---- entrance on the long exposed z-face, near the middle ----
let entrance = null;
for (const c of map.values()) {
  if (c.x !== 6 && c.x !== 7) continue;
  const f = exposed(c.x, c.z);
  if (f.n) { entrance = { x: c.x, z: c.z, dir: "north" }; break; }
  if (f.s) { entrance = { x: c.x, z: c.z, dir: "south" }; break; }
}

// ---- perimeter wall block on a storey row ----
function perimeterWall(x, y, z) {
  const f = exposed(x, z);
  const faces = [f.n, f.s, f.w, f.e].filter(Boolean).length;
  if (faces >= 2 && (f.n || f.s) && (f.w || f.e)) return "brown_terracotta"; // corner pilaster
  let a, len;
  if (f.n || f.s) { a = x; len = W; } else { a = z; len = D; }
  const bay = a > 0 && a < len - 1 && a % 2 === 1;
  if (!bay) return "bricks";
  const k = Math.floor(y / 3);
  if ((x + z + k) % 5 === 0 && y % 3 === 1) return "shroomlight"; // warm lit window
  return "light_blue_stained_glass_pane";
}

// ---- build each footprint cell ----
for (const c of map.values()) {
  const { x, z, gr } = c;
  const top = cellTop(gr);
  const perim = isPerimeter(x, z);

  // foundation: solid from y 0 to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // storeys: floor slabs on the 3-block grid, walls and glass between
  for (let y = gr; y < top; y++) {
    const isFloor = (y === gr) || (y % 3 === 0);
    if (isFloor) {
      g.set(x, y, z, perim ? "brown_terracotta" : "smooth_stone");
    } else if (perim) {
      g.set(x, y, z, perimeterWall(x, y, z));
    }
  }

  // cornice band just under the roof, roof slab, parapet
  if (perim) {
    g.set(x, top - 1, z, "brown_terracotta"); // cornice course
    g.set(x, top, z, "stone_bricks");         // coping
    g.set(x, top + 1, z, "bricks");           // parapet
  } else {
    g.set(x, top, z, "stone");                // roof deck
  }
}

// ---- chimney stacks on two interior roof cells ----
for (const [cx, cz] of [[4, 2], [9, 3]]) {
  if (!inFp(cx, cz) || isPerimeter(cx, cz)) continue;
  const top = cellTop(map.get(key(cx, cz)).gr);
  g.set(cx, top + 1, cz, "bricks");
  g.set(cx, top + 2, cz, "bricks");
  g.set(cx, top + 3, cz, "stone_bricks");
}

// ---- entrance: oak door in a brownstone surround ----
if (entrance) {
  const c = map.get(key(entrance.x, entrance.z));
  const gr = c.gr;
  const base = { facing: entrance.dir, hinge: "left", open: "false", powered: "false" };
  // surround: brownstone jambs beside the door, lintel above
  const side = entrance.dir === "north" || entrance.dir === "south" ? [[entrance.x - 1, entrance.z], [entrance.x + 1, entrance.z]] : [];
  for (const [sx, sz] of side) {
    if (!inFp(sx, sz)) continue;
    g.set(sx, gr + 1, sz, "brown_terracotta");
    g.set(sx, gr + 2, sz, "brown_terracotta");
  }
  g.set(entrance.x, gr + 1, entrance.z, "oak_door", { ...base, half: "lower" });
  g.set(entrance.x, gr + 2, entrance.z, "oak_door", { ...base, half: "upper" });
  g.set(entrance.x, gr + 3, entrance.z, "brown_terracotta"); // lintel
}

g.save(OUT);
