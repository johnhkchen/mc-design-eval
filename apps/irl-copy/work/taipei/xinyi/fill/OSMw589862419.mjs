import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw589862419";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 41, D = 29;
const ROOF = 29;          // roof surface; top body course is y = 28
const STOREY = 5;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingDirs = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));
const isExterior = (x, z) => has(x, z) && missingDirs(x, z).length > 0;

// ---- safe setter -------------------------------------------------------
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- 1. foundations: solid from y=0 up to each cell's ground ----------
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. body: exterior envelope, interior slabs ------------------------
for (const [x, z, gr] of cells) {
  const ext = isExterior(x, z);
  const miss = missingDirs(x, z);
  const corner = miss.length >= 2;
  const idx = x + z; // rhythm along any facade

  if (ext) {
    for (let y = gr; y <= ROOF - 1; y++) {
      let id;
      if (y >= 26) {
        // cornice / parapet
        id = y === 27 ? "white_concrete" : "light_gray_concrete";
      } else if (corner) {
        // full-height corner piers
        id = "light_gray_concrete";
      } else if (y < STOREY) {
        // ground storey: stone base course, shopfront glazing, fascia
        if (y === 4) id = "white_concrete";
        else if (y === gr) id = "stone_bricks";
        else id = idx % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
      } else if (y % STOREY === 0) {
        id = "white_concrete";                 // floor line / spandrel
      } else {
        id = idx % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass"; // mullion or glass
      }
      put(x, y, z, id);
    }
  } else {
    // interior footprint cells: floor slabs and roof deck only (no interiors)
    for (let y = gr; y <= ROOF - 1; y++) {
      if (y === gr || y % STOREY === 0 || y === ROOF - 1) put(x, y, z, "gray_concrete");
    }
  }
}

// ---- 3. warm lights behind some windows --------------------------------
for (const [x, z, gr] of cells) {
  if (!isExterior(x, z) || missingDirs(x, z).length !== 1) continue;
  const [dx, dz] = missingDirs(x, z)[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isExterior(ix, iz)) continue;
  for (let y = STOREY + 1; y <= ROOF - 3; y++) {
    if (y % STOREY !== 2) continue;              // window band mid-height
    if (((x * 7 + z * 5 + y * 3) % 11) !== 0) continue;
    if (y < gnd(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// ---- 4. entrance on the north face (z = 0) -----------------------------
const EX = 14;
if (has(EX, 0)) {
  const eg = gnd(EX, 0);
  // clear the wall cell down to the ground floor, then place door + lintel
  for (let y = eg; y <= 3; y++) put(EX, y, 0, "air");
  put(EX, eg, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(EX, eg + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(EX, eg + 2, 0, "light_gray_concrete");
  // warm lamps flanking the entrance, set just inside the glazing
  if (has(EX, 1)) put(EX, eg + 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- 5. roof plant: central box with louvred ring, mast on top ----------
const cx = 14, cz = 14;
for (let x = cx - 5; x <= cx + 5; x++) {
  for (let z = cz - 5; z <= cz + 5; z++) {
    if (!has(x, z)) continue;
    const ring = Math.abs(x - cx) === 5 || Math.abs(z - cz) === 5;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      const louvre = ring && (y === ROOF + 1);
      put(x, y, z, louvre ? "iron_bars" : (ring ? "white_concrete" : "light_gray_concrete"),
        louvre ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
    }
  }
}

// mast: iron bars up from the plant, lightning rod at the tip
if (has(cx, cz)) {
  for (let y = ROOF + 3; y <= 36; y++) {
    put(cx, y, cz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  put(cx, 37, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
