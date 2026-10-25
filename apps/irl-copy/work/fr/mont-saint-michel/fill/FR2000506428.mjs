import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR2000506428";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 120, H = 31, D = 115;
const g = new Voxels([W, H, D]);

// Cream render walls, stone base, quartz storey belts and pilasters, dark-blue glass.
const WALL = "smooth_quartz";
const BELT = "quartz_bricks";
const PIER = "quartz_pillar";
const BASE = "stone_bricks";
const FOUND = "stone";
const FLOOR = "spruce_planks";
const ROOF = "smooth_stone";
const CAP = "stone_brick_slab";
const GLASS = "light_blue_stained_glass_pane";
const EQUIP = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, roof] of cells) {
  info.set(key(x, z), { x, z, g: Math.round(gr), roof: Math.round(roof) });
}
const at = (x, z) => info.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACES = ["N", "S", "E", "W"];
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const nb = (c, d) => at(c.x + DIRS[d][0], c.z + DIRS[d][1]);
const missing = (c, d) => !nb(c, d);
const lowerNb = (c, d) => { const n = nb(c, d); return !!n && n.top < c.top; };
const isEdge = (c) => FACES.some((d) => missing(c, d) || lowerNb(c, d));

// Storey count from lidar height above each cell's ground (~5-block storeys).
for (const c of info.values()) {
  c.n0 = Math.max(2, Math.min(6, Math.round((c.roof - c.g) / 5)));
}
// Smooth lidar noise with a 3x3 average inside the footprint.
for (const c of info.values()) {
  let s = 0, k = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at(c.x + dx, c.z + dz);
    if (n) { s += n.n0; k++; }
  }
  const limit = Math.floor((H - 4 - c.g) / 5);
  c.n = Math.max(2, Math.min(6, Math.round(s / k), limit));
  c.top = c.g + 5 * c.n; // roof slab level
}

// Entrance cells: two adjacent doors at the middle of the north (street) face.
const northCells = [...info.values()].filter((c) => missing(c, "N"));
let doorCells = [];
if (northCells.length) {
  const xs = northCells.map((c) => c.x).sort((a, b) => a - b);
  const cx = xs[Math.floor(xs.length / 2)];
  const left = northCells.find((c) => c.x === cx);
  const right = northCells.find((c) => c.x === cx + 1);
  doorCells = [left, right].filter(Boolean);
}
const isDoor = (c) => doorCells.includes(c);

for (const c of info.values()) {
  const { x, z, g: gr, top, n } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!isEdge(c)) {
    // Interior: floor slabs per storey, air between, solid roof deck.
    g.set(x, gr, z, FLOOR);
    for (let k = 1; k < n; k++) g.set(x, gr + 5 * k, z, FLOOR);
    g.set(x, top, z, ROOF);
    // Roof plant: 2x2 equipment blocks.
    if ((x % 10 === 5 || x % 10 === 6) && (z % 10 === 5 || z % 10 === 6)) {
      g.set(x, top + 1, z, EQUIP);
      g.set(x, top + 2, z, EQUIP);
    }
    continue;
  }

  // Edge (shell) cell: wall column with base, belts, pilasters, window bays.
  g.set(x, gr, z, BASE);
  for (let y = gr + 1; y < top; y++) g.set(x, y, z, WALL);
  g.set(x, top, z, ROOF);
  const exposed = FACES.some((d) => missing(c, d));
  if (exposed) {
    g.set(x, top + 1, z, WALL);   // parapet
    g.set(x, top + 2, z, CAP);    // coping slab
  }

  const wd = FACES.find((d) => missing(c, d)); // street-side exposed face
  const i = wd ? ((wd === "N" || wd === "S") ? x : z) : 0;
  const isPier = wd && (i % 4 === 0);

  for (let k = 0; k < n; k++) {
    const b = gr + 5 * k;
    if (k > 0) g.set(x, b, z, BELT);

    if (!wd) continue;

    // Pilasters: vertical quartz piers on the bay lines, from floor to floor.
    if (isPier) {
      for (let dy = 1; dy <= 4; dy++) {
        if (k === 0 && dy === 4) continue;
        g.set(x, b + dy, z, PIER, { axis: "y" });
      }
      continue;
    }

    const ground = k === 0;
    const win = ground ? true : (i % 4 === 1 || i % 4 === 2);
    if (!win) continue;

    // Doors take the ground storey of the entrance cells.
    if (ground && isDoor(c)) continue;

    const props = (wd === "N" || wd === "S")
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    for (let dy = 1; dy <= 3; dy++) g.set(x, b + dy, z, GLASS, props);

    // Warm light behind some windows, in the interior air cell just inside.
    if ((x * 3 + z * 5 + k * 7) % 6 === 0) {
      const back = nb(c, OPP[wd]);
      if (back && !isEdge(back) && k < back.n) {
        const bb = back.g + 5 * k;
        g.set(back.x, bb + 2, back.z, "glowstone");
      }
    }
  }
}

// Entrance: double doors with a hanging lantern pair over them.
for (const dc of doorCells) {
  const gy = dc.g;
  const hinge = dc === doorCells[0] ? "left" : "right";
  g.set(dc.x, gy + 1, dc.z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(dc.x, gy + 2, dc.z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  g.set(dc.x, gy + 3, dc.z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
