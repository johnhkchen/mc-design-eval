import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: 2 storeys of cream ceramic-tile facade,
// glass shopfront at street level, pilasters on a 3-block rhythm, and a rooftop plant room.
const W = 44, H = 23, D = 25;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw607932195.cells.json", "utf8"));

const g = new Voxels([W, H, D]);
const key = (x, z) => x + "," + z;
const fp = new Set(cells.map(([x, z]) => key(x, z)));

// Common floor level: highest ground under the footprint, so the body is level.
const B = Math.max(...cells.map(([, , gr]) => Math.round(gr)));

const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Outward directions: [dx, dz, name]
const dirs = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// Pane connection states so glass runs read as continuous windows.
const paneState = (alongNS) => alongNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the common floor level under every cell.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const outward = dirs.filter(([dx, dz]) => !fp.has(key(x + dx, z + dz)));
  const perim = outward.length > 0;

  // Floor at B: plinth on the perimeter, floor slab inside.
  put(x, B, z, perim ? "stone_bricks" : "smooth_quartz");

  if (!perim) {
    put(x, B + 5, z, "smooth_quartz");   // upper floor slab
    put(x, B + 10, z, "gray_concrete");  // roof deck
    continue;
  }

  const [dx, dz, dir] = outward[0];
  const alongNS = dir === "N" || dir === "S";
  const i = alongNS ? x : z;
  const pil = i % 3 === 0;
  const pane = paneState(alongNS);
  const inward = [x - dx, z - dz];
  const inwardOk = fp.has(key(inward[0], inward[1]));

  // Ground storey: shopfront glass between pilasters, entrance on the north face.
  const isEntrance = dir === "N" && z === 0 && x === 22;
  for (let y = B + 1; y <= B + 3; y++) {
    if (pil) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", pane);
  }
  if (isEntrance) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, B + 1, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, B + 2, z, "dark_oak_door", { ...door, half: "upper" });
    put(x, B + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  // Transom band and storey line.
  put(x, B + 4, z, pil ? "light_gray_concrete" : "smooth_quartz");
  put(x, B + 5, z, "light_gray_concrete");

  // Upper storey: windows between pilasters.
  for (let y = B + 6; y <= B + 9; y++) {
    if (pil) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", pane);
  }

  // Cornice and parapet.
  put(x, B + 10, z, "smooth_quartz");
  put(x, B + 11, z, pil ? "light_gray_concrete" : "smooth_quartz");

  // Warm light behind some windows (air gap behind glass, lamp in the interior cell).
  if (!pil && inwardOk && !isEntrance) {
    if ((i + 0) % 4 === 2) put(inward[0], B + 2, inward[1], "glowstone");
    if ((i + 2) % 4 === 2) put(inward[0], B + 7, inward[1], "glowstone");
  }
}

// Interior floor and ceiling slabs are placed for every footprint cell above; the
// rooftop plant room sits on the interior roof deck at B+10.
const plant = { x0: 16, x1: 27, z0: 8, z1: 16 };
for (let x = plant.x0; x <= plant.x1; x++) {
  for (let z = plant.z0; z <= plant.z1; z++) {
    if (!fp.has(key(x, z))) continue;
    put(x, B + 11, z, "light_gray_concrete");
    if (x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1) {
      put(x, B + 12, z, "light_gray_concrete");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw607932195.nbt");
