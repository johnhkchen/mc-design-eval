import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009194";
const W = 20, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isExt = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Safe setter: ignores anything outside the volume.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Door sits on the south face, at the median x of the south-facing cells.
const southXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

const glows = [];

for (const [x, z, gc] of cells) {
  const ex = { W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) };
  const exKeys = Object.keys(ex).filter((k) => ex[k]);
  const ext = exKeys.length > 0;
  const corner = (ex.W || ex.E) && (ex.N || ex.S);
  const prim = exKeys[0];
  const along = (prim === "W" || prim === "E") ? z : x;
  const mod = along % 3; // 1 = window bay, 0 = mullion, 2 = plain wall
  const isWin = ext && !corner && mod === 1;
  const isMull = ext && !corner && mod === 0;
  const isDoor = ext && exKeys.length === 1 && ex.S && x === doorX;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Base course / ground slab at the cell's ground level.
  put(x, gc, z, ext ? "polished_andesite" : "smooth_stone");

  if (!ext) {
    // Interior: floor slabs and roof deck only; air between (no interiors).
    put(x, gc + 5, z, "smooth_stone");
    put(x, gc + 10, z, "smooth_stone");

    // Roof plant: small mechanical units on the roof.
    if (x % 7 === 3 && z % 5 === 2) {
      put(x, gc + 11, z, "iron_block");
      put(x, gc + 12, z, "iron_block");
    }
    continue;
  }

  // Ground storey (shopfront): glass in window bays, dark polished stone elsewhere.
  for (let y = gc + 1; y <= gc + 3; y++) {
    if (isDoor && (y === gc + 1 || y === gc + 2)) continue; // door placed below
    put(x, y, z, isWin ? "glass" : "polished_andesite");
  }
  if (isDoor) {
    const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gc + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    put(x, gc + 2, z, "dark_oak_door", { ...dp, half: "upper" });
  }

  // Lintel / storey line below the upper floor.
  put(x, gc + 4, z, "light_gray_concrete");
  put(x, gc + 5, z, "light_gray_concrete");

  // Upper storey: window grid with mullions, plain white wall between.
  for (let y = gc + 6; y <= gc + 8; y++) {
    let id;
    if (corner || isMull) id = "light_gray_concrete";
    else if (isWin) id = "glass";
    else id = "white_concrete";
    put(x, y, z, id);
  }
  put(x, gc + 9, z, "light_gray_concrete");   // cornice band
  put(x, gc + 10, z, "light_gray_concrete");  // roof edge
  put(x, gc + 11, z, "white_concrete");       // parapet

  // Remember window cells that can be lit from inside.
  if (isWin || (isDoor === false && isWin)) {
    const inner = { W: [x + 1, z], E: [x - 1, z], N: [x, z + 1], S: [x, z - 1] }[prim];
    if (inner && has(inner[0], inner[1]) && !isExt(inner[0], inner[1])) {
      glows.push({ ix: inner[0], iz: inner[1], gc, pick: (x + z) % 3 });
    }
  }
}

// Warm light behind some glass: glowstone upstairs, lanterns on the ground floor.
for (const { ix, iz, gc, pick } of glows) {
  if (pick === 0) put(ix, gc + 7, iz, "glowstone");
  else if (pick === 1) put(ix, gc + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
