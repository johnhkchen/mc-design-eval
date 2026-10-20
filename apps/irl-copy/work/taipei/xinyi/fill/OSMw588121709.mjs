import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century to 1980s Taipei commercial block: concrete frame, quartz-tile
// facade, tinted glass bays, shopfronts on the ground storey, parapet and a
// rooftop mechanical penthouse. Three storeys of 5 blocks, roof near +17.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588121709";
const W = 11, H = 29, D = 19;
const STOREYS = 3, FH = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS = "cyan_stained_glass_pane";
const FLOOR = "light_gray_concrete";
const WALL = "smooth_quartz";
const FOUND = "stone_bricks";
const SLAB_PROPS = { type: "bottom", waterlogged: "false" };

for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, FOUND);

  // Which sides face outside the footprint.
  const out = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const outward = Object.keys(out).filter(k => out[k]);
  const perim = outward.length > 0;
  const corner = (out.N || out.S) && (out.E || out.W);
  const o = out.S ? "S" : out.N ? "N" : out.E ? "E" : out.W ? "W" : null;
  const wallAlongZ = o === "E" || o === "W"; // the wall runs along z
  const along = wallAlongZ ? z : x;
  // Interior cell just inside the facade, for warm light behind glass.
  const ix = o === "E" ? x - 1 : o === "W" ? x + 1 : x;
  const iz = o === "S" ? z - 1 : o === "N" ? z + 1 : z;

  // Storey bands, spandrels and window/mullion grid.
  for (let s = 0; s < STOREYS; s++) {
    const base = b + FH * s;
    put(x, base, z, FLOOR); // floor slab / storey band

    if (!perim) continue;

    if (corner) {
      for (let y = base + 1; y <= base + 4; y++) put(x, y, z, FLOOR);
      continue;
    }

    // Spandrel above the window band.
    put(x, base + 4, z, WALL);

    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (along % 2 === 0) {
        put(x, y, z, WALL); // mullion
      } else {
        const props = wallAlongZ
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        put(x, y, z, GLASS, props);
      }
    }

    // Warm light behind some windows.
    if (along % 4 === 1 && has(ix, iz) && (s === 0 || s === 1)) {
      put(ix, base + 2, iz, "glowstone");
    }
  }

  // Roof deck and parapet.
  put(x, b + 15, z, FLOOR);
  if (perim && !corner) put(x, b + 16, z, WALL);
  if (corner) put(x, b + 16, z, WALL);
}

// Entrance on the south facade, centre bay, ground storey.
for (const [x, z, b] of cells) {
  if (z === D - 1 && x === 5 && has(x, z) && !has(x, z + 1)) {
    put(x, b + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, WALL); // lintel
    put(x, b + 4, z, WALL);
    // Small hung lantern beside the door on the lintel side.
    if (has(x, z - 1)) put(x, b + 3, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop mechanical penthouse with a parapet-level cap on the centre.
for (const [x, z, b] of cells) {
  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perim) continue;
  if (x >= 3 && x <= 7 && z >= 5 && z <= 13) {
    put(x, b + 16, z, FLOOR);
    put(x, b + 17, z, FLOOR);
  }
  if (x >= 4 && x <= 6 && z >= 7 && z <= 11) {
    put(x, b + 18, z, "stone_brick_slab", SLAB_PROPS);
  }
}

g.save(`${DIR}/${ID}.nbt`);
