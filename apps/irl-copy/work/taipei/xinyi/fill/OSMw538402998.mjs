import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402998";
const W = 28, H = 23, D = 19;
const ROOF_Y = 10;      // roof deck over interior cells
const PARAPET_Y = 11;   // top of parapet / roof equipment base

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);

const inSet = (x, z) => ground.has(`${x},${z}`);
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// outward facing direction of a perimeter cell, or null if interior
function outward(x, z) {
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inSet(x + dx, z + dz)) return name;
  }
  return null;
}

const g = new Voxels([W, H, D]);

// ---- pass 1: foundations, floors, walls, roof ----
// entrance: centre of the south-facing frontage
const southAlong = [];
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (outward(x, z) === "south") southAlong.push(x);
}
southAlong.sort((a, b) => a - b);
const entranceX = southAlong.length ? southAlong[Math.floor(southAlong.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const per = outward(x, z);

  if (!per) {
    // interior: ground floor slab, storey slab, roof deck, air between
    if (gr <= 10) g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "smooth_stone");
    // roof equipment: small condenser units on a loose grid
    if (x % 8 === 4 && z % 6 === 3) {
      g.set(x, PARAPET_Y, z, "light_gray_concrete");
      g.set(x, PARAPET_Y + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // perimeter: facade
  const along = (per === "north" || per === "south") ? x : z;
  const paneProps = (per === "north" || per === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const shopTop = Math.min(gr + 3, 4);

  for (let y = gr; y <= ROOF_Y; y++) {
    let id;
    if (y === gr) {
      id = "polished_andesite";                       // base course
    } else if (y > gr && y <= shopTop) {
      id = along % 3 === 0 ? "white_concrete" : "glass"; // shopfront
    } else if (y === 5) {
      id = "smooth_stone";                             // storey line / fascia
    } else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9) id = "white_concrete";   // window head and sill frames
      else if (along % 3 === 0) id = "white_concrete"; // mullions
      else id = "light_blue_stained_glass_pane";
    } else if (y === ROOF_Y) {
      id = "smooth_stone";                             // cornice
    } else {
      continue;
    }
    if (id === "light_blue_stained_glass_pane") {
      g.set(x, y, z, id, paneProps);
    } else {
      g.set(x, y, z, id);
    }
  }

  // parapet cap
  g.set(x, PARAPET_Y, z, "stone_bricks");

  // entrance door and hanging lantern in the shopfront
  if (per === "south" && along === entranceX && gr + 2 <= 4) {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr + 3 <= 4) {
      g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// ---- pass 2: warm light behind the glass on the first floor ----
for (const [x, z, gr] of cells) {
  const per = outward(x, z);
  if (!per) continue;
  const along = (per === "north" || per === "south") ? x : z;
  if (along % 6 !== 1) continue;
  const [dx, dz] = DIRS[per];
  const ix = x - dx, iz = z - dz;      // inward neighbour
  if (!inSet(ix, iz) || outward(ix, iz)) continue;
  if (7 < gr) continue;
  g.set(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
