// Farmsteads on the client's fixed lot: 19 x 18, the front (south, z 17) toward the farm track, its front 2 rows kept
// clear (grass and the path). A farmhouse from the module set (door toward the track), a timber barn, a fenced working
// yard (haystack, well, woodpile, trough, compost), a kitchen garden, lamp posts so no grass lies dark.
// Layers 0-1 ground, 2 the ground's surface (houses' ground 2 too).
import { Grid } from "../grid.mjs";
import { compose, layoutOf, metaOf } from "./compose.mjs";

export const LOT = [19, 18];
const GRASS = "grass_block[snowy=false]", PATH = "dirt_path";
const fence = (n, s, e, w) => `spruce_fence[east=${e},north=${n},south=${s},waterlogged=false,west=${w}]`;
const LAMP = (g, x, z) => { g.set(x, 3, z, fence(false, false, false, false)); g.set(x, 4, z, fence(false, false, false, false)); g.set(x, 5, z, "lantern[hanging=false,waterlogged=false]"); };

/** A timber barn, 9 (x) by 7 (z), walls 4 high, gable roof along x; the great doors in the south wall's middle. */
export function barn() {
  const W = 9, D = 7, g = new Grid([W, 12, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, "cobblestone"); }
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const wall = x === 0 || x === W - 1 || z === 0 || z === D - 1; if (!wall) continue;
    const post = (x === 0 || x === W - 1) && (z === 0 || z === D - 1) || (z === 0 || z === D - 1) && x % 4 === 0 || (x === 0 || x === W - 1) && z === 3;
    for (let y = 3; y <= 6; y++) g.set(x, y, z, post ? "dark_oak_log[axis=y]" : y === 6 ? "stripped_dark_oak_log[axis=" + (z === 0 || z === D - 1 ? "x" : "z") + "]" : y === 3 ? "cobblestone" : "spruce_planks");
  }
  // the great doors: 3 wide, 3 high, open, a lantern over them
  for (let x = 3; x <= 5; x++) for (let y = 3; y <= 5; y++) g.set(x, y, D - 1, "air");
  g.set(3, 3, D - 1, "spruce_door[facing=south,half=lower,hinge=left,open=true,powered=false]"); g.set(3, 4, D - 1, "spruce_door[facing=south,half=upper,hinge=left,open=true,powered=false]");
  g.set(5, 3, D - 1, "spruce_door[facing=south,half=lower,hinge=right,open=true,powered=false]"); g.set(5, 4, D - 1, "spruce_door[facing=south,half=upper,hinge=right,open=true,powered=false]");
  g.set(4, 7, D - 1, "granite_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]");
  // vents high in the side walls
  for (const x of [0, W - 1]) g.set(x, 5, 1, "spruce_trapdoor[facing=" + (x === 0 ? "west" : "east") + ",half=bottom,open=true,powered=false,waterlogged=false]");
  // inside: hay stacked along the back, a cart, a lantern
  for (let x = 1; x < W - 1; x++) { g.set(x, 3, 1, "hay_block[axis=x]"); if (x % 2) g.set(x, 4, 1, "hay_block[axis=z]"); }
  g.set(1, 3, 3, "hay_block[axis=y]"); g.set(7, 3, 3, "enterprise:decor_barrel[facing=up,open=false]"); g.set(4, 6, 3, "lantern[hanging=true,waterlogged=false]");
  // the roof: granite, gable along x, flush with the walls (the lot is tight); a stair course at the eave
  for (let k = 0; k <= 3; k++) {
    const y = 7 + k, za = k, zb = D - 1 - k;
    for (let x = 0; x < W; x++) {
      if (za < zb - 1) { g.set(x, y, za, "granite_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]"); g.set(x, y, zb, "granite_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]"); }
      else if (za <= zb) { g.set(x, y, za, "granite_slab[type=bottom,waterlogged=false]"); if (zb !== za) g.set(x, y, zb, "granite_slab[type=bottom,waterlogged=false]"); }
    }
    // the gable ends filled with boards
    for (let z = za + 1; z < zb; z++) for (const x of [0, W - 1]) g.set(x, y, z, "spruce_planks");
  }
  return g;
}

function tree(g, x, z) {
  for (let y = 3; y < 6; y++) g.set(x, y, z, "oak_log[axis=y]");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const y of [5, 6]) if (!(dx === 0 && dz === 0 && y === 5) && !(y === 6 && Math.abs(dx) + Math.abs(dz) === 2)) g.set(x + dx, y, z + dz, "oak_leaves[distance=1,persistent=true,waterlogged=false]");
}

