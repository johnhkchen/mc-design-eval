// LAOGAI MUSEUM, 2017 S St NW: a red-brick, early-20th-century block with white quoins and cornice.
// Three window rows (y 1, 3, 5) over a stone plinth (y 0), with brick spandrels and floor slabs at y 2 and 4. The south and west wing is
// one storey shorter (roof at 6, the lidar's tier); the north-east mass rises to 7. Walls are shell only: air behind
// the glass, a solid floor slab per storey, a flat roof deck on the walls, and a small plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79744.cells.json`, "utf8"));   // [x, z, ground, roof]

const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => FP.has(`${x},${z}`);

// the built volume, as a map so the glass and the lights can look at their neighbours before the file is written
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const got = (x, y, z) => B.get(`${x},${y},${z}`);

// the side a cell shows to the street: north, then south, west, east (null for an interior cell)
const face = (x, z) => (!inFp(x, z - 1) ? "N" : !inFp(x, z + 1) ? "S" : !inFp(x - 1, z) ? "W" : !inFp(x + 1, z) ? "E" : null);
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
// along the face: 0..7 for north and south (x), west and east (z); quoins at the ends, brick piers at 3 and 4, glass between
const along = (f, x, z) => (f === "N" || f === "S" ? x : z);
const bayBlock = (a) => (a === 0 || a === 7 ? "smooth_quartz" : a === 3 || a === 4 ? "bricks" : "glass_pane");

const glass = [];
for (const [x, z, , roof] of cells) {
  const top = roof - 1;                       // the roof deck's row; the top surface sits at y = roof
  const f = face(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === 0) put(x, y, z, "stone_bricks");                                   // plinth, also the foundation fill
    else if (y === top) put(x, y, z, f ? (roof === 6 ? "bricks" : "smooth_quartz") : "smooth_stone"); // wall tops: quartz cornice on the tower, brick on the lower wing; deck inside
    else if (y === 2 || y === 4) put(x, y, z, f ? "bricks" : "smooth_stone");    // brick spandrel / floor slab
    else if (f) {                                                                // window rows 1, 3, 5 on the shell
      const b = bayBlock(along(f, x, z));
      if (b === "glass_pane") glass.push({ x, y, z, f });
      put(x, y, z, b, b === "glass_pane" ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
    }
  }
  if (f) put(x, top + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet ring
}

// the entrance on the north front, at along-index 2: door in the ground storey, a lintel over it
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(2, 1, 0, "dark_oak_door", door("lower"));
put(2, 2, 0, "dark_oak_door", door("upper"));
put(2, 3, 0, "smooth_quartz");
for (let i = glass.length - 1; i >= 0; i--) if (glass[i].x === 2 && glass[i].z === 0 && (glass[i].y === 1 || glass[i].y === 3)) glass.splice(i, 1);

// a plant room set back on the roof of the north-east mass (roof deck at 6, so its base sits at 7)
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) {
  put(x, 7, z, "light_gray_concrete");
  put(x, 8, z, "light_gray_concrete");
}

// glass panes join the neighbouring piers, quoins and panes along their face, as a vanilla pane does
const paneLink = (block) => block === "glass_pane" || block === "bricks" || block === "smooth_quartz";
for (const g of glass) {
  const state = { waterlogged: "false" };
  const side = (dx, dz) => paneLink(got(g.x + dx, g.y, g.z + dz)?.block);
  state.north = String(side(0, -1)); state.south = String(side(0, 1));
  state.west = String(side(-1, 0)); state.east = String(side(1, 0));
  put(g.x, g.y, g.z, "glass_pane", state);
}

// warm lights in some windows: a lantern on the floor behind a pane, and a glowstone block behind a few more
glass.forEach((g, i) => {
  const [dx, dz] = inward[g.f];
  const x = g.x + dx, z = g.z + dz;
  if (!inFp(x, z) || got(x, g.y, z)) return;
  if (i % 3 === 0) put(x, g.y, z, "lantern", { hanging: "false", waterlogged: "false" });
  else if (i % 7 === 5) put(x, g.y, z, "glowstone");
});

const g = new Voxels([8, 19, 8]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC79744.nbt`);
console.log(`DC79744.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
