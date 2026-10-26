// DC56385: 1717 17th St NW, a 1920s red-brick walk-up apartment (Dupont Circle). Three storeys on a stone plinth and a
// calcite belt course, a calcite parapet, glass-paned bays with brick piers, and a stairwell bulkhead on the roof.
// Walls are one cell thick with an air gap behind the glass; floor slabs sit on the belt (y3) and the roof (y5).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56385.cells.json", "utf8"));

const H = 6;                                    // lidar roof height above y 0 (uniform across the footprint: one tier)
const g = new Voxels([6, 18, 11]);
const roofAt = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { gr, r }]));
const inF = (x, z) => roofAt.has(`${x},${z}`);

// outward directions a footprint cell faces (its neighbours outside the footprint)
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(d => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const isRing = (x, z) => exposed(x, z).length > 0;

const BRICK = "bricks", PLINTH = "stone_bricks", TRIM = "calcite", FLOOR = "smooth_stone";
const PANE = (s) => ({ north: "false", south: "false", east: "false", west: "false", waterlogged: "false", ...s });

// the front is the street face (z = 0): the door sits in the middle bay
const DOOR_X = 3;

for (const [x, z, gr, r0] of cells) {
  const r = r0 || H;
  const out = exposed(x, z), ring = out.length > 0, corner = out.length > 1;
  for (let y = gr; y < r; y++) {
    // belt and roof layers: solid, both on the ring and across the floors
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }
    if (y === 3 || y === r - 1) {
      g.set(x, y, z, ring ? TRIM : FLOOR);
      continue;
    }
    if (!ring) continue;                        // interior: an air gap behind the glass
    if (corner) { g.set(x, y, z, BRICK); continue; }
    const d = out[0];
    const plane = d === "north" || d === "south" ? x : z;   // position along the face
    const pier = plane % 3 === 0;
    if (z === 0 && x === DOOR_X && y <= 2) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier) { g.set(x, y, z, BRICK); continue; }
    g.set(x, y, z, "glass_pane", PANE({}));    // connections set below
  }
}

// second pass: pane connections to neighbours in the plane of the face, and the warm lights behind some glass
for (const [x, z, gr, r0] of cells) {
  const r = r0 || H;
  const out = exposed(x, z);
  if (!out.length || out.length > 1) continue;
  const d = out[0];
  const inward = [-DIRS[d][0], -DIRS[d][1]];
  const alongs = d === "north" || d === "south" ? ["east", "west"] : ["north", "south"];
  for (let y = 1; y < r - 1; y++) {
    if (y === 3) continue;
    const cell = g.get(x, y, z);
    if (!cell || cell.block !== "minecraft:glass_pane") continue;
    const st = PANE({});
    for (const a of alongs) {
      const [dx, dz] = DIRS[a];
      const nx = x + dx, nz = z + dz;
      const n = g.get(nx, y, nz);
      if (n && (n.block === "minecraft:glass_pane" || n.block === "minecraft:bricks")) st[a] = "true";
    }
    g.set(x, y, z, "glass_pane", st);
    // warm light behind every third pane of the ground storey and every fourth of the upper one
    const ix = x + inward[0], iz = z + inward[1];
    if (!inF(ix, iz) || isRing(ix, iz)) continue;
    const k = (x + z) % 3 === 0;
    if (y === 1 && k) g.set(ix, y, iz, "glowstone");
    if (y === 4 && (x + z) % 4 === 0) g.set(ix, y, iz, "shroomlight");
  }
}

// lanterns flank the door on the stoop-level row, and the roof: an iron unit or two and a stairwell bulkhead
g.set(DOOR_X - 1, 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
g.set(DOOR_X + 1, 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, H, 3, "iron_block");
g.set(4, H, 6, "iron_block");
for (const [x, z] of [[3, 9], [4, 9], [3, 10], [4, 10]]) g.set(x, H, z, BRICK);
g.set(3, H + 1, 10, "bricks");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56385.nbt");
console.log("blocks", g.count(), "palette", g.palette.length);