/** variant: { W, storeys, mirror } — the house's body; the barn and yard take the other side. */
export function farmstead({ W = 7, storeys = 1, mirror = false } = {}) {
  const [LW, LD] = LOT, g = new Grid([LW, 24, LD]);
  for (let x = 0; x < LW; x++) for (let z = 0; z < LD; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, GRASS); }
  const L = layoutOf({ W, D: 7, storeys, roof: "gable_x", beds: 2 }), house = compose(L), meta = metaOf(L);
  const hx = W === 7 ? 1 : 0, hz = 7;                   // the house's template corner: front relief on z 15
  g.paste(house, hx, 0, hz);
  // the barn behind, on the far side; the yard between the barn and the front clear rows
  const bx = LW - 9, bz = 0; g.paste(barn(), bx, 0, bz);
  const yx0 = hx + house.size[0] + 1, yx1 = LW - 1, yz0 = 8, yz1 = 14;
  for (let x = yx0; x <= yx1; x++) for (let z = yz0; z <= yz1; z++) g.set(x, 2, z, (x + z) % 3 ? "coarse_dirt" : "gravel");
  for (let x = yx0; x <= yx1; x++) for (const z of [yz0 - 1 + 0, yz1 + 1]) if (z !== yz0 - 1 || x < bx || x > bx + 8) g.set(x, 3, z, fence(false, false, x < yx1, x > yx0));
  for (let z = yz0; z <= yz1; z++) for (const x of [yx0 - 1, yx1]) if (x >= 0 && !g.get(x, 3, z)) g.set(x, 3, z, fence(z > yz0, z < yz1, false, false));
  const gx = Math.floor((yx0 + yx1) / 2);                // a gate onto the front, a path to the track
  g.set(gx, 3, yz1 + 1, "spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]");
  for (let z = yz1 + 1; z < LD; z++) g.set(gx, 2, z, PATH);
  // the yard: a haystack, a well, a woodpile, a trough, compost
  g.set(yx0 + 1, 3, yz0 + 1, "hay_block[axis=y]"); g.set(yx0 + 2, 3, yz0 + 1, "hay_block[axis=y]"); g.set(yx0 + 1, 4, yz0 + 1, "hay_block[axis=x]");
  g.set(yx1 - 1, 2, yz0 + 2, "water"); g.set(yx1 - 1, 3, yz0 + 2, "cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
  for (let x = yx0 + 1; x <= yx0 + 3; x++) g.set(x, 3, yz1 - 1, "oak_log[axis=x]");
  g.set(yx1 - 1, 3, yz1 - 1, "enterprise:decor_cauldron[contents=water]"); g.set(yx1 - 2, 3, yz1 - 1, "enterprise:decor_composter[level=5]");
  // the kitchen garden behind the house: beds and a fruit tree, a fence along its back
  for (let x = hx; x < hx + house.size[0] && x < bx; x++) for (let z = 1; z <= 5; z++) {
    if (z === 3) { g.set(x, 2, z, PATH); continue; }
    g.set(x, 2, z, "farmland[moisture=7]"); g.set(x, 3, z, z < 3 ? "carrots[age=6]" : "potatoes[age=7]");
  }
  g.set(hx + 1, 2, 3, "water"); g.set(hx + 1, 3, 3, "lily_pad");
  tree(g, hx + 1, 1);                                   // a fruit tree at the garden's back corner
  // the path from the door to the track
  const door = meta.entrance.at, dx = hx + door[0];
  for (let z = hz + house.size[2]; z < LD; z++) g.set(dx, 2, z, PATH);
  // lamp posts: by the door path, at the yard gate, by the barn doors, in the garden
  LAMP(g, dx + 1 < LW ? dx + 1 : dx - 1, LD - 2); LAMP(g, gx + 1, yz1 + 2 < LD ? yz1 + 2 : yz1); LAMP(g, bx - 1, 3); LAMP(g, LW - 1, 7);
  LAMP(g, 0, LD - 1); LAMP(g, LW - 1, LD - 1);
  LAMP(g, hx + 2, 3); LAMP(g, hx + 7, 3);                // in the garden, on its path
  // shift the metadata into lot coordinates
  const at = (p) => [p[0] + hx, p[1], p[2] + hz];
  let out = g;
  if (mirror) { out = new Grid(g.size); out.paste(g, 0, 0, 0, { mirror: true }); }
  const mx = (p) => (mirror ? [LW - 1 - p[0], p[1], p[2]] : p);
  return { grid: out, meta: {
    entrances: [{ ...meta.entrance, at: mx(at(meta.entrance.at)) }],
    beds: meta.beds.map((b) => ({ head: mx(at(b.head)), foot: mx(at(b.foot)) })),
  } };
}
