import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583926";
const W = 19, D = 17, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Face directions: name, dx, dz (outward normal)
const FACES = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];

// Per cell: outward faces (neighbour not in footprint)
const info = new Map();
for (const [x, z, gr] of cells) {
  const faces = FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz));
  info.set(`${x},${z}`, { x, z, gr, faces, edge: faces.length > 0, corner: faces.length >= 2 });
}

// Entrance: single-face south-facing cell nearest the footprint's centre line
const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const c of info.values()) {
  if (c.faces.length === 1 && c.faces[0][0] === "south") {
    if (!door || Math.abs(c.x - cx) < Math.abs(door.x - cx)) door = c;
  }
}
const doorKey = door ? `${door.x},${door.z}` : null;

// Pass 1: foundations, storeys, windows
for (const c of info.values()) {
  const { x, z, gr, faces, edge, corner } = c;

  // Foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  for (let s = 0; s < 2; s++) {
    const b = gr + 5 * s;

    // Floor slab / base course / string course at storey line
    if (edge) put(x, b, z, s === 0 ? "stone_bricks" : "smooth_stone");
    else put(x, b, z, "smooth_stone");

    if (!edge) continue; // interior: air gap, no interior fittings

    // Facade band: white tile-like concrete with a lintel at the top
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");

    if (corner || faces.length !== 1) continue; // pillars at corners

    const [name] = faces[0];
    const idx = name === "east" || name === "west" ? z : x;
    const isDoorCell = s === 0 && `${x},${z}` === doorKey;

    if (s === 0 && name === "south") {
      // Ground-floor shopfront with a door at the entrance
      if (isDoorCell) {
        put(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, b + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass");
      }
      continue;
    }

    // Upper and side windows: a regular grid with white piers between
    if (idx % 3 === 1) {
      for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass");
      // Warm light behind some windows (inside cell, if it is interior)
      const [, dx, dz] = faces[0];
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !info.get(`${ix},${iz}`).edge && (ix + iz + s) % 2 === 0) {
        put(ix, b + 2, iz, "glowstone");
      }
    }
  }
}

// Pass 2: roof deck, parapet, cap, rooftop plant
for (const c of info.values()) {
  const { x, z, gr, edge } = c;
  const roofY = gr + 10;
  if (edge) {
    put(x, roofY, z, "white_concrete");
    put(x, roofY + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, roofY, z, "smooth_stone");
    if (x % 5 === 2 && z % 5 === 2) {
      put(x, roofY + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
