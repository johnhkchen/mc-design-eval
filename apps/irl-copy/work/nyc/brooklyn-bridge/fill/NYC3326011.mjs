import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326011";
const W = 5, H = 20, D = 9;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  const gg = Math.max(0, Math.round(gr));
  let R = Math.round(roof);
  if (R - gg < 4) R = gg + 4;          // at least one storey plus a deck
  R = Math.min(R, H - 1);              // leave room for the parapet
  cellMap.set(key(x, z), { x, z, g: gg, R });
}

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (neighbour not in footprint)
const faces = (x, z) => {
  const f = [];
  if (!cellMap.has(key(x, z - 1))) f.push({ dx: 0, dz: -1 }); // north
  if (!cellMap.has(key(x, z + 1))) f.push({ dx: 0, dz: 1 });  // south
  if (!cellMap.has(key(x - 1, z))) f.push({ dx: -1, dz: 0 }); // west
  if (!cellMap.has(key(x + 1, z))) f.push({ dx: 1, dz: 0 });  // east
  return f;
};

// Glass pane connected along the wall it sits in
const glassPane = (face) => {
  const alongX = face.dz !== 0;
  return {
    north: alongX ? "true" : "false",
    south: alongX ? "true" : "false",
    east: alongX ? "true" : "true",
    west: alongX ? "true" : "true",
    waterlogged: "false",
  };
};

// Materials: brick walls, brownstone (brown terracotta) trim, stone base
const WALL = "bricks";
const TRIM = "brown_terracotta";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";

const deferredLit = [];
for (const cell of cellMap.values()) {
  const { x, z, g: gr, R } = cell;
  const f = faces(x, z);
  const perimeter = f.length > 0;
  const corner = f.length >= 2;

  // Rock-faced foundation from y0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  for (let y = gr; y <= R - 1; y++) {
    const rel = y - gr;

    if (y === R - 1) {               // cornice / roof deck
      put(x, y, z, perimeter ? TRIM : FLOOR);
      continue;
    }
    if (rel === 0) {                 // base course at grade
      put(x, y, z, perimeter ? TRIM : FLOOR);
      continue;
    }
    if (rel % 2 === 0) {             // floor slabs and belt courses
      put(x, y, z, perimeter ? TRIM : FLOOR);
      continue;
    }
    if (!perimeter) continue;        // interior air behind the glass

    const face = f[0];
    if (corner) {
      put(x, y, z, TRIM);            // brownstone quoins at the corners
      continue;
    }
    const along = face.dz !== 0 ? x : z;
    if (along % 2 === 1) {
      put(x, y, z, "glass_pane", glassPane(face));
      if ((along + rel) % 4 === 0) {
        deferredLit.push({ x: x - face.dx, y, z: z - face.dz });
      }
    } else {
      put(x, y, z, WALL);
    }
  }

  // Parapet on the perimeter, standing on the roof deck
  if (perimeter && R < H) put(x, R, z, TRIM);
}

// Warm light behind some windows (inside the air gap)
for (const p of deferredLit) {
  if (cellMap.has(key(p.x, p.z))) put(p.x, p.y, p.z, "glowstone");
}

// Street entrance on the north face, centred on x=2
const door = cellMap.get(key(2, 0));
if (door) {
  const gr = door.g;
  const R = door.R;
  put(2, gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, gr + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Entrance canopy hood across the door bay
  if (gr + 3 < R - 1) {
    for (let x = 1; x <= 3; x++) {
      if (cellMap.has(key(x, 0))) {
        put(x, gr + 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
