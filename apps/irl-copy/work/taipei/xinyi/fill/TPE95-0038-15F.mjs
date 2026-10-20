import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 新陽企業大樓 (2006): 15-storey Xinyi-era office tower, blue-glass curtain wall
// on white-concrete mullion grid, stepped top with a setback tier, parapet and
// roof plant with a lightning-rod mast. Floor lines sit on absolute y%5 === 0.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "TPE95-0038-15F";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 22, H = 86, D = 34;
const TOP = 74;        // roof surface (parapet from 74 to 75)
const SETBACK = 60;    // lower-tier roof / terrace level
const INS = 2;         // setback inset on each side

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const upperIn = (x, z) => has(x, z) && x >= INS && x < W - INS && z >= INS && z < D - INS;

// Which exterior face a cell sits on within a tier, or null for interior cells.
function faceOf(x, z, upper) {
  const inT = (a, b) => (upper ? upperIn(a, b) : has(a, b));
  if (!inT(x, z)) return null;
  if (!inT(x, z - 1)) return "north";
  if (!inT(x, z + 1)) return "south";
  if (!inT(x - 1, z)) return "west";
  if (!inT(x + 1, z)) return "east";
  return null;
}

// Cells directly behind the glass: they become a 1-block air gap between floor slabs.
function isRing1(x, z, upper) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => faceOf(x + dx, z + dz, upper) !== null);
}

const WHITE = "white_concrete";
const SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP_GLASS = "cyan_stained_glass";
const CORE = "light_gray_concrete";

function placeBody(x, y, z, gr, upper) {
  const face = faceOf(x, z, upper);
  if (!face) {
    // Interior: solid core, except a sealed air gap directly behind the glass.
    if (isRing1(x, z, upper) && y % 5 >= 1 && y % 5 <= 3 && (upper || y - gr >= 5)) return;
    g.set(x, y, z, CORE);
    return;
  }

  const c = face === "north" || face === "south" ? x : z; // position along the face
  const rel = y - gr;
  const lit = (x * 7 + y * 3 + z * 5) % 37 === 0;

  // Ground-floor shopfront (lower tier only)
  if (!upper && rel < 5) {
    if (face === "south" && (c === 10 || c === 11) && rel < 2) {
      const hinge = c === 10 ? "left" : "right";
      if (rel === 0) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
      }
      return;
    }
    if (rel === 4) { g.set(x, y, z, WHITE); return; }          // shop transom
    if (c % 3 === 0) { g.set(x, y, z, WHITE); return; }        // shop mullion
    g.set(x, y, z, lit ? "glowstone" : SHOP_GLASS);
    return;
  }

  // Office facade
  if (y % 5 === 0) { g.set(x, y, z, WHITE); return; }          // floor band
  if (y % 5 === 4) { g.set(x, y, z, SPANDREL); return; }       // spandrel
  if (c % 3 === 0) { g.set(x, y, z, WHITE); return; }          // mullion
  g.set(x, y, z, lit ? "glowstone" : GLASS);
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const inUp = upperIn(x, z);

  // Lower tier: ground to setback
  for (let y = gr; y < SETBACK; y++) placeBody(x, y, z, gr, false);

  // Terrace cap on the lower tier where the setback exposes it
  if (!inUp) g.set(x, SETBACK, z, "smooth_stone");

  // Upper tier: setback to roof
  if (inUp) {
    for (let y = SETBACK; y < TOP; y++) placeBody(x, y, z, gr, true);

    // Roof: flat gray deck inside, white parapet around the edge
    if (faceOf(x, z, true)) {
      g.set(x, TOP, z, WHITE);
      g.set(x, TOP + 1, z, WHITE);
    } else {
      g.set(x, TOP, z, "gray_concrete");
    }
  }
}

// Roof plant: a mechanical penthouse block and a mast, centred on the upper tier
for (let x = 8; x <= 13; x++) {
  for (let z = 12; z <= 21; z++) {
    if (!upperIn(x, z)) continue;
    for (let y = TOP; y <= TOP + 3; y++) {
      const edge = x === 8 || x === 13 || z === 12 || z === 21;
      g.set(x, y, z, edge && y > TOP ? WHITE : "smooth_stone");
    }
  }
}
for (let y = TOP + 4; y <= TOP + 10; y++) {
  g.set(11, y, 16, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
