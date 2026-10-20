import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612470";
const W = 27, H = 23, D = 61;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: (x,z) -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 11;               // roof about 11 blocks above lowest ground (two storeys + parapet)
const minZ = Math.min(...cells.map((c) => c[1]));

// Safe setter: ignores anything outside the canvas height
function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Front (street) entrance: median x of the z-min row
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

for (const [x, z, gr] of cells) {
  const faces = {
    n: !has(x, z - 1), // z-min side: street front
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const isExt = faces.n || faces.s || faces.w || faces.e;
  const isFront = faces.n;

  // Storey lines relative to this column's top
  const top = Math.max(ROOF, gr + 8);
  const sl = top - 6;                  // second-floor slab
  const i = (faces.n || faces.s) ? x : z; // along-wall index for pattern

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab
  put(x, gr, z, isExt ? "polished_andesite" : "light_gray_concrete");

  // Walls, storey lines and glazing
  for (let y = gr + 1; y <= top - 1; y++) {
    if (!isExt) {
      if (y === sl) put(x, y, z, "light_gray_concrete"); // floor slab, interior air otherwise
      continue;
    }

    if (y === sl) {
      put(x, y, z, "smooth_quartz");   // storey line band
      continue;
    }

    if (y < sl) {
      // Ground-floor band: shopfront glazing on the street, glazed bays elsewhere
      const shopTop = Math.min(gr + 3, sl - 1);
      if (isFront && y <= shopTop) {
        if (x === doorX && z === minZ && y <= gr + 2) {
          // Door is written below
          continue;
        }
        if (i % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });
        else put(x, y, z, "light_blue_stained_glass");
      } else {
        if (i % 3 === 0) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Upper storey: spandrels at top and bottom, three-row window band
    if (y === sl + 1 || y === top - 1) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (i % 3 === 0) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }

    // Warm light behind some upper glazing
    if (y === sl + 3 && i % 6 === 2) {
      let ix = x, iz = z;
      if (faces.n) iz = z + 1;
      else if (faces.s) iz = z - 1;
      else if (faces.w) ix = x + 1;
      else if (faces.e) ix = x - 1;
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Entrance door on the street front
  if (isFront && x === doorX && z === minZ && gr + 2 < sl) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Canopy over the shopfront
  if (isFront && gr + 4 < sl) {
    put(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof deck
  put(x, top, z, "light_gray_concrete");

  // Parapet on the perimeter
  if (isExt && top + 1 < H) put(x, top + 1, z, "smooth_quartz");

  // Rooftop mechanical units, scattered on interior roof cells
  if (!isExt && x % 9 === 4 && z % 11 === 5 && top + 2 < H) {
    put(x, top + 1, z, "iron_block");
    put(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
