import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865182";
const W = 9, H = 23, D = 10;
// Roof record: ~11 blocks above lowest ground. Walls run to y=10, parapet/roof deck at y=10, plant on y=11.
const TOP = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const minG = Math.min(...cells.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr - minG));
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function exposures(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Pane connections so glass joins its neighbours along the wall it sits in.
function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Window vs pier: on a single exposed face, alternate by position along the face.
// Corners (two exposed faces) are always piers.
function isWindow(x, z, face) {
  const i = (face === "north" || face === "south") ? x : z;
  return i % 2 === 1;
}

// Pick the entrance: a north-facing exposed cell near the middle of the frontage.
let doorCell = null;
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0 - minG);
  const ex = exposures(x, z);
  if (ex.length === 1 && ex[0] === "north" && gr <= 8) {
    if (!doorCell || Math.abs(x - 4) < Math.abs(doorCell.x - 4)) {
      doorCell = { x, z, gr };
    }
  }
}

// ---- Foundations, floors, roof deck, walls ----
for (const [cx, cz, gr0] of cells) {
  const gr = Math.round(gr0 - minG);
  const ex = exposures(cx, cz);

  // Foundation under every footprint cell up to its own ground.
  for (let y = 0; y < gr; y++) g.set(cx, y, cz, "stone_bricks");

  if (ex.length === 0) {
    // Interior: floor slab at storey line, roof deck, sparse rooftop plant.
    if (gr <= 5) g.set(cx, 5, cz, "gray_concrete");
    if (gr <= TOP) {
      g.set(cx, TOP, cz, "gray_concrete");
      if ((cx * 3 + cz * 5) % 7 === 0) g.set(cx, TOP + 1, cz, "light_gray_concrete");
    }
    continue;
  }

  if (gr > TOP) continue; // cell sits above the roof line; foundation only

  const corner = ex.length >= 2;
  const face = ex[0];
  const win = !corner && isWindow(cx, cz, face);
  const pane = win ? paneProps(face) : null;

  for (let y = gr; y <= TOP; y++) {
    let id = null;
    let props = undefined;

    if (y === TOP) {
      id = "quartz_block";                       // cornice / parapet
    } else if (y === gr) {
      id = "polished_andesite";                  // base course
    } else if (y === 5) {
      id = "quartz_block";                       // storey line
    } else if (y === 4) {
      id = "white_concrete";                     // ground-floor lintel band
    } else if (y <= 3) {
      // Ground floor: shopfront glazing between piers.
      id = win ? "glass_pane" : "white_concrete";
      if (win) props = pane;
    } else {
      // Upper storey (6..9): window grid with frames.
      id = win ? "glass_pane" : "white_concrete";
      if (win) props = pane;
    }

    if (id) g.set(cx, y, cz, id, props);
  }

  // Floor slab tie-in behind the wall line at storey 2 for interior edge cells.
  // (Interior cells already receive their own slabs above.)
}

// ---- Warm lights behind some upper windows ----
for (const [cx, cz, gr0] of cells) {
  const gr = Math.round(gr0 - minG);
  if (gr > 7) continue;
  const ex = exposures(cx, cz);
  if (ex.length !== 1) continue;
  const face = ex[0];
  if (!isWindow(cx, cz, face)) continue;
  const i = (face === "north" || face === "south") ? cx : cz;
  if (i % 4 !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = cx - dx, iz = cz - dz;
  if (!has(ix, iz) || exposures(ix, iz).length !== 0) continue;
  g.set(ix, 7, iz, "glowstone");
}

// ---- Entrance: dark oak door behind a lintel, with a lit lantern-style pair ----
if (doorCell) {
  const { x, z, gr } = doorCell;
  const base = {
    facing: "north",
    hinge: "left",
    open: "false",
    powered: "false",
  };
  g.set(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
  g.set(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
  // Lamps flanking the door on the shopfront.
  if (gr + 3 <= 3 && has(x - 1, z) && exposures(x - 1, z).includes("north")) {
    g.set(x - 1, gr + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (has(x + 1, z) && exposures(x + 1, z).includes("north") && gr + 3 <= 3) {
    g.set(x + 1, gr + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
