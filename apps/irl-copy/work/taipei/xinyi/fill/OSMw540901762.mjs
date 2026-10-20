import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901762";
const W = 10, H = 23, D = 18;
const ROOF = 11; // roof deck top sits at height 11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Exterior faces of a footprint cell. axis "x" = west/east wall (bays run along z),
// axis "z" = north/south wall (bays run along x).
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push({ axis: "x", idx: z, inX: 1, inZ: 0 });
  if (!has(x + 1, z)) f.push({ axis: "x", idx: z, inX: -1, inZ: 0 });
  if (!has(x, z - 1)) f.push({ axis: "z", idx: x, inX: 0, inZ: 1 });
  if (!has(x, z + 1)) f.push({ axis: "z", idx: x, inX: 0, inZ: -1 });
  return f;
}

const isMech = (x, z) => x >= 3 && x <= 5 && z >= 6 && z <= 11;

// Pass 1: foundation, floors, walls, cornice, parapet, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  const fc = faces(x, z);
  for (let y = gr + 1; y <= ROOF; y++) {
    if (fc.length === 0) {
      if (y === 5) put(x, y, z, "smooth_stone");              // storey-2 floor slab
      else if (y === 10) put(x, y, z, "gray_concrete");        // roof deck
      else if (y === 11 && isMech(x, z)) put(x, y, z, "light_gray_concrete"); // plant box
      continue;
    }
    const face = fc[0];
    const pillar = fc.length > 1 || face.idx % 3 === 0;
    let id = "white_concrete";
    let p = null;
    if (y === 5 || y === 10) {
      id = "orange_terracotta";                                // string course and cornice
    } else if (y === 11) {
      id = "white_concrete";                                   // parapet
    } else if (y === 4 || y === 6 || y === 9) {
      id = "white_concrete";                                   // lintels and spandrels
    } else if (pillar) {
      id = "white_concrete";                                   // mullions and corners
    } else {
      id = "glass_pane";
      p = face.axis === "x" ? paneX : paneZ;
    }
    put(x, y, z, id, p);
  }
}

// Pass 2: entrance, awning, lamps
const minZ = Math.min(...cells.map(c => c[1]));
const rowXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const ex = rowXs[Math.floor(rowXs.length / 2)];
const exGround = gAt(ex, minZ);

// Red awning across the entrance bay, on the lintel course above the door
for (const [x, z, gr] of cells) {
  if (z === minZ && Math.abs(x - ex) <= 1 && faces(x, z).length > 0 && 4 > gr) {
    put(x, 4, z, "red_wool");
  }
}

// Dark oak double-height door (lower and upper halves) on the entrance bay
const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(ex, exGround + 1, minZ, "dark_oak_door", { ...doorBase, half: "lower" });
put(ex, exGround + 2, minZ, "dark_oak_door", { ...doorBase, half: "upper" });

// Lantern just inside the entrance
if (has(ex, minZ + 1) && exGround + 1 > gAt(ex, minZ + 1)) {
  put(ex, exGround + 1, minZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm glow behind some upper-storey windows (glowstone in the air gap inside)
for (const [x, z, gr] of cells) {
  const fc = faces(x, z);
  if (fc.length !== 1) continue;
  const face = fc[0];
  if (face.idx % 3 === 0 || face.idx % 4 !== 1) continue;
  const ix = x + face.inX, iz = z + face.inZ;
  if (!has(ix, iz)) continue;
  if (faces(ix, iz).length > 0) continue;
  if (7 <= gAt(ix, iz)) continue;
  put(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
