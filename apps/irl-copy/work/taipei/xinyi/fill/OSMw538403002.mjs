import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403002";
const W = 22, H = 23, D = 14;

// Record: no tags. Read as a small 2-storey mid-century concrete shophouse,
// off-white concrete with light grey floor bands, shopfront at ground,
// flat roof with parapet, cornice, and rooftop AC plant and a water tank.
// Roof parapet top sits about 11 blocks above the lowest ground.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const gAt = (x, z) => fp.get(`${x},${z}`);
const inFp = (x, z) => fp.has(`${x},${z}`);
const minG = Math.min(...fp.values());
const minZ = Math.min(...[...fp.keys()].map((k) => Number(k.split(",")[1])));

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  const gr = gAt(x, z);
  if (gr === undefined || y < gr) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs and roof deck over every footprint cell.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const rel of [0, 5, 10]) put(x, minG + rel, z, "smooth_stone");
}

// 3. Envelope on edge cells.
const missingDirs = (x, z) => {
  const out = [];
  if (!inFp(x, z - 1)) out.push("N");
  if (!inFp(x, z + 1)) out.push("S");
  if (!inFp(x - 1, z)) out.push("W");
  if (!inFp(x + 1, z)) out.push("E");
  return out;
};

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const miss = missingDirs(x, z);
  if (miss.length === 0) continue;
  const corner = miss.length >= 2;
  const alongX = miss.includes("N") || miss.includes("S");
  const u = x + z;
  const pier = corner || u % 3 === 0;

  for (let rel = 0; rel <= 11; rel++) {
    const y = minG + rel;
    if (y >= H) break;
    if (y < gr) continue;

    let id, p;
    if (rel === 0) {
      id = "smooth_stone";                       // base course
    } else if (rel === 5 || rel === 10) {
      id = "light_gray_concrete";                // floor line / cornice band
    } else if (rel === 11) {
      id = "white_concrete";                     // parapet
    } else if (pier) {
      id = "white_concrete";                     // piers
    } else if (rel <= 4) {
      if (rel <= 3) { id = "glass"; }            // ground-floor shopfront glass
      else { id = "white_concrete"; }            // fascia
    } else {
      if (rel === 7 || rel === 8) { id = "glass_pane"; p = paneProps(alongX); }
      else id = "white_concrete";
    }
    put(x, y, z, id, p);
  }
}

// 4. Entrance on the lowest-z front edge, nearest the middle of the frontage.
const frontCells = cells
  .filter(([x, z, gr]) => z === minZ && gr <= minG + 1)
  .map(([x]) => x)
  .sort((a, b) => a - b);
if (frontCells.length) {
  const mid = (Math.min(...frontCells) + Math.max(...frontCells)) / 2;
  const doorX = frontCells.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
  put(doorX, minG + 1, minZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, minG + 2, minZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (inFp(doorX + dx, minZ)) {
      put(doorX + dx, minG + 3, minZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// 5. Warm lights in the interior, just behind the windows.
for (const [x, z, gr] of cells) {
  const interior = inFp(x - 1, z) && inFp(x + 1, z) && inFp(x, z - 1) && inFp(x, z + 1);
  if (!interior) continue;
  const nearEdge = !(
    inFp(x - 2, z) && inFp(x + 2, z) && inFp(x, z - 2) && inFp(x, z + 2)
  );
  if (nearEdge && (x + z) % 3 === 1) {
    put(x, minG + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 6. Roof plant: AC condenser boxes and a water tank.
for (let x = 3; x <= W - 4; x += 6) {
  for (let z = 3; z <= D - 4; z += 5) {
    const cellsBox = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (cellsBox.every(([a, b]) => inFp(a, b))) {
      for (const [a, b] of cellsBox) put(a, minG + 11, b, "light_gray_concrete");
    }
  }
}
for (const [x, z] of [[15, 3], [16, 3], [15, 4], [16, 4]]) {
  if (inFp(x, z)) {
    put(x, minG + 11, z, "smooth_quartz");
    put(x, minG + 12, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
