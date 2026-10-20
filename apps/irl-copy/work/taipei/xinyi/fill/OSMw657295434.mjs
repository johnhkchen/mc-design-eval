import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿天下 (Taipei World Trade Center): late-1980s/1990s pale-concrete frame
// office tower on a blue-tinted curtain wall, with a plant core on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw657295434";
const W = 34, H = 71, D = 24;
const ROOF = 59;   // roof slab level, about 59 blocks above the lowest ground
const FLOOR = 5;   // storey height in blocks

const SLAB = "white_concrete";
const SPANDREL = "light_gray_concrete";
const PIER = "white_concrete";
const PANE = "light_blue_stained_glass_pane";
const GLASS = "light_blue_stained_glass";
const BASE = "smooth_stone";
const PLINTH = "stone";

const paneProps = (face) =>
  (face === "n" || face === "s")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// ---- footprint and ground ----
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  gmap.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), ROOF - 12));
}
const inFp = (x, z) => gmap.has(`${x},${z}`);
const gAt = (x, z) => gmap.get(`${x},${z}`);
const faces = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("n");
  if (!inFp(x, z + 1)) f.push("s");
  if (!inFp(x - 1, z)) f.push("w");
  if (!inFp(x + 1, z)) f.push("e");
  return f;
};
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const cellList = [...gmap.keys()].map((k) => k.split(",").map(Number));

// ---- entrance: south-facing edge cell nearest the middle ----
const CX = Math.floor(W / 2);
let door = null;
for (const [x, z] of cellList) {
  if (!faces(x, z).includes("s")) continue;
  if (!door || Math.abs(x - CX) < Math.abs(door[0] - CX)) door = [x, z];
}

// ---- main shell: foundation, base, storeys, roof, parapet ----
for (const [x, z] of cellList) {
  const gr = gAt(x, z);
  const f = faces(x, z);
  const edge = f.length > 0;
  const corner = f.length >= 2;
  const face = f[0];
  const along = (face === "n" || face === "s") ? x : z;
  const mullion = along % 3 === 0;
  const isEntrance = door && face === "s" && Math.abs(x - door[0]) <= 1 && Math.abs(z - door[1]) <= 1;

  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) { put(x, y, z, PLINTH); continue; }
    if (y === gr) { put(x, y, z, BASE); continue; }
    if (y === ROOF) { put(x, y, z, edge ? SLAB : "light_gray_concrete"); continue; }

    if (!edge) {
      if (y % FLOOR === 0) put(x, y, z, SLAB); // interior floor slab per storey
      continue;
    }

    if (corner) { put(x, y, z, PIER); continue; }

    if (isEntrance && y >= gr + 1 && y <= gr + 3) {
      if (x === door[0] && z === door[1]) {
        const half = y <= gr + 1 ? "lower" : "upper";
        if (y <= gr + 2) {
          put(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, GLASS);
        }
      } else {
        put(x, y, z, GLASS);
      }
      continue;
    }
    if (isEntrance && y === gr + 4) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // canopy header
      continue;
    }

    const ground = y < gr + FLOOR;
    let placed = null;
    if (ground) {
      if (y === gr + 4) put(x, y, z, SPANDREL);
      else if (mullion) put(x, y, z, PIER);
      else { put(x, y, z, PANE, paneProps(face)); placed = "pane"; }
    } else {
      if (y % FLOOR === 0) put(x, y, z, SPANDREL);
      else if (mullion) put(x, y, z, PIER);
      else { put(x, y, z, PANE, paneProps(face)); placed = "pane"; }
    }

    // warm lights set back behind some windows (inside the air gap)
    if (placed === "pane" && (y % FLOOR === 2 || y % FLOOR === 3)) {
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (inFp(ix, iz) && y > gAt(ix, iz) && (x * 7 + z * 5 + y) % 11 === 0) {
        put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
      }
    }
  }

  // parapet / coping on the perimeter
  if (edge && !corner) { put(x, ROOF + 1, z, SLAB); put(x, ROOF + 2, z, SLAB); }
  if (corner) { put(x, ROOF + 1, z, SLAB); put(x, ROOF + 2, z, SLAB); }
}

// ---- entrance lantern under the canopy header ----
if (door) {
  const [dx, dz] = door;
  const gd = gAt(dx, dz);
  const ix = dx, iz = dz - 1;
  if (inFp(ix, iz) && gAt(ix, iz) <= gd + 3) {
    put(ix, gd + 4, iz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(ix, gd + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- roof plant core (interior, central) ----
const CXc = 16, CZc = 11;
for (let x = CXc - 8; x <= CXc + 8; x++) {
  for (let z = CZc - 5; z <= CZc + 5; z++) {
    if (!inFp(x, z) || faces(x, z).length) continue;
    const ringX = Math.abs(x - CXc) === 8;
    const ringZ = Math.abs(z - CZc) === 5;
    const ring = ringX || ringZ;
    put(x, 60, z, SPANDREL);
    put(x, 65, z, SLAB);
    for (let y = 61; y <= 64; y++) {
      if (!ring) continue;
      const mull = (ringX ? z : x) % 3 === 0;
      if (mull) put(x, y, z, PIER);
      else put(x, y, z, PANE, ringX ? paneProps("w") : paneProps("n"));
    }
  }
}
// mast on the plant core
for (let y = 66; y <= 68; y++) {
  put(CXc, y, CZc, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
