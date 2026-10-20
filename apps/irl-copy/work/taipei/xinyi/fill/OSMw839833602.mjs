import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833602";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Two-storey Taipei commercial block: stone plinth, white concrete frame,
// shopfront ground floor, ribbon windows above, parapet roof with plant boxes.
const ROOF = 10;     // roof deck block (top surface at 11)
const PARAPET = 11;  // parapet course on the roof edge

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isEdge = (x, z) => faces(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main (south) entrance: middle of the cells that face south
const southXs = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (faces(x, z).includes("south")) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const doorZ = southXs.length ? Math.max(...[...ground.keys()].map((k) => Number(k.split(",")[1]))) : -1;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const fs = faces(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > ROOF) continue; // ground above the roof line: nothing to build here

  // Ground floor slab on interior cells
  if (!edge) put(x, gr, z, "smooth_stone");

  // Storey floor slab on interior cells (second floor)
  if (!edge && gr + 5 < ROOF) put(x, gr + 5, z, "smooth_stone");

  // Roof deck
  put(x, ROOF, z, edge ? "white_concrete" : "light_gray_concrete");

  if (edge) {
    const face = fs[0];
    const along = face === "north" || face === "south" ? x : z;
    const i = along;
    const winAxis = face === "north" || face === "south" ? ["north", "south"] : ["east", "west"];

    // Roof-edge parapet
    put(x, PARAPET, z, "stone_brick_wall");

    for (let y = gr; y < ROOF; y++) {
      const rel = y - gr;
      const isDoorCell = face === "south" && z === doorZ && x === doorX;

      if (isDoorCell && rel <= 1) {
        put(x, y, z, "oak_door", {
          facing: "south",
          half: rel === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      let id = null;
      let props = null;

      if (rel === 0) {
        id = "polished_andesite"; // base course
      } else if (rel <= 3) {
        if (isDoorCell) {
          id = "smooth_stone"; // lintel over the door
        } else if (i % 4 === 0) {
          id = "stone_bricks"; // shopfront pilaster
        } else {
          id = "glass"; // shopfront glazing
        }
      } else if (rel === 4) {
        id = "smooth_stone"; // storey line
      } else if (rel === 5) {
        id = "light_gray_concrete"; // floor spandrel
      } else if (rel >= 6 && rel <= 8) {
        if (i % 3 === 0) {
          id = "white_concrete"; // window mullion
        } else {
          id = "glass_pane";
          props = {
            north: winAxis[0] === "north" ? "true" : "false",
            south: winAxis[0] === "north" ? "true" : "false",
            east: winAxis[0] === "east" ? "true" : "false",
            west: winAxis[0] === "east" ? "true" : "false",
            waterlogged: "false",
          };
        }
      } else if (rel === 9) {
        id = "light_gray_concrete"; // head band under cornice
      }

      if (id) put(x, y, z, id, props);

      // Warm light behind some upper windows (inside the air gap)
      if (rel === 7 && i % 6 === 1) {
        let ix = x, iz = z;
        if (face === "north") iz = z + 1;
        else if (face === "south") iz = z - 1;
        else if (face === "west") ix = x + 1;
        else if (face === "east") ix = x - 1;
        if (has(ix, iz) && gAt(ix, iz) === gr) put(ix, y, iz, "glowstone");
      }
    }
  } else {
    // Interior cells: air only (plus slabs above). Cornice/roof handled above.
  }

  // Rooftop plant boxes on a sparse grid of interior cells
  if (!edge && gr === ROOF && x % 6 === 3 && z % 6 === 3) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
