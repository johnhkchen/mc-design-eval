// DC69546: a Federal-era Neoclassical office block with a light court, a three-storey limestone body (lidar roof 5)
// and a slim 20-high tower on its east edge. Walls on the footprint's outer and court-facing edges, a floor slab per
// storey inside, air behind the glass, one entrance on the south wing.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69546.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..10, z 0..9

const W = 11, D = 10, H = 32;
const g = new Voxels([W, H, D]);
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const isIn = (x, z) => foot.has(`${x},${z}`);

// lidar roofs: the tower column is 20, the body reads 5 or 6 with noise; one flat tier at the mean (5)
const TOWER = 15;
const bodyRoofs = cells.filter(([, , , r]) => r < TOWER).map(([, , , r]) => r);
const BODY_TOP = Math.round(bodyRoofs.reduce((a, b) => a + b, 0) / bodyRoofs.length);

const STONE = "stone_bricks", WALL = "calcite", TRIM = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "stone";
const GLASS = "glass_pane", COPPER = "oxidized_cut_copper";
const hWindow = (x, z) => (x + z) % 4 === 0;      // a few lit windows

// which face a perimeter cell looks out of: east/west faces carry windows on odd z, north/south on odd x
const exposed = (x, z) => ({ E: !isIn(x + 1, z), W: !isIn(x - 1, z), N: !isIn(x, z - 1), S: !isIn(x, z + 1) });
const isWindowFace = (x, z, e) => (e.E || e.W) ? z % 2 === 1 : x % 2 === 1;

for (const [key, { ground, roof }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const e = exposed(x, z);
  const perimeter = e.E || e.W || e.N || e.S;
  const top = roof >= TOWER ? roof : BODY_TOP;
  const tower = roof >= TOWER;

  // foundation / base course: stone at y 0 under every cell (the plinth on the ground-0 cells, the foundation on ground-1)
  g.set(x, 0, z, STONE);
  for (let y = Math.max(1, ground); y < top; y++) {
    if (tower) {
      // the tower: no interior, a solid east-facing wall with a window grid, string courses and a copper cap
      if (y === 18) g.set(x, y, z, TRIM);
      else if (y === 19) g.set(x, y, z, COPPER);
      else if ([7, 10, 13, 16].includes(y)) g.set(x, y, z, TRIM);
      else if (y === 4) g.set(x, y, z, TRIM);
      else if (isWindowFace(x, z, e)) g.set(x, y, z, GLASS);
      else g.set(x, y, z, WALL);
      continue;
    }
    if (perimeter) {
      // storey lines: windows at y 1 and 3, string course at 2, cornice at 4
      if (y === 2 || y === 4) g.set(x, y, z, TRIM);
      else if (isWindowFace(x, z, e)) g.set(x, y, z, GLASS);
      else g.set(x, y, z, WALL);
    } else {
      // interior: a floor slab per storey and the roof, air in between
      if (y === 2) g.set(x, y, z, FLOOR);
      else if (y === 4) g.set(x, y, z, ROOF);
      else if (y === 1 && hWindow(x, z)) g.set(x, y, z, "glowstone");
      else if (y === 1 && (2 * x + z) % 5 === 0) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (y === 3 && (x + z) % 3 === 0) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// the tower's cap: the lidar top is 20, so the copper sits at y 19 and nothing stands above it
// roof units on the body's flat roof (interior cells at y 5)
g.set(3, 5, 1, "iron_block");
g.set(8, 5, 7, "iron_block");

// the south entrance (z 9, x 4): a door in the wing bay, a slab canopy over it
g.set(4, 1, 9, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 9, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(4, 3, 9, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69546.nbt";
const stats = g.save(out);
console.log("saved", out, stats, "body top", BODY_TOP);
