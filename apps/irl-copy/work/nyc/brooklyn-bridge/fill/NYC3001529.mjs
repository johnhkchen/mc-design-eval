import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001529.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001529.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 20, D = 5;
const g = new Voxels([W, H, D]);

const foot = new Map();
const grounds = [];
const roofs = [];
for (const c of cells) {
  const [x, z, gr, rf] = c;
  const ground = Math.max(0, Math.min(10, Math.round(gr)));
  grounds.push(ground);
  if (Number.isFinite(rf)) roofs.push(Math.round(rf));
  foot.set(x + "," + z, { ground });
}
const has = (x, z) => foot.has(x + "," + z);

// One storey datum and one smoothed roof height for the whole building
const B = Math.min(...grounds);
roofs.sort((a, b) => a - b);
const medRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : B + 8;
const maxGround = Math.max(...grounds);
const ROOF = Math.max(B + 6, maxGround + 6, Math.min(15, medRoof));
const capY = ROOF - 1;   // roof deck
const cornY = ROOF - 2;  // cornice on perimeter, ceiling inside

const BROWN = "brown_terracotta"; // brownstone ground storey
const BRICK = "brick";            // upper brick walls
const STONE = "stone_bricks";     // quoins, foundations, roof deck
const BAND = "smooth_stone";      // string courses and ceilings
const CORNICE = "stone_brick_slab";
const FLOOR = "oak_planks";

for (const [key, info] of foot) {
  const [x, z] = key.split(",").map(Number);
  const { ground } = info;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  const corner = (edgeW || edgeE) && (edgeN || edgeS);

  for (let y = ground; y <= capY; y++) {
    const s = y - B;
    if (y === capY) { g.set(x, y, z, STONE); continue; }

    if (!edge) {
      // Interior: floor slab each storey, ceiling under cornice; air between
      if (y === cornY || (s % 2 === 0 && y >= B)) g.set(x, y, z, FLOOR);
      continue;
    }

    if (y === cornY) { g.set(x, y, z, CORNICE, { type: "bottom", waterlogged: "false" }); continue; }

    // Facade: brownstone base storey, brick above, string course at each storey line
    let block = s < 2 ? BROWN : BRICK;
    if (s > 0 && s % 2 === 0) block = BAND;
    if (corner) block = STONE;
    g.set(x, y, z, block);

    // Windows on odd rows above datum, not on corners
    const winRow = s % 2 === 1;
    if (winRow && !corner) {
      const onFront = edgeN && !edgeW && !edgeE;
      const onBack = edgeS && !edgeW && !edgeE;
      const onSide = (edgeW || edgeE) && !edgeN && !edgeS;
      if (onFront || onBack) {
        const isDoorZone = (x === 4 && s === 1 && edgeN);
        const isLantern = (x === 3 && s === 1 && edgeN);
        if (!isDoorZone && !isLantern) {
          g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
        }
      } else if (onSide) {
        g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
    }
  }
}

// Warm light behind some first-storey front windows
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (z === 1 && has(x, 0) && x >= 1 && x <= 8 && x % 3 === 1) {
    const y = B + 1;
    if (y < cornY) g.set(x, y, z, "glowstone");
  }
}

// Entrance on the street face (z=0) at x=4: door, lintel, hanging lantern
if (has(4, 0)) {
  g.set(4, B, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(4, B + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const lx of [3, 4, 5]) {
    if (has(lx, 0)) g.set(lx, B + 2, 0, CORNICE, { type: "top", waterlogged: "false" });
  }
  if (has(3, 0)) g.set(3, B + 1, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Chimney stacks on the roof, each standing on the roof deck
for (const cx of [2, 7]) {
  const cz = 2;
  if (has(cx, cz)) {
    const top = capY;
    g.set(cx, top + 1, cz, BRICK);
    g.set(cx, top + 2, cz, BRICK);
    g.set(cx, top + 3, cz, CORNICE, { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
