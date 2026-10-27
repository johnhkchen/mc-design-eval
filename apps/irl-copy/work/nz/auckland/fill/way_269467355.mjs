import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s-50s reinforced-concrete commercial block, three storeys, plastered, with shopfronts on the street side (N, E):
// the lidar has the main body to y 13 (a parapet to 14 above its lowest ground) and a lower two-storey wing to y 11 on the
// west edge. The building is solid (no rooms): each window is a glass pane with one air cell behind it, and every storey
// plate is a solid course, so nothing hangs. Storey lines at y 4, 8, 12 (plates), a stone plinth below y 4.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269467355.cells.json`, "utf8"));

// the footprint: each cell's ground (third number) and the lidar roof (fourth), smoothed into two flat tiers
const FOOT = new Map();
for (const [x, z, ground, roof] of cells) FOOT.set(`${x},${z}`, { ground, top: roof <= 11 ? 11 : 13 });
const inF = (x, z) => FOOT.has(`${x},${z}`);
const topAt = (x, z) => FOOT.get(`${x},${z}`).top;
const groundAt = (x, z) => FOOT.get(`${x},${z}`).ground;

// N is toward z 0, the uphill street side (the highest ground); the shopfronts face N and E
const OUT = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const exposed = (x, z) => Object.keys(OUT).filter((d) => !inF(x + OUT[d][0], z + OUT[d][1]));
const cellList = [...FOOT.keys()].map((k) => k.split(",").map(Number));

const v = new Voxels([23, 26, 35]);

// 1. the mass: solid from y 0 to each tier's top (foundation and wing alike), stone plinth, plate courses in smooth stone
for (const [x, z] of cellList) {
  const top = topAt(x, z);
  for (let y = 0; y < top; y++) {
    const plate = y === 4 || y === 8 || y === top - 1;
    v.set(x, y, z, y <= 3 ? "stone_bricks" : plate ? "smooth_stone" : "white_concrete");
  }
}

// 2. the facade: each perimeter cell takes its first exposed side (N, E, S, W) and that side's articulation
const windows = []; // [x, y, z, pocket x, pocket z, along, storey]
const pane = (x, y, z, d) => {
  const link = (a, b) => (inF(a, b) && topAt(a, b) > y ? "true" : "false");
  if (d === "N" || d === "S") return { north: "false", south: "false", east: link(x + 1, z), west: link(x - 1, z) };
  return { north: link(x, z - 1), south: link(x, z + 1), east: "false", west: "false" };
};
for (const [x, z] of cellList) {
  const dirs = exposed(x, z);
  if (!dirs.length) continue;
  const d = dirs[0], [ox, oz] = OUT[d];
  const top = topAt(x, z), ground = groundAt(x, z);
  const along = d === "N" || d === "S" ? x : z;   // position along the face: a pier every third cell
  const shop = d === "N" || d === "E";
  const bay = along % 3 !== 0;
  const px = x - ox, pz = z - oz;                 // the room cell behind the glass
  const pocket = inF(px, pz) && exposed(px, pz).length === 0;
  const ymax = top === 13 ? 13 : top - 1;
  const glassOK = (y) => {
    if (y === 1 || y === 2) return y >= ground && bay;          // lower storey, showing on the downhill side
    if (y === 5 || y === 6) return shop ? along % 4 !== 0 : bay; // shopfront glass on the street side, a pier every 4th
    if (y === 9 || y === 10) return top === 13 && bay;           // upper storey (the wing has none)
    return false;
  };
  for (let y = 0; y <= ymax; y++) {
    let b, st;
    if (y === 0) b = "smooth_stone";                                             // base course
    else if (y === 3) b = "light_gray_concrete";                                 // sill course
    else if (y === 4 || y === 8 || y === 12) b = "smooth_stone";                 // storey plates
    else if (y === 7) b = shop ? "dark_oak_planks" : "light_gray_concrete";      // shop fascia / spandrel
    else if (y === 11 || (y === 9 && top === 11)) b = "light_gray_concrete";     // spandrel / wing louvre band
    else if (y === 10 && top === 11) b = "smooth_stone";                         // wing cap
    else if (y === 13) b = "smooth_stone";                                       // parapet
    else if (glassOK(y) && pocket) {
      b = "glass_pane"; st = pane(x, y, z, d);
      windows.push([x, y, z, px, pz, along, y <= 2 ? 0 : y <= 6 ? 1 : 2]);
    } else b = y <= 2 ? "stone_bricks" : "white_concrete";                       // pier / plaster
    v.set(x, y, z, b, st);
  }
}

// 3. the room behind each glass pane: air, or a warm glowstone light in about one bay in four
for (const [, y, , px, pz, along, storey] of windows) {
  v.set(px, y, pz, (along + storey) % 4 === 1 ? "glowstone" : "air");
}

// 4. the main entrance on the uphill (north) face: a double-leaf door under the shop fascia, with its vestibule cell open
v.set(15, 5, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(15, 6, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(15, 5, 1, "air"); v.set(15, 6, 1, "air");

// 5. roof plant room on the main tier, standing on the roof: louvred band, a smooth cap
let plant = 0;
for (let x = 9; x <= 14; x++) for (let z = 15; z <= 20; z++) {
  if (!inF(x, z) || topAt(x, z) !== 13 || exposed(x, z).length) continue;
  plant++;
  v.set(x, 13, z, "light_gray_concrete");
  v.set(x, 14, z, (x + z) % 2 === 0 ? "gray_concrete" : "light_gray_concrete");
  v.set(x, 15, z, "smooth_stone");
}

const info = v.save(`${DIR}/way_269467355.nbt`);
console.log(JSON.stringify({ cells: cellList.length, windows: windows.length, plantCells: plant, ...info }));
