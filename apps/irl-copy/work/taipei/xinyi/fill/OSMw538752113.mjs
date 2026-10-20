import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block, c. 1980s: two full storeys over a plinth,
// white tiled-concrete facade with light-grey storey bands, aluminium-framed
// glass, shopfront at grade, parapet with cornice, and rooftop AC plant.
// Roof sits 11 blocks above each cell's own ground (lidar record).

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538752113";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Choose the entrance: median-along cell on the south face that is not a corner.
const southCands = [];
for (const [x, z] of cells) {
  const faces = Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
  if (faces.length === 1 && faces[0] === "south") southCands.push(x);
}
southCands.sort((a, b) => a - b);
const doorX = southCands.length ? southCands[Math.floor(southCands.length / 2)] : null;
const doorZ = doorX === null ? null : (() => {
  let zmax = -1;
  for (const [x, z] of cells) if (x === doorX) zmax = Math.max(zmax, z);
  return zmax;
})();

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
  const isEdge = faces.length > 0;
  const isCorner = faces.length >= 2;

  for (let r = 0; r <= 10; r++) {
    const y = gr + r;

    if (!isEdge) {
      // Interior: only floor slabs and roof deck, air gap otherwise.
      if (r === 0) put(x, y, z, "smooth_stone");
      else if (r === 5) put(x, y, z, "light_gray_concrete");
      else if (r === 10) put(x, y, z, "smooth_stone");
      continue;
    }

    // Edge cell: solid wall shell with floor slab at r=5.
    let wall = "white_concrete";
    if (r === 0) wall = "polished_andesite";          // plinth course
    else if (r === 5 || r === 9) wall = "light_gray_concrete"; // storey line / lintel band
    else if (r === 10) wall = "smooth_stone";         // cornice / parapet cap

    if (isCorner || r === 0 || r === 5 || r === 9 || r === 10) {
      put(x, y, z, isCorner && r >= 1 && r <= 9 ? "light_gray_concrete" : wall);
      continue;
    }

    put(x, y, z, wall);

    // Facade openings on the single face this cell belongs to.
    const face = faces[0];
    const along = (face === "north" || face === "south") ? x : z;
    const idx = along % 3;
    const shopRow = r >= 1 && r <= 3;
    const upperRow = r >= 6 && r <= 8;

    if (shopRow) {
      // Door occupies the entrance column at r=1..2.
      if (face === "south" && x === doorX && z === doorZ && (r === 1 || r === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (face === "south" && x === doorX && z === doorZ && r === 3) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (idx !== 0) {
        put(x, y, z, "glass_pane", paneProps(face));
      } else {
        put(x, y, z, "polished_andesite");
      }
      continue;
    }

    if (upperRow) {
      if (idx !== 0) {
        put(x, y, z, "glass_pane", paneProps(face));
        // Warm light behind some upper windows.
        if (r === 7 && (x + z) % 4 === 0) {
          const [ox, oz] = DIRS[OPP[face]];
          const ix = x + ox, iz = z + oz;
          if (has(ix, iz)) put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }

  // Rooftop AC plant on interior roof, one unit per grid point.
  if (!isEdge && x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
