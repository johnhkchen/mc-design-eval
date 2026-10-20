import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883618";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]
const W = 7, H = 23, D = 6;
const g = new Voxels([W, H, D]);

// Two-storey shophouse, c. 1980s: quartz-tile walls, stone base, shopfront glass
// at street level, paired upper windows with warm lit panes, parapet roof at y=10.
const ROOF_TOP_Y = 10; // roof surface at y=10, parapet course at y=10 (top = 11)

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.min(Math.max(0, gr), 10));
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (!has(x, z)) return;
  if (y < groundAt(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces: direction name, neighbour offset, and the axis the facade runs along.
const FACES = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];

// Per-cell exterior faces.
const info = new Map();
for (const [x, z] of gmap.keys().map((k) => k.split(",").map(Number))) {
  const faces = FACES.filter((f) => !has(x + f.dx, z + f.dz));
  info.set(`${x},${z}`, { x, z, faces });
}

// Facade extents per face, so corner cells become pillars.
const ext = {};
for (const c of info.values()) {
  for (const f of c.faces) {
    const t = f.along === "x" ? c.x : c.z;
    const e = (ext[f.name] ??= { min: Infinity, max: -Infinity });
    e.min = Math.min(e.min, t);
    e.max = Math.max(e.max, t);
  }
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  const ground = Math.min(Math.max(0, gr), 10);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
}

// Choose the entrance: prefer a middle column on the south (street-facing) face.
let door = null;
{
  const cands = [...info.values()].filter(
    (c) => c.faces.length === 1 && c.faces[0].name === "south"
  );
  const fallback = [...info.values()].filter((c) => c.faces.length === 1);
  const pool = cands.length ? cands : fallback;
  if (pool.length) {
    const f = pool[0].faces[0];
    const e = ext[f.name];
    const mid = (e.min + e.max) / 2;
    door = pool
      .filter((c) => c.faces[0].name === f.name)
      .sort((a, b) => Math.abs((a.x - mid)) - Math.abs((b.x - mid)))[0];
  }
}

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of info.values()) {
  const { x, z, faces } = c;

  // Interior cells: floor slab at the second-storey line and a roof deck.
  if (faces.length === 0) {
    put(x, 5, z, "smooth_stone");
    put(x, ROOF_TOP_Y, z, "light_gray_concrete");
    continue;
  }

  // Corner or multi-face cells become pillars.
  const f = faces[0];
  const t = f.along === "x" ? x : z;
  const e = ext[f.name];
  const isPillar = faces.length >= 2 || t === e.min || t === e.max;

  if (isPillar) {
    for (let y = 0; y <= ROOF_TOP_Y; y++) {
      if (y === 0) put(x, y, z, "stone_bricks");
      else if (y === 5) put(x, y, z, "smooth_stone");
      else put(x, y, z, "white_concrete");
    }
    continue;
  }

  // Facade cell.
  const outward = f.name;
  const pp = paneProps(f.name);
  const isDoorCell = door && door.x === x && door.z === z;

  put(x, 0, z, "stone_bricks");

  // Ground floor shopfront: glass band with an entrance door and fascia.
  if (isDoorCell) {
    put(x, 1, z, "oak_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "glass_pane", pp);
  } else {
    put(x, 1, z, "glass_pane", pp);
    put(x, 2, z, "glass_pane", pp);
    put(x, 3, z, "glass_pane", pp);
  }
  put(x, 4, z, "black_concrete");   // shopfront fascia
  put(x, 5, z, "smooth_stone");     // storey line / cornice band
  put(x, 6, z, "smooth_quartz");    // sill course

  // Upper storey: alternating windows between quartz piers.
  const isWindow = (t - e.min) % 2 === 1;
  const lit = (t - e.min) % 4 === 1;
  if (isWindow) {
    put(x, 7, z, lit ? "glowstone" : "glass_pane", lit ? undefined : pp);
    put(x, 8, z, "glass_pane", pp);
  } else {
    put(x, 7, z, "smooth_quartz");
    put(x, 8, z, "smooth_quartz");
  }
  put(x, 9, z, "smooth_quartz");    // head course
  put(x, ROOF_TOP_Y, z, "white_concrete"); // parapet
}

g.save(`${DIR}/${ID}.nbt`);
