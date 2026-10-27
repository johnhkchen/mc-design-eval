// Way 711259640: a two-storey Edwardian brick commercial block with a shopfront ground floor, a cornice and parapet,
// and a single-storey wing on the lower (east) side. Lidar roof heights give three tiers: 7 (two storeys, 3-block storey
// line), 5 (one storey) and 4 (one storey, low). Brick and plaster-coloured stone are the period's city materials.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_711259640.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..24, z 0..14

// lidar roof -> clean tier: the 6-7 core is the two-storey block, 5 one storey, 3-4 the low wing
const tierOf = (r) => (r >= 6 ? 7 : r === 5 ? 5 : 4);
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { x, z, g, r, T: tierOf(r) });
const at = (x, z) => cell.get(`${x},${z}`);
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// a cell is on the facade if a side opens to outside the footprint or drops to a lower tier
for (const c of cell.values()) {
  c.out = Object.entries(DIR).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; }).map(([d]) => d);
  c.perim = c.out.length > 0;
}

const g = new Voxels([25, 20, 15]);
const door = [...cell.values()].filter((c) => c.perim && c.T === 7 && c.out.includes("N"));
const doorCell = door.sort((a, b) => Math.abs(a.x - 12) - Math.abs(b.x - 12))[0] ?? null;
const lights = [];   // interior cells behind a window, to light

for (const c of cell.values()) {
  const { x, z, T } = c;
  g.set(x, 0, z, "stone_bricks");                                              // foundation and base course on every cell
  if (!c.perim) {                                                              // interior: floor and roof slabs only, air between
    if (T === 7) { g.set(x, 3, z, "smooth_stone"); g.set(x, 6, z, "stone"); }
    if (T === 5) g.set(x, 4, z, "stone");
    if (T === 4) g.set(x, 3, z, "stone");
    continue;
  }
  const corner = c.out.length >= 2;
  const along = c.out.includes("N") || c.out.includes("S") ? x : z;           // position along the facade
  const isDoor = c === doorCell;
  // shopfront: ground storey, glass between dark oak piers, the door on the street face
  for (const y of [1, 2]) {
    if (isDoor) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (corner) g.set(x, y, z, "stone_bricks");
    else if (along % 3 === 0) g.set(x, y, z, "dark_oak_planks");
    else g.set(x, y, z, "glass_pane");
  }
  if (isDoor) g.set(x, 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });      // canopy over the door
  if (T >= 5 && !isDoor) g.set(x, 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // belt course
  if (T === 7) {
    // upper storey: sash windows between brick piers, cornice, parapet
    for (const y of [4, 5]) g.set(x, y, z, corner ? "stone_bricks" : along % 3 === 1 ? "glass_pane" : "bricks");
    g.set(x, 6, z, along % 2 === 0 ? "stone_bricks" : "chiseled_stone_bricks");
    g.set(x, 7, z, along % 2 === 0 ? "bricks" : "stone_brick_wall");
  } else if (T === 5) {
    g.set(x, 4, z, "stone_bricks");
    g.set(x, 5, z, along % 2 === 0 ? "bricks" : "stone_brick_wall");
  } else {
    g.set(x, 3, z, "stone_bricks");
    g.set(x, 4, z, along % 2 === 0 ? "bricks" : "stone_brick_wall");
  }
  // a lantern behind every third shop window, a glowstone behind every third upper window (air behind the glass)
  const [dx, dz] = DIR[c.out[0]], inn = at(x - dx, z - dz);
  if (inn && !inn.perim && !corner && !isDoor && (along % 5 === 2)) lights.push({ ...inn, y: 1, block: "lantern", state: { hanging: "false", waterlogged: "false" } });
  if (inn && !inn.perim && !corner && (along % 4 === 1) && T === 7) lights.push({ ...inn, y: 4, block: "glowstone" });
}

for (const l of lights) if (l.y === 4 || l.y === 1) g.set(l.x, l.y, l.z, l.block, l.state);

// roof equipment on the two-storey roof: a stair tower (2x2, bricks) and two plant boxes, placed on interior cells
const roofT7 = [...cell.values()].filter((c) => !c.perim && c.T === 7);
const cx = roofT7.reduce((s, c) => s + c.x, 0) / roofT7.length, cz = roofT7.reduce((s, c) => s + c.z, 0) / roofT7.length;
const sorted = roofT7.slice().sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
const tower = sorted.find((c) => ["1,0", "0,1", "1,1"].every((k) => { const [ox, oz] = k.split(",").map(Number); return at(c.x + ox, c.z + oz)?.T === 7 && !at(c.x + ox, c.z + oz).perim; }));
if (tower) for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  for (const y of [7, 8]) g.set(tower.x + ox, y, tower.z + oz, "bricks");
  g.set(tower.x + ox, 9, tower.z + oz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const c of sorted.slice(3).filter((c) => !(tower && Math.abs(c.x - tower.x) <= 1 && Math.abs(c.z - tower.z) <= 1)).slice(0, 2)) g.set(c.x, 7, c.z, "iron_block");
// one plant box on the lower roof
const low = [...cell.values()].find((c) => !c.perim && c.T === 5);
if (low) g.set(low.x, 5, low.z, "iron_block");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_711259640.nbt");
console.log(`way_711259640: ${blocks} blocks, palette ${palette}, cells ${cells.length}, lights ${lights.length}, door ${doorCell ? `${doorCell.x},${doorCell.z}` : "none"}`);
