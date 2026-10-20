import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395700";
const W = 14, H = 22, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint records -------------------------------------------------
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.round(gr));
  const roof = Number.isFinite(rf) ? Math.round(rf) : ground + 10;
  cellMap.set(`${x},${z}`, { x, z, ground, roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// one flat cornice line for the whole building (clean tiers, no lidar jaggies)
const roofs = [...cellMap.values()].map(c => c.roof).sort((a, b) => a - b);
const maxGround = Math.max(...[...cellMap.values()].map(c => c.ground));
let R = roofs[Math.floor(roofs.length / 2)];
R = Math.min(H - 5, Math.max(maxGround + 9, R));
for (const c of cellMap.values()) c.roof = R;

// facade face of an exterior cell: outward normal and position along the face
function faceOf(x, z) {
  if (!has(x, z - 1)) return { nx: 0, nz: -1, u: x };
  if (!has(x, z + 1)) return { nx: 0, nz: 1, u: x };
  if (!has(x - 1, z)) return { nx: -1, nz: 0, u: z };
  return { nx: 1, nz: 0, u: z };
}

// entrance: northern-most exterior row, cell nearest the middle of the face
let door = null;
{
  let best = Infinity;
  for (const c of cellMap.values()) {
    if (has(c.x, c.z - 1)) continue;
    const score = Math.abs(c.x - 6);
    if (score < best) { best = score; door = c; }
  }
}

// ---- massing ------------------------------------------------------------
for (const c of cellMap.values()) {
  const { x, z, ground: g0, roof: r } = c;
  const ext = exterior(x, z);

  // foundation: stone up to the cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (ext) {
    const { nx, nz, u } = faceOf(x, z);
    for (let y = g0; y <= r - 1; y++) {
      const sy = y - g0;
      let block = "bricks";
      if (sy === 0) block = "brown_terracotta";                 // brownstone base course
      else if (sy === 3 || sy === 6) block = "smooth_stone";    // limestone string courses
      if (y === r - 2) block = "smooth_stone";                  // cornice band
      if (y === r - 1) block = "bricks";

      const windowBand = (sy === 1 || sy === 2) && y <= r - 3;
      if (windowBand && u % 3 === 1) block = "glass_pane";     // pane between brick piers
      g.set(x, y, z, block);

      // warm light behind some panes
      if (windowBand && u % 3 === 1 && ((u + sy + x + z) % 3 === 0)) {
        const ix = x - nx, iz = z - nz;
        if (has(ix, iz) && !exterior(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    }
    // thin limestone coping over the wall top
    g.set(x, r, z, "smooth_stone_slab", { type: "bottom" });
  } else {
    // interior: floor slabs per storey and a roof deck, air between
    for (let y = g0; y <= r - 1; y++) {
      if (y === r - 1 || (y - g0) % 3 === 0) g.set(x, y, z, "smooth_stone");
    }
  }
}

// ---- rooftop bulkhead (stair housing) on central cells -----------------
for (let x = 5; x <= 8; x++) for (let z = 5; z <= 8; z++) {
  if (!has(x, z)) continue;
  const r = R;
  const edge = x === 5 || x === 8 || z === 5 || z === 8;
  if (edge) for (let y = r; y <= r + 2; y++) g.set(x, y, z, "bricks");
  g.set(x, r + 3, z, "smooth_stone_slab", { type: "bottom" });
}

// ---- entrance -----------------------------------------------------------
if (door) {
  const { x, z, ground: g0 } = door;
  // limestone surround on either side of the door
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      g.set(x + dx, g0, z, "smooth_stone");
      g.set(x + dx, g0 + 1, z, "smooth_stone");
    }
  }
  // door opening with lantern above, hung from the string course
  g.set(x, g0, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, g0 + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, g0 + 2, z, "lantern", { hanging: "true" });
  // stone threshold inside the footprint
  if (has(x, z + 1)) g.set(x, g0, z + 1, "smooth_stone_slab", { type: "top" });
}

g.save(`${DIR}/${ID}.nbt`);
