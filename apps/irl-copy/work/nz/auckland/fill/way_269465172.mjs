// Way 269465172, Mt Eden / Eden Terrace: a two-storey interwar brick commercial block (about 1930s, the Karangahape /
// Eden Terrace shop-and-flat type) on a site that falls to the south-east. Brick walls, cream render bands, stone piers
// and plinth, shopfronts on the ground floor, a parapet over a flat roof with a plant box. The footprint's lidar roof
// sits at one height across every cell, so the massing is one flat-topped box on a stepped foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465172.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_269465172.nbt`;
const SIZE = [31, 22, 20];

const ROOF = Math.max(...cells.map((c) => c[3]));   // 9: lidar roof height above y 0
const DECK = ROOF - 2;                              // roof deck and cornice course (y 7)
const PARAPET = ROOF - 1;                           // parapet course on the wall line (y 8)
const STOREY_2 = 4;                                 // floor line between the two storeys

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const exterior = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

const B = new Map();                                // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const glass = [];                                   // [x, y, z, outward dx, outward dz] for the pane pass

for (const [x, z, g] of cells) {
  // foundation under the ground, a floor on the ground, the storey line and the roof deck
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  put(x, g, z, "smooth_stone");
  put(x, STOREY_2, z, "smooth_stone");
  put(x, DECK, z, "smooth_stone");

  const faces = exterior(x, z);
  if (!faces.length) continue;                      // interior: air behind the glass, nothing to fit out
  const [fdx, fdz] = faces[0];
  const along = fdx === 0 ? x : z;                  // where the cell sits along the face it stands on
  const corner = faces.length > 1;
  const pier = corner || along % 4 === 0;           // one-block piers every 4th cell, a 3-cell window bay between
  const mullion = !pier && along % 4 === 2;         // a cream mullion splits each window bay into two panes

  for (let y = g; y <= PARAPET; y++) {
    const ground = y < STOREY_2;
    let block;
    if (y === PARAPET) block = corner || pier ? "stone_bricks" : "bricks";
    else if (y === DECK || y === STOREY_2) block = "white_concrete";
    else if (corner) block = "stone_bricks";
    else if (pier) block = ground ? "stone_bricks" : "bricks";
    else if (mullion) block = "white_concrete";
    else if (y === 3 && ground) block = "white_concrete";   // shopfront transom
    else block = "glass_pane";
    put(x, y, z, block);
    if (block === "glass_pane") glass.push([x, y, z, fdx, fdz]);
  }
}

// the entrance: a dark oak door in the shop bay on the north face, with a hanging lantern on the transom beside it
const gDoor = fp.get("7,0").g;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(7, gDoor, 0, "dark_oak_door", doorState("lower"));
put(7, gDoor + 1, 0, "dark_oak_door", doorState("upper"));
put(6, 3, 0, "lantern", { hanging: "true" });

// warm light: some windows have a glowstone just inside the glass (the air gap behind it stays air otherwise)
for (const [x, y, z, dx, dz] of glass) {
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || exterior(ix, iz).length || at(ix, y, iz)) continue;
  if (y !== STOREY_2 + 1 && y !== fp.get(`${x},${z}`).g + 1) continue;   // only on a floor, never hanging`
  if ((x * 7 + z * 5 + y * 3) % 4 === 0) put(ix, y, iz, "glowstone");
}

// the panes join their neighbours along the wall line
for (const [x, y, z, dx] of glass) {
  const across = dx === 0
    ? { east: at(x + 1, y, z), west: at(x - 1, y, z), north: null, south: null }
    : { north: at(x, y, z - 1), south: at(x, y, z + 1), east: null, west: null };
  const state = {};
  for (const side of ["north", "south", "east", "west"]) state[side] = across[side] ? "true" : "false";
  state.waterlogged = "false";
  put(x, y, z, "glass_pane", state);
}

// plant box on the roof, two blocks high with a slab cap, set in the middle of the deck
for (let x = 13; x <= 17; x++) for (let z = 5; z <= 7; z++) {
  for (const y of [DECK + 1, DECK + 2]) put(x, y, z, "stone_bricks");
  put(x, DECK + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// nothing floats: every wall or fitting needs a block under it (the lantern hangs from the transom above it); the
// floor and deck slabs span between the walls, so they are held by the ring rather than by a block below
for (const [k, { block }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || block === "lantern" || block === "smooth_stone") continue;
  if (!at(x, y - 1, z)) throw new Error(`floating ${block} at ${x},${y},${z}`);
}

const out = new Voxels(SIZE);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  out.set(x, y, z, block, state);
}
const { blocks, palette } = out.save(OUT);
console.log(`way_269465172: ${blocks} blocks, palette ${palette}, roof y ${ROOF}`);
