import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893366";
const W = 14, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward normal of an edge cell: [dx, dz] or null for interior
function outward(x, z) {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  return null;
}
const facingOf = ([dx, dz]) => (dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east");

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey lines (absolute): ground floor 0..4, floor slab y=5, upper 6..9, cornice 10, roof deck 11, parapet 12.
const FLOOR_Y = 5, CORNICE_Y = 10, ROOF_Y = 11, PARAPET_Y = 12;

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = ground.get(`${x},${z}`);
  const edge = isEdge(x, z);
  const out = edge ? outward(x, z) : null;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab and roof deck stand on every footprint cell
  if (gr <= FLOOR_Y) put(x, FLOOR_Y, z, "light_gray_concrete");
  if (gr <= ROOF_Y) put(x, ROOF_Y, z, "light_gray_concrete");

  if (!edge) continue;

  const [dx, dz] = out;
  const along = dz !== 0 ? x : z;
  const pier = along % 3 === 0;

  // Base course at the cell's ground
  put(x, gr, z, "stone_bricks");

  // Ground-floor shopfront (ground+1 .. 4)
  const isEntrance = dz === -1 && along === 6;
  for (let y = gr + 1; y <= 4; y++) {
    if (y >= FLOOR_Y) break;
    if (isEntrance && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: facingOf(out),
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Upper storey windows (6..9), piers between them
  for (let y = 6; y <= 9; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // Warm lights behind some upper windows, in the air gap just inside
  if (!pier) {
    const h = (x * 7 + z * 3) % 4;
    if (h === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, 7, iz, "shroomlight");
    }
  }

  // Cornice and parapet
  put(x, CORNICE_Y, z, "smooth_stone");
  if (gr <= ROOF_Y) put(x, PARAPET_Y, z, "white_concrete");
}

// Rooftop plant box on interior cells near the centre
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 4 && x <= 7 && z >= 3 && z <= 6) {
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "light_gray_concrete");
    put(x, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
