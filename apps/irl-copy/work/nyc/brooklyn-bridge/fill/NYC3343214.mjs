import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3343214";
const W = 12, D = 20, H = 30;

// ---- read footprint -------------------------------------------------------
let raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
if (!Array.isArray(raw)) raw = raw.cells ?? raw.footprint ?? Object.values(raw);

const cells = new Map();
for (const c of raw) {
  const [x, z, gnd, roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g0 = Math.max(0, Math.round(gnd));
  // snap lidar roof to clean 3-block storey tiers above this cell's ground
  let r = g0 + 3 * Math.round((Math.round(roof) - g0) / 3);
  r = Math.max(g0 + 6, Math.min(H - 4, r));
  cells.set(`${x},${z}`, { x, z, g: g0, r });
}
const has = (x, z) => cells.has(`${x},${z}`);

// ---- output ---------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const BRICK = "bricks";
const STONE = "stone_bricks";
const TRIM = "smooth_stone";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const SHOP = "black_stained_glass_pane"; // dark shopfront glazing at street level

// entrance: door on the north (z=0) street face, flanked by stone piers
const DOOR_X = Math.floor(W / 2) - 1; // 5

// ---- pass 1: foundations, floors, walls, trim, glazing --------------------
for (const c of cells.values()) {
  const { x, z, g: gr, r } = c;
  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const perim = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);

  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, STONE);

  // storey floors (interior slabs) and roof deck
  for (let b = gr; b < r - 1; b += 3) put(x, b, z, FLOOR);
  put(x, r - 1, z, FLOOR);

  if (!perim) continue;

  // brick shell from ground to cornice
  for (let y = gr; y <= r - 1; y++) put(x, y, z, BRICK);

  // stone string courses / sills at every storey line
  for (let b = gr; b < r - 1; b += 3) put(x, b, z, STONE);

  // pier vs window along the face
  const alongOnX = exW || exE;
  const idx = alongOnX ? z : x;
  const maxIdx = alongOnX ? D - 1 : W - 1;
  const pier = corner || idx === 0 || idx === maxIdx || idx % 3 === 0;

  // ground-floor entrance surround: piers flank the door
  const nearDoor = exN && Math.abs(x - DOOR_X) <= 1;

  const dx = exE ? -1 : exW ? 1 : 0;
  const dz = exS ? -1 : exN ? 1 : 0;

  for (let b = gr; b < r - 1; b += 3) {
    const storey = Math.round((b - gr) / 3);
    for (const y of [b + 1, b + 2]) {
      if (y > r - 2) continue;

      // main entrance
      if (b === gr && exN && x === DOOR_X) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // stone entrance surround
      if (b === gr && nearDoor) {
        put(x, y, z, STONE);
        continue;
      }
      if (pier) continue;

      // street-level shopfront glazing is darker than upper windows
      put(x, y, z, b === gr ? SHOP : GLASS);

      // warm light behind some upper-storey panes
      if (storey >= 1 && (x + z + storey) % 5 === 0 && y === b + 1) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }

  // cornice band and parapet
  put(x, r - 1, z, TRIM);
  put(x, r, z, STONE);
}

// ---- pass 2: mechanical penthouse on the roof -------------------------------
const PH = { x0: 4, x1: 7, z0: 7, z1: 12 };
for (const c of cells.values()) {
  const { x, z, r } = c;
  if (x < PH.x0 || x > PH.x1 || z < PH.z0 || z > PH.z1) continue;
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  if (edge) {
    put(x, r, z, "light_gray_concrete");
    put(x, r + 1, z, "light_gray_concrete");
  }
  put(x, r + 2, z, TRIM);
}

// ---- save -------------------------------------------------------------------
g.save(`${DIR}/${ID}.nbt`);
