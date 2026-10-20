import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458209";
const W = 12, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => foot.has(key(x, z));

// Floor datum: highest footprint ground, so every cell is solid up to a common floor.
const F = Math.max(...cells.map(c => c[2]));
if (F + 12 > H - 1) throw new Error(`Floor datum ${F} too high for grid height ${H}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed sides: a side is exposed when the neighbour cell is outside the footprint.
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isEdge = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.E || e.W; };

// Centre of footprint, used for the entrance and rooftop plant.
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);

// Entrance: south-facing edge cell closest to the centre line.
let door = null;
for (const [x, z] of cells) {
  if (!isEdge(x, z) || has(x, z + 1)) continue;
  if (!exposed(x, z).S) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door[0] - cx)) door = [x, z];
}

// Pass 1: solid foundation, floor slabs, storey lines, roof deck.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");   // foundation up to datum
  put(x, F, z, "smooth_stone");                               // ground floor slab
  put(x, F + 5, z, "smooth_stone");                           // storey line / 2F slab
  put(x, F + 10, z, "light_gray_concrete");                   // roof deck
}

// Pass 2: facade on edge cells.
const lightCells = [];
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const e = exposed(x, z);
  // Index along the wall: x for north/south faces, z for east/west faces.
  const i = (e.N || e.S) ? x : z;
  const pier = (i % 3 === 0);

  put(x, F + 1, z, "polished_granite");                       // base course
  put(x, F + 2, z, pier ? "white_concrete" : "glass_pane");   // shopfront glazing
  put(x, F + 3, z, pier ? "white_concrete" : "glass_pane");
  put(x, F + 4, z, "light_gray_concrete");                    // transom band
  put(x, F + 6, z, "white_concrete");                         // upper spandrel
  put(x, F + 7, z, pier ? "white_concrete" : "glass_pane");   // upper windows
  put(x, F + 8, z, pier ? "white_concrete" : "glass_pane");
  put(x, F + 9, z, "white_concrete");                         // upper spandrel
  put(x, F + 11, z, "smooth_stone");                          // parapet coping

  // Warm light behind some windows, in the interior cell just inside the glass.
  if (!pier) {
    const dx = e.W ? 1 : (e.E ? -1 : 0);
    const dz = e.N ? 1 : (e.S ? -1 : 0);
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      if (i % 6 === 1) lightCells.push([ix, F + 7, iz, "glowstone"]);
      if (i % 6 === 4) lightCells.push([ix, F + 2, iz, "shroomlight"]);
    }
  }
}
for (const [x, y, z, id] of lightCells) put(x, y, z, id);

// Entrance doorway: frame, lintel, and a two-block door facing out to the south.
if (door) {
  const [x, z] = door;
  put(x, F + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, F + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, F + 3, z, "white_concrete");
}

// Rooftop plant: a small block of mechanical units on interior roof cells.
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 2; z <= cz; z++) {
    if (has(x, z) && !isEdge(x, z)) put(x, F + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
