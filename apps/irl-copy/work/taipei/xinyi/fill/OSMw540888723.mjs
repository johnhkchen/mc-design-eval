import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888723";
const W = 11, H = 23, D = 8;

// Two-storey mid-century commercial block: white tiled concrete frame,
// glazed shopfront at street level, ribbon windows above, flat roof with
// a penthouse and a parapet. Street frontage is the south face (z = D-1).
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(`${x},${z}`, gr);
const has = (x, z) => GROUND.has(`${x},${z}`);
const groundOf = (x, z) => GROUND.get(`${x},${z}`);

const ROOF = 11;      // roof slab level (about 11 blocks above lowest ground)
const PARAPET = 12;   // parapet course on the edge
const SLAB2 = 5;      // second-floor slab
const ROOF_TOP = 15;  // penthouse roof

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which exterior face a footprint cell lies on (null if interior).
function edgeFace(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Wall block for an exterior face cell at height y.
function wallBlock(x, z, face, y) {
  const along = face === "N" || face === "S" ? x : z;
  const length = face === "N" || face === "S" ? W : D;
  const pier = along % 2 === 0 || along === length - 1;

  if (pier) return { id: "white_concrete" };

  // Lintels, sills and the slab line read as solid bands between glazing.
  if (y === 4 || y === 6 || y === 10) return { id: "white_concrete" };

  const ground = y >= 1 && y <= 3;
  const upper = y >= 7 && y <= 9;
  if (ground || upper) return { id: "glass_pane", props: paneProps(face) };
  return { id: "white_concrete" };
}

// Foundation, floors, walls, cornice and parapet for every footprint cell.
for (const [x, z, gr] of cells) {
  const face = edgeFace(x, z);
  const isSouthEntry = face === "S" && x === 5 && z === D - 1;

  // Foundation up to the cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body from the cell's ground up to the roof slab.
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      put(x, y, z, face ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (y === SLAB2 || y === ROOF) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!face) continue; // interior air gap

    if (isSouthEntry) {
      if (y === 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 3) { put(x, y, z, "glass_pane", paneProps(face)); continue; }
    }

    const w = wallBlock(x, z, face, y);
    put(x, y, z, w.id, w.props);
  }

  // Parapet course on the edge.
  if (face && gr <= PARAPET) put(x, PARAPET, z, "white_concrete");
}

// Canopy over the street entrance.
for (let x = 4; x <= 6; x++) {
  put(x, 4, D - 1, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light behind some upper-storey windows (glowstone in the air gap).
for (const [x, z] of cells) {
  const face = edgeFace(x, z);
  if (!face) continue;
  const along = face === "N" || face === "S" ? x : z;
  const length = face === "N" || face === "S" ? W : D;
  const pier = along % 2 === 0 || along === length - 1;
  if (pier) continue;
  if (((x + z) % 3) !== 0) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || edgeFace(ix, iz)) continue;
  put(ix, 8, iz, "glowstone");
}

// Lanterns on the parapet corners.
const corners = [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]];
for (const [x, z] of corners) {
  if (has(x, z)) put(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof penthouse: light concrete box in the rear-west part of the roof.
for (let x = 6; x <= 8; x++) {
  for (let z = 1; z <= 3; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= ROOF_TOP - 2; y++) {
      const edge = x === 6 || x === 8 || z === 1 || z === 3;
      if (!edge) continue;
      if (z === 3 && x === 7 && y === 13) {
        put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, ROOF_TOP - 1, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
