// SEA1270134764: 1961 Seattle Center hall/theatre block (inferred). Stone-grey 3-storey block over a tall hall
// volume, dark stone base, glazed lobby on the south long side, white parapet, penthouse and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270134764";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270134764.nbt";
const leftovers = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/leftovers.json", "utf8"));
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const entry = leftovers.find((b) => b.id === ID);
const bld = manifest.buildings.find((b) => b.id === ID);
const [bx0, bz0] = [entry.box[0], entry.box[1]];
const W = entry.size[0], D = entry.size[1];      // 37 x 19
const H = 36;                                    // heightBlocks 29 + penthouse, flagpole

// footprint in box-local coordinates
const F = new Set(bld.footprint.map(([x, z]) => `${x - bx0},${z - bz0}`));
const inF = (x, z) => F.has(`${x},${z}`);
const cells = bld.footprint.map(([x, z]) => [x - bx0, z - bz0]);
for (const [x, z] of cells) if (x < 0 || z < 0 || x >= W || z >= D) throw new Error(`footprint cell outside box ${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const isRing = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz));
// outward normal = first missing neighbour in N,S,E,W order
const outward = (x, z) => Object.keys(DIRS).find((k) => !inF(x + DIRS[k][0], z + DIRS[k][1])) ?? null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (state) g.set(x, y, z, block, state); else g.set(x, y, z, block);
};
const del = (x, y, z) => { if (x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D) g.set(x, y, z, "air"); };

// --- 1. foundation (y0-1) and interior floor decks across the whole footprint
for (const [x, z] of cells) {
  put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks");
  for (const y of [5, 15, 19, 23, 27]) put(x, y, z, "smooth_stone");   // hall floor, storey floors, roof deck
}

// --- 2. exterior walls: base course, hall volume, three storeys, cornice, parapet
// slot rows (recessed glass) per band; everything else is wall or band
const hallSlots = (y) => y >= 6 && y <= 13;
const upperSlots = (y) => (y >= 16 && y <= 18) || (y >= 20 && y <= 22) || (y >= 24 && y <= 25);
const recessGlass = [];
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  const o = outward(x, z);
  const alongX = o === "N" || o === "S";
  const idx = alongX ? x : z;
  const pier = idx % 3 !== 2;                    // two thick piers, one slim slot, every 3 blocks
  for (let y = 2; y <= 28; y++) {
    if (y <= 4) { put(x, y, z, "stone_bricks"); continue; }                       // dark base course
    if (y === 26) { put(x, y, z, "polished_andesite"); continue; }                  // cornice course
    if (y >= 27) { put(x, y, z, "white_concrete"); continue; }                      // parapet band
    if (pier) { put(x, y, z, "polished_andesite"); continue; }                      // thick piers, continuous
    if ([5, 14, 15, 19, 23].includes(y)) { put(x, y, z, "light_gray_concrete"); continue; } // floor / head bands
    if (hallSlots(y) || upperSlots(y)) {
      // recess: exterior cell stays air, glass one block in (inward) when that cell is interior
      const [dx, dz] = DIRS[o];
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && !isRing(ix, iz)) recessGlass.push([ix, y, iz]);
      else recessGlass.push([x, y, z]);       // thin wall: glass in the wall cell itself
      continue;
    }
    put(x, y, z, "stone");
  }
}
for (const [x, y, z] of recessGlass) put(x, y, z, "glass_pane", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });

// --- 3. glazed lobby on the south long side (z = D-1), x 6..11, with double doors at x 8..9
for (let x = 5; x <= 12; x++) for (let y = 10; y <= 10; y++) {
  put(x, y, D - 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // canopy over the entrance
  if (inF(x, D - 2)) put(x, y, D - 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 6; x <= 11; x++) {
  put(x, 5, D - 1, "light_gray_concrete");                                          // lobby sill band
  put(x, 11, D - 1, "red_concrete");                                                 // text-less sign band
}
for (let y = 6; y <= 9; y++) {
  put(6, y, D - 1, "polished_andesite"); put(11, y, D - 1, "polished_andesite");     // lobby piers
  for (let x = 7; x <= 10; x++) put(x, y, D - 1, "glass");                           // storefront glass
}
for (let x = 6; x <= 11; x++) put(x, 4, D - 1, "stone_bricks");                       // lintel over doors
for (const x of [8, 9]) {
  const hinge = x === 8 ? "left" : "right";
  put(x, 2, D - 1, "oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, D - 1, "oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}

// --- 4. roof: parapet is walls above; penthouse box and plant on the roof deck (top of deck = y 28)
const PH = { x0: 12, x1: 24, z0: 5, z1: 13 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  for (let y = 28; y <= 30; y++) {
    if (edge) put(x, y, z, "polished_andesite"); else del(x, y, z);
  }
  put(x, 31, z, "light_gray_concrete");                                              // penthouse roof
}
// penthouse glazing band on north and south faces
for (const x of [15, 18, 21]) {
  put(x, 29, PH.z0, "glass_pane", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
  put(x, 29, PH.z1, "glass_pane", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
}
// HVAC boxes and vents on the roof
for (let x = 2; x <= 4; x++) for (let z = 3; z <= 4; z++) for (let y = 28; y <= 29; y++) put(x, y, z, "light_gray_concrete");
for (let x = 30; x <= 33; x++) for (let z = 12; z <= 13; z++) for (let y = 28; y <= 29; y++) put(x, y, z, "light_gray_concrete");
put(6, 28, 6, "iron_block"); put(27, 28, 4, "iron_block"); put(27, 28, 15, "iron_block");
// flagpole with a red flag on the penthouse roof
for (let y = 32; y <= 35; y++) put(18, y, 9, "iron_bars", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
put(19, 34, 9, "red_wool"); put(19, 33, 9, "red_wool");

// --- 5. pane and bar connections: connect to any neighbouring block in the horizontal plane
for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) {
  const here = g.get(x, y, z);
  if (!here || (here.block !== "glass_pane" && here.block !== "iron_bars")) continue;
  const st = { waterlogged: "false" };
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    const nb = g.get(x + dx, y, z + dz);
    st[{ N: "north", S: "south", E: "east", W: "west" }[k]] = nb ? "true" : "false";
  }
  g.set(x, y, z, here.block, st);
}

g.save(OUT);
console.log(`${ID} module [${W},${H},${D}] blocks=${g.count()} palette=${g.palette.length}`);
