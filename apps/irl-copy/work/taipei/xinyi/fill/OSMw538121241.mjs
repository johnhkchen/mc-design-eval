import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no OSM tags. Read as a 2-storey, cream-rendered concrete shophouse
// (1980s-90s Xinyi-area low-rise): stone plinth, ground-floor shopfront with a
// red fascia on the street face, two window bays per storey, parapet and
// rooftop AC units. Roof sits at y 10, parapet at y 11 (about 11 above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121241";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 16;
const ROOF_Y = 10;      // roof slab / cornice band
const PARAPET_Y = 11;   // parapet top, about 11 blocks above lowest ground
const STOREY_Y = 5;     // second-floor slab and storey line
const GROUND_TOP = 4;   // ground-floor lintel band
const TOP_BAND = 9;     // second-floor head band

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.round(gr));
}

const g = new Voxels([W, H, D]);

// Which street-wall face a perimeter cell belongs to, its index along that face,
// and the direction into the building (for backlighting windows).
function faceOf(x, z) {
  if (z === 0) return { name: "N", idx: x, inward: [0, 1] };
  if (z === D - 1) return { name: "S", idx: x, inward: [0, -1] };
  if (x === 0) return { name: "W", idx: z, inward: [1, 0] };
  if (x === W - 1) return { name: "E", idx: z, inward: [-1, 0] };
  return null;
}

function paneProps(face) {
  if (face.name === "N" || face.name === "S") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Rooftop AC units on the roof, interior cells only.
const acUnits = new Set(["3,3", "4,3", "11,12", "12,12"]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  const edge = !!f;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Nothing above the parapet; cells above the building ceiling stay foundation only.
  if (gr > PARAPET_Y) continue;

  for (let y = gr; y <= PARAPET_Y; y++) {
    let block = null;
    let props = undefined;

    if (y === gr) {
      // Floor plane / plinth course on the foundation.
      block = edge ? "stone_bricks" : "smooth_stone";
    } else if (y === ROOF_Y) {
      // Roof slab across the footprint; cornice ring on the perimeter.
      block = edge ? "quartz_block" : "smooth_stone";
    } else if (y === PARAPET_Y) {
      if (edge) {
        block = "stone_brick_slab";
        props = { type: "bottom", waterlogged: "false" };
      } else if (acUnits.has(`${x},${z}`)) {
        block = "iron_block";
      }
    } else if (y === STOREY_Y) {
      // Second-floor slab, also a storey line on the facade.
      block = "smooth_stone";
    } else if (!edge) {
      // Interior: air gap behind the glass, no interior fit-out.
      block = null;
    } else {
      // Facade cells.
      if (y === GROUND_TOP) {
        block = f.name === "N" ? "red_terracotta" : "smooth_stone";
      } else if (y === TOP_BAND) {
        block = "smooth_stone";
      } else {
        const isGroundWindowRow = y > gr && y <= 3;
        const isUpperWindowRow = y >= 6 && y <= 8;
        if (isGroundWindowRow || isUpperWindowRow) {
          if (f.idx % 3 === 0) {
            // Pier between bays (also the corners).
            block = "quartz_block";
          } else if (f.name === "N" && f.idx === 7 && y === gr + 1 && gr + 2 <= 3) {
            // Shopfront entrance door (lower half), upper half set below.
            block = "oak_door";
            props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
          } else if (f.name === "N" && f.idx === 7 && y === gr + 2 && gr + 2 <= 3) {
            block = "oak_door";
            props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
          } else {
            block = "glass_pane";
            props = paneProps(f);
          }
        } else {
          block = "quartz_block";
        }
      }
    }

    if (block) {
      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    }

    // Warm light behind selected upper-floor windows (glowstone in the air gap).
    if (edge && y === 7 && f.idx % 3 !== 0 && f.idx % 4 === 1) {
      const ix = x + f.inward[0];
      const iz = z + f.inward[1];
      if (ix > 0 && ix < W - 1 && iz > 0 && iz < D - 1) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
