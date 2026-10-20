import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864109";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const minG = Math.min(...cells.map(c => c[2]));

// Two storeys of ~5 blocks, roof slab, parapet. Roof ~11 above lowest ground.
const top = Math.min(H - 2, minG + 11); // roof surface row
const L2 = top - 1;                      // upper floor / cornice line
const L1 = top - 6;                      // ground floor / first floor line

const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Door: on the south (max z) street face, middle of that run of cells
const southCells = cells.filter(([x, z]) => !has(x, z + 1)).sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

for (const [x, z, f] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y <= f; y++) set(x, y, z, "stone_bricks");

  // Interior storey floors and roof slab, supported by the walls and foundation below
  for (const y of [L1, L2]) if (y > f) set(x, y, z, "smooth_stone");
  if (top > f) set(x, top, z, "red_terracotta");

  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const facade = missN || missS || missW || missE;

  if (facade) {
    const zFace = missN || missS;            // street face runs east-west
    const corner = (missN || missS) && (missW || missE);
    const idx = zFace ? x : z;
    const pier = corner || idx % 3 === 0;
    const paneProps = zFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const isDoor = `${x},${z}` === doorKey;

    for (let y = f + 1; y <= top; y++) {
      let b = null, props;
      if (y === f + 1) {
        b = "polished_granite";                       // base course
      } else if (y < L1) {
        if (y === L1 - 1) b = "dark_oak_planks";      // shopfront fascia
        else b = pier ? "white_concrete" : "glass_pane";
      } else if (y === L1) {
        b = "smooth_stone";                           // storey line
      } else if (y < L2) {
        if (y === L2 - 1) b = "white_concrete";       // upper sill band
        else b = pier ? "white_concrete" : "glass_pane";
      } else if (y === L2) {
        b = "smooth_stone";                           // cornice
      } else {
        b = "red_terracotta";                         // roof edge
      }
      if (b === "glass_pane") props = paneProps;
      set(x, y, z, b, props);
    }

    // Parapet above the roof row on the street face
    set(x, top + 1, z, "white_concrete");

    // Entrance: double door with dark lintel over it
    if (isDoor) {
      const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
      set(x, f + 1, z, "oak_door", doorProps("lower"));
      set(x, f + 2, z, "oak_door", doorProps("upper"));
      set(x, f + 3, z, "dark_oak_planks");
    }
  }
}

// Warm lights set just inside the street-facing windows (interior air behind glass)
for (const [x, z, f] of cells) {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  if (!(missN || missS || missW || missE)) continue;
  if (missN && missS) continue;  // corners and irregular runs: skip
  if (missW && missE) continue;
  let ix = x, iz = z;
  if (missS) iz = z - 1;
  else if (missN) iz = z + 1;
  else if (missE) ix = x - 1;
  else if (missW) ix = x + 1;
  if (!has(ix, iz)) continue;
  const idx = (missN || missS) ? x : z;
  if (idx % 6 !== 2) continue;
  set(ix, f + 1, iz, "glowstone");          // ground-floor window light
  set(ix, L1 + 1, iz, "glowstone");         // upper-floor window light
}

// Rooftop plant: a few light plant boxes on the roof
for (const [x, z] of cells) {
  if (x >= 4 && x <= 9 && z >= 5 && z <= 9 && !(!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z))) {
    if (top + 1 < H && (x + z) % 3 === 0) set(x, top + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
