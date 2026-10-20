import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw653568674";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const W = 8, H = 19, D = 14;
const g = new Voxels([W, H, D]);

const has = (x, z) => ground.has(key(x, z));
const exterior = (x, z) => ({
  north: !has(x, z - 1),
  south: !has(x, z + 1),
  west: !has(x - 1, z),
  east: !has(x + 1, z),
});

const put = (x, y, z, r) => {
  if (!r) return;
  const [id, props] = r;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane oriented to run along the wall face it sits in.
function pane(face) {
  if (face === "north" || face === "south") {
    return ["glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];
  }
  return ["glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
}

// Decide what sits in a cell at height y.
function place(x, z, y, gr, ext) {
  const face = ext.north ? "north" : ext.south ? "south" : ext.west ? "west" : ext.east ? "east" : null;
  const perim = face !== null;

  if (y === gr) return perim ? ["stone_bricks"] : ["smooth_stone"];   // base course / ground floor slab
  if (y === 4) return ["smooth_quartz"];                              // storey floor slab and band
  if (y === 6) return ["smooth_quartz"];                              // roof slab and cornice
  if (!perim) return null;                                            // interior air gap

  const idx = face === "north" || face === "south" ? x : z;
  const street = face === "north";

  if (y === 5) {                                                      // upper storey windows
    return idx % 2 === 1 ? pane(face) : ["white_concrete"];
  }
  if (y === 3) {                                                      // ground storey head: awning band on street
    return street ? ["dark_oak_slab", { type: "top", waterlogged: "false" }] : ["light_gray_concrete"];
  }
  // ground storey between base and head
  if (street) {
    if (x === 3 && g_doorOK(gr) && (y === gr + 1 || y === gr + 2)) {
      return ["oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      }];
    }
    if (idx >= 1 && idx <= 6) return pane(face);
    return ["white_concrete"];
  }
  return idx % 2 === 1 ? pane(face) : ["white_concrete"];
}

function g_doorOK(gr) {
  return gr + 2 <= 2; // door fits below the awning band at y=3
}

// Foundation and walls per cell.
for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, ["stone_bricks"]);   // foundation up to ground
  for (let y = gr; y <= 6; y++) put(x, y, z, place(x, z, y, gr, ext));
}

// Warm lanterns hanging from the roof slab in the upper storey interior.
for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);
  const perim = ext.north || ext.south || ext.west || ext.east;
  if (!perim && gr <= 5 && (x === 2 || x === 5) && z === 2) {
    put(x, 5, z, ["lantern", { hanging: "true", waterlogged: "false" }]);
  }
}

// Rooftop plant box sitting on the roof slab, kept inside the footprint.
for (let x = 2; x <= 4; x++) {
  for (let z = 5; z <= 8; z++) {
    if (has(x, z)) {
      const gr = ground.get(key(x, z));
      if (gr <= 6) put(x, 7, z, ["light_gray_concrete"]);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
