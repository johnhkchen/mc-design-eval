import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw538408133.cells.json`, "utf8"));

const W = 22, H = 23, D = 20;
const ROOF_TOP = 10;          // structure tops out at y=10, roof surface at y=11
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => cellMap.has(`${x},${z}`);
const groundOf = (x, z) => cellMap.get(`${x},${z}`);

// missing neighbours mark the perimeter faces
const DIRS = {
  zm: [0, -1], zp: [0, 1], xm: [-1, 0], xp: [1, 0],
};
const missingFaces = (x, z) =>
  Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
const isEdge = (x, z) => missingFaces(x, z).length > 0;

// bounds of the north (min-z) street face, used to centre the entrance
let nMinX = Infinity, nMaxX = -Infinity;
for (const [x, z] of cells) {
  if (!inside(x, z - 1)) { nMinX = Math.min(nMinX, x); nMaxX = Math.max(nMaxX, x); }
}
const doorX = Number.isFinite(nMinX) ? Math.round((nMinX + nMaxX) / 2) : Math.floor(W / 2);

// 1) foundations and interior floor slabs
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    if (gr < H) g.set(x, gr, z, "smooth_stone");           // ground floor slab
    if (gr + 5 <= 9) g.set(x, gr + 5, z, "light_gray_concrete"); // upper floor slab
    g.set(x, ROOF_TOP, z, "light_gray_concrete");          // roof deck
  }
}

// 2) facade on perimeter cells
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const gr = groundOf(x, z);
  const faces = missingFaces(x, z);
  const face = faces.includes("zm") ? "zm" : faces[0];
  const along = (face === "zm" || face === "zp") ? x : z;
  const isDoorCell = face === "zm" && x === doorX;

  for (let y = gr; y <= ROOF_TOP; y++) {
    const rel = y - gr;
    let block = null, props = undefined;

    if (y === ROOF_TOP) {
      block = "white_concrete";                                  // parapet cap
    } else if (rel === 0) {
      block = "polished_andesite";                               // base course
    } else if (rel >= 1 && rel <= 3) {
      if (isDoorCell && (rel === 1 || rel === 2)) {
        block = "dark_oak_door";
        props = {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (along % 3 === 0 || isDoorCell) {
        block = "white_concrete";                                // mullion / door frame
      } else {
        block = "light_blue_stained_glass";                      // shopfront glass
      }
    } else if (rel === 4) {
      block = "smooth_stone";                                    // fascia
    } else if (rel === 5 || rel === 9) {
      block = "light_gray_concrete";                             // storey lines
    } else if (rel >= 6 && rel <= 8 && y <= 9) {
      block = (along % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
    }

    if (block) {
      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    }
  }

  // warm light behind some upper windows, one cell inside the shell
  const gU = gr + 7;
  if (gU <= 8 && (along % 6 === 1) && !isDoorCell) {
    const inward = { zm: [0, 1], zp: [0, -1], xm: [1, 0], xp: [-1, 0] }[face];
    const ix = x + inward[0], iz = z + inward[1];
    if (inside(ix, iz) && !isEdge(ix, iz)) g.set(ix, gU, iz, "shroomlight");
  }

  // lantern hanging above the entrance, under the fascia
  if (isDoorCell) {
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 3) roof equipment on the interior of the roof
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 7 === 3 && z % 6 === 2 && ROOF_TOP + 1 < H) {
    g.set(x, ROOF_TOP + 1, z, "iron_block");
  }
}

g.save(`${dir}/OSMw538408133.nbt`);
