import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439358.cells.json", "utf8"));
// [x, z, ground, roof] per footprint cell, x 0..36, z 0..34

// What it is: a 1960s-70s commercial block on a sloping Eden Terrace / Newton street, three storeys on the downhill
// side. The lidar roof is one flat tier (755 of 761 cells read 11; the rest are edge noise), so the massing is one roof
// at 11 with no tower or setbacks. Stone plinth on the ground line, white concrete bays with dark frames and tinted
// glass ribbons, a shopfront and a door on the south face, storey bands, a coping, and plant on the roof deck.
// The walls are a one-block shell: solid foundation under every cell, floor slabs per storey, air between.
const ROOF = 11, TOP = ROOF - 1;   // the roof surface is y 11; the coping and the deck are the layer below it

const FP = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const inFp = (x, z) => FP.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// the entrance: the middle of the south-facing outer wall (cells exposed to the south only)
const southFacing = cells.filter(([x, z]) => { const e = exposed(x, z); return e.length === 1 && e[0] === "s"; }).sort((a, b) => a[0] - b[0]);
const [DX, DZ] = southFacing[Math.floor(southFacing.length / 2)];

const M = {
  base: "stone_bricks",           // foundation under the ground line
  plinth: "polished_andesite",    // base course on the ground line
  band: "smooth_stone",           // floor slabs, storey bands, coping, canopy fascia
  wall: "white_concrete",         // spandrels and corner piers
  frame: "gray_concrete",         // window mullions and frames
  glass: "light_blue_stained_glass",
  deck: "gray_concrete",          // roof deck
  plant: "light_gray_concrete",   // roof plant boxes
  light: "glowstone",             // warm light just behind some panes
};
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// The block for one cell at height y, as [name, state], or null for air.
function cellBlock(x, z, gr, y) {
  if (y < gr) return [M.base];
  const ex = exposed(x, z), perim = ex.length > 0;
  if (x === DX && z === DZ && (y === gr + 1 || y === gr + 2)) return ["dark_oak_door", doorState(y === gr + 1 ? "lower" : "upper")];
  if (y === gr) return [perim ? M.plinth : M.band];
  if (y === TOP) return [perim ? M.band : M.deck];
  const r = y - gr;                                  // height above this cell's own ground
  if (r % 4 === 0) return [M.band];                  // storey slab
  if (!perim) return null;                           // interior air
  if (ex.length > 1) return [M.wall];                // corner pier
  if (r === 3 && ex[0] === "s" && Math.abs(x - DX) <= 1) return [M.band];   // canopy fascia over the entrance
  if (r % 4 === 3) return [M.wall];                  // spandrel under each window band
  const a = ex[0] === "n" || ex[0] === "s" ? x : z;  // position along the face
  return [a % 3 === 0 ? M.frame : M.glass];          // ribbon of panes, a frame every third block
}

const g = new Voxels([37, 24, 35]);
for (const [x, z, gr] of cells) for (let y = 0; y <= TOP; y++) {
  const b = cellBlock(x, z, gr, y);
  if (b) g.set(x, y, z, b[0], b[1]);
}

// warm light: some panes get a glowstone in the room behind them (an air cell, one block in from the glass)
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1 || (x === DX && z === DZ)) continue;
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || exposed(ix, iz).length) continue;
  const ig = FP.get(`${ix},${iz}`);
  for (let y = gr + 1; y < TOP; y++) {
    const r = y - gr;
    if (r % 4 === 0 || r % 4 === 3) continue;        // only panes, not slabs or spandrels
    if (((x * 31 + z * 17 + y * 7) % 13) !== 0) continue;
    const ir = y - ig;
    if (ir % 4 !== 1) continue;                      // the lamp stands on its floor slab, air in front of the pane
    g.set(ix, y, iz, M.light);
  }
}

// roof plant: three boxes two blocks high on the deck, each on cells that are deck with deck all round
const picks = [];
for (const [x, z] of [...cells].sort((a, b) => a[1] - b[1] || a[0] - b[0])) {
  if (picks.length === 3) break;
  let ok = true;
  for (let dx = -2; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
    const px = x + dx, pz = z + dz;
    if (!inFp(px, pz) || exposed(px, pz).length) ok = false;
  }
  if (!ok || picks.some(([px, pz]) => Math.abs(px - x) < 8 || Math.abs(pz - z) < 6)) continue;
  picks.push([x, z]);
}
for (const [x, z] of picks) for (let dx = -2; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
  for (let y = ROOF; y <= ROOF + 1; y++) g.set(x + dx, y, z + dz, M.plant);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439358.nbt";
console.log(g.save(out), "plant boxes:", picks.length);
