// DC64276: a 9 x 3 red-brick commercial row on the Mall (late 19th c.): a shopfront ground floor, one upper storey,
// limestone (calcite) bands and cornice, stepping down east from a taller back block at the west end.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC64276.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const BASE = "stone_bricks", WALL = "bricks", TRIM = "calcite", ROOF = "smooth_stone", GLASS = "glass_pane";
const FULL = new Set([BASE, WALL, TRIM, ROOF]);

// Overrides keyed "x,y,z": a block spec, or null for an air gap (behind glass, or left open).
const over = {};
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { over[key(x, y, z)] = block === null ? null : { block, state }; };

// Front (z = 0) facade: ground storey y1-2, upper storey y3, limestone storey line at y2, cornice at each top.
const FRONT = {
  1: [null, GLASS, WALL, GLASS, WALL, GLASS, GLASS, GLASS, WALL],
  2: [null, TRIM, TRIM, TRIM, TRIM, TRIM, TRIM, TRIM, TRIM],
  3: [null, GLASS, WALL, GLASS, WALL, GLASS, TRIM, TRIM, null],
};
const DOOR = "dark_oak_door";
put(0, 1, 0, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(0, 2, 0, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(0, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 0; x < 9; x++) for (const y of [1, 2, 3]) if (FRONT[y][x] !== null) put(x, y, 0, FRONT[y][x], null);

// Glass panes connect along the facade to panes and solid walls, so the windows read as framed in the brick.
const connects = (n) => n === GLASS || FULL.has(n);
const nameAt = (x, y, z) => { const o = over[key(x, y, z)]; return o === undefined ? null : o === null ? null : o.block; };
for (const [k, o] of Object.entries(over)) {
  if (!o || o.block !== GLASS) continue;
  const [x, y] = k.split(",").map(Number);
  o.state = { north: "false", south: "false", east: String(connects(nameAt(x + 1, y, 0))), west: String(connects(nameAt(x - 1, y, 0))), waterlogged: "false" };
}

// Air gaps behind the front glass (z = 1), a floor slab at y2 and the roof above: no interiors. Where the footprint
// has no back row (x 3, 6, 7) the gap would open through the rear, so those windows sit on a lit block instead.
for (const [x, y] of [[1, 1], [5, 1], [1, 3], [5, 3]]) put(x, y, 1, null);
// Warm lights in some windows: glowstone and a shroomlight set back in the gap.
put(1, 1, 1, "glowstone");
put(6, 1, 1, "glowstone");
put(3, 1, 1, "shroomlight");
put(3, 3, 1, "glowstone");
put(7, 1, 1, "shroomlight");

const g = new Voxels([9, 18, 3]);
for (const [x, z, ground, roof] of cells) {
  const top = ground + roof - 1;                       // the roof's top block, 0 = the lowest ground
  for (let y = 0; y <= top; y++) {
    const k = key(x, y, z);
    if (k in over) {
      const o = over[k];
      if (o) g.set(x, y, z, o.block, o.state);
      continue;
    }
    let b = y === 0 ? BASE : WALL;                     // plinth, then brick
    if (y === top) b = z === 0 ? TRIM : ROOF;          // cornice on the street face, flat roof behind
    g.set(x, y, z, b);
  }
}

// Roof equipment on the taller west block: a brick flue on the flat roof.
g.set(0, 6, 2, WALL); g.set(0, 7, 2, WALL);

const r = g.save(`${HERE}/DC64276.nbt`);
console.log(`DC64276.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
