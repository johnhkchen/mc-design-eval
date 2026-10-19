// DC64266: 250 E St SW, Washington DC (L'Enfant Plaza). A 1970s federal-era precast office: a long
// 15-block central bar (about ten storeys at 1.5 blocks a storey) on 12-block wings, a 13-14 block setback at the
// east end, a low 3-block lobby wing and 1-block roof pavilions. Storey lines every 3 blocks, a window grid of
// glass panes between concrete mullions, a plinth, cornice and parapet, two doors with canopies, and some
// glowstone behind the glass for dusk. No rooms: an air gap behind the glass and a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/";
const cells = JSON.parse(readFileSync(`${DIR}DC64266.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const roofAt = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const H = (x, z) => roofAt.get(`${x},${z}`) ?? 0;                           // massing height at (x, z); 0 = outside
const STEP = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Directions in which the neighbour has no massing at this height: that face of the voxel is an outside face.
const exposed = (x, y, z) => Object.keys(STEP).filter((d) => H(x + STEP[d][0], z + STEP[d][1]) <= y);
const ring = (x, z) => Object.values(STEP).some(([dx, dz]) => H(x + dx, z + dz) === 0);

const B = new Map();                                                         // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const [x, z, , R] of cells) {
  const top = R - 1, edge = ring(x, z);
  for (let y = 0; y < R; y++) {
    const out = exposed(x, y, z);
    if (y === top) put(x, y, z, "gray_concrete");                            // roof, a dark tar cap
    else if (y === 0) put(x, y, z, "polished_andesite");                     // granite-look plinth on the ground
    else if (edge && R >= 6 && y === R - 2) put(x, y, z, "light_gray_concrete"); // cornice belt
    else if (y % 3 === 0 && out.length) put(x, y, z, "white_concrete");      // precast spandrel: the storey line
    else if (out.length) {                                                   // window band (y % 3 is 1 or 2)
      const zFace = out.includes("N") || out.includes("S");
      const along = zFace ? x : z;
      const [ox, oz] = STEP[zFace ? out.find((d) => d === "N" || d === "S") : out.find((d) => d === "E" || d === "W")];
      if (along % 3 === 0) put(x, y, z, "stone");                            // mullion, the frame of the grid (mid-grey, reads on the render)
      else {
        put(x, y, z, "light_blue_stained_glass_pane");
        // A lit office: glowstone one cell inside the glass, on the slab below it (only on y % 3 === 1).
        const ix = x - ox, iz = z - oz;
        if (y % 3 === 1 && (along * 7 + y * 11) % 13 === 0 && H(ix, iz) > y + 1 && exposed(ix, y, iz).length === 0)
          put(ix, y, iz, "glowstone");
      }
    } else if (y % 3 === 0) put(x, y, z, "light_gray_concrete");              // interior floor slab, one per storey
  }
  if (edge && R >= 6) put(x, R, z, "light_gray_concrete");                   // parapet on the outside edge
}

// Roof plant on the 15-block bar: a mechanical box standing on the cap.
for (let x = 12; x <= 14; x++) for (let z = 8; z <= 10; z++) if (H(x, z) === 15) put(x, 15, z, "light_gray_concrete");

// Two entrances, a lower and an upper door half each (the lower half stands on the ground at y 0).
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", ...(half === "upper" ? { powered: "false" } : {}) });
for (const x of [22, 23]) {                                                  // south front, under a canopy
  put(x, 0, 16, "iron_door", doorState("south", "lower"));
  put(x, 1, 16, "iron_door", doorState("south", "upper"));
}
for (let x = 20; x <= 25; x++) put(x, 3, 16, "smooth_stone");                // canopy over the front door
put(20, 2, 16, "lantern", { hanging: "true" });
put(25, 2, 16, "lantern", { hanging: "true" });
for (const x of [28, 29]) {                                                  // north side entrance
  put(x, 0, 0, "iron_door", doorState("north", "lower"));
  put(x, 1, 0, "iron_door", doorState("north", "upper"));
}
for (let x = 27; x <= 30; x++) put(x, 3, 0, "smooth_stone");

// Glass panes connect to the solid blocks and panes beside them, as the vanilla pane does.
const SOLID = (b) => b && b.block !== "iron_door" && b.block !== "lantern";
for (const [key, { block }] of [...B]) {
  if (block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const n = (dx, dz) => (SOLID(B.get(`${x + dx},${y},${z + dz}`)) ? "true" : "false");
  B.set(key, { block, state: { north: n(0, -1), south: n(0, 1), east: n(1, 0), west: n(-1, 0), waterlogged: "false" } });
}

const g = new Voxels([45, 27, 17]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}DC64266.nbt`);
console.log(`DC64266.nbt: ${blocks} blocks, palette ${palette}`);
