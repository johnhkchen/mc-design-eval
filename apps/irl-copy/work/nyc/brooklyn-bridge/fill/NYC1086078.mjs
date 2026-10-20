import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1086078";
const W = 6, H = 29, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const row of cells) {
  const [x, z, gr, rf] = row;
  const ground = Math.max(0, Math.min(H - 6, Math.round(gr)));
  cellMap.set(key(x, z), { x, z, ground, roof: Math.round(rf) });
}
const has = (x, z) => cellMap.has(key(x, z));

// Smooth the lidar roof: average each cell with its 3x3 neighbourhood,
// then snap to whole two-block storeys above the cell's own ground.
for (const c of cellMap.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cellMap.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.roof; n++; }
  }
  const mean = sum / n;
  let k = Math.round((mean - c.ground) / 2);
  let roof = c.ground + 2 * k;
  if (roof < c.ground + 4) roof = c.ground + 4;
  if (roof > H) roof = H;
  c.roof = roof;
}

// Entrance: north (low z) perimeter cell nearest the centre.
let doorCell = null;
for (const c of cellMap.values()) {
  if (has(c.x, c.z - 1)) continue;
  if (c.x < 1 || c.x > W - 2) continue;
  if (!doorCell || Math.abs(c.x - (W - 1) / 2) < Math.abs(doorCell.x - (W - 1) / 2)) doorCell = c;
}

const lightSpots = [];

for (const c of cellMap.values()) {
  const { x, z, ground: gr, roof: rf } = c;
  const ex = { w: !has(x - 1, z), e: !has(x + 1, z), n: !has(x, z - 1), s: !has(x, z + 1) };
  const perim = ex.w || ex.e || ex.n || ex.s;
  const corner = (ex.w || ex.e) && (ex.n || ex.s);
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;
  // Cells beside the entrance on the same north face get a stone door surround.
  const nearDoor = doorCell && ex.n && !corner && Math.abs(x - doorCell.x) === 1 && z === doorCell.z;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < rf; y++) {
    const h = y - gr;

    if (y === rf - 1) { g.set(x, y, z, "smooth_stone"); continue; }

    if (h === 0) { g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone"); continue; }

    if (!perim) {
      if (h % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (y === rf - 2) { g.set(x, y, z, "stone_bricks"); continue; }

    if (h % 2 === 0) { g.set(x, y, z, "smooth_stone"); continue; }

    const u = (ex.w || ex.e) ? z : x;

    // Entrance bay on the north face: door, surround and lintel.
    if (isDoor && h >= 1 && h <= 3) {
      if (h === 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (h === 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      continue;
    }
    if (nearDoor && h <= 3) { g.set(x, y, z, "stone_bricks"); continue; }

    if (corner || u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }

    g.set(x, y, z, "glass");

    // Sparse warm lights behind a few windows
    if ((u + (h >> 1)) % 4 === 0) {
      let ix = x, iz = z;
      if (ex.w) ix = x + 1;
      else if (ex.e) ix = x - 1;
      else if (ex.n) iz = z + 1;
      else if (ex.s) iz = z - 1;
      const inner = cellMap.get(key(ix, iz));
      if (inner) {
        const innerPerim =
          !has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1);
        if (!innerPerim && y >= inner.ground && y < inner.roof - 2) {
          lightSpots.push([ix, y, iz, "glowstone"]);
        }
      }
    }
  }
}

for (const [ix, y, iz, id] of lightSpots) g.set(ix, y, iz, id);

g.save(`${DIR}/${ID}.nbt`);
