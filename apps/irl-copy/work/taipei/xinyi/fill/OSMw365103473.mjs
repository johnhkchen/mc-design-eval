import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103473";
const W = 21, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(12, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const G = (x, z) => ground.get(key(x, z));

// outward neighbour offsets
const NB = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const PREF = ["s", "n", "e", "w"]; // front (south) preferred

function facesOf(x, z) {
  return PREF.filter((f) => {
    const [dx, dz] = NB[f];
    return !has(x + dx, z + dz);
  });
}

const edge = new Map();
for (const [x, z] of cells) edge.set(key(x, z), facesOf(x, z));
const isEdge = (x, z) => (edge.get(key(x, z)) || []).length > 0;

// ---- helpers ----------------------------------------------------------------
function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Entrance: median x of south-facing cells
const southXs = [];
for (const [x, z] of cells) if ((edge.get(key(x, z)) || []).includes("s")) southXs.push(x);
southXs.sort((a, b) => a - b);
const entranceX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : null;

// ---- build ------------------------------------------------------------------
for (const [x, z] of cells) {
  const gr = G(x, z);
  const faces = edge.get(key(x, z)) || [];
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  // foundation down to lowest ground, base course / ground floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks");

  // floor slab over storey 2 and roof deck (interior + under cornice)
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 9, z, perim ? "smooth_stone" : "red_terracotta");

  // rooftop plant: scattered AC units on interior roof
  if (!perim && x % 4 === 1 && z % 4 === 1) {
    put(x, gr + 10, z, "iron_block");
  }

  if (!perim) continue;

  const primary = faces[0];
  const p = primary === "n" || primary === "s" ? x : z;
  const isEntrance = primary === "s" && x === entranceX;
  const nearEntrance = primary === "s" && entranceX !== null && Math.abs(x - entranceX) === 1;
  const inward = INWARD[primary];
  const ix = x + inward[0], iz = z + inward[1];
  const canLight = has(ix, iz) && !isEdge(ix, iz);

  // ground storey: gr+1 .. gr+3 (shopfront), entrance recessed with door
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isEntrance && y === gr + 1) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (isEntrance && y === gr + 2) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isEntrance && y === gr + 3) {
      put(x, y, z, "smooth_quartz");
    } else if (corner || nearEntrance || p % 3 === 0) {
      // corner and entrance-flanking piers, plus regular bays
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, y, z, "glass");
      if (canLight && y === gr + 2 && (p + y) % 4 === 0) put(ix, y, iz, "glowstone");
    }
  }

  // lantern over the entrance, hung in the air gap behind the transom
  if (isEntrance && canLight) {
    put(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // awning band over shopfront (full-cell lintel across the front)
  put(x, gr + 4, z, "red_terracotta");

  // storey line
  put(x, gr + 5, z, "smooth_quartz");

  // upper storey: gr+6 .. gr+8 (quoins at corners, window bays between)
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (corner || p % 3 === 0) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, y, z, "light_blue_stained_glass");
      if (canLight && y === gr + 7 && (p + y) % 4 === 0) put(ix, y, iz, "glowstone");
    }
  }

  // cornice band and continuous parapet coping (slab, not teeth)
  put(x, gr + 9, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
