import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義之星 (Xinyi district office tower): late-1990s/2000s Taipei glass office block.
// Glass-and-white-concrete tower on a shop podium, two setbacks, a crown and a roof plant room.
// Storeys are 5 blocks high. The roof sits at y 63, with plant to 66 and a mast to 71.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477004";
const W = 47, H = 76, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint and ground lookup ----
const grd = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) grd[x][z] = g;
}
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && grd[x][z] >= 0;

// ---- distance from the footprint edge (0 = boundary cell) ----
const dist = Array.from({ length: W }, () => Array(D).fill(Infinity));
const queue = [];
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inside(x, z)) continue;
    const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
    if (edge) { dist[x][z] = 0; queue.push([x, z]); }
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (inside(nx, nz) && dist[nx][nz] === Infinity) {
      dist[nx][nz] = dist[x][z] + 1;
      queue.push([nx, nz]);
    }
  }
}

// ---- vertical tiers (absolute y) ----
const maxG = Math.max(...cells.map((c) => c[2]));
const P = Math.max(14, maxG + 10);          // podium top
const A = Math.min(P + 30, 44);             // tower A top
const B = Math.min(A + 12, 56);             // tower B top
const R = 63;                               // main roof course
const tiers = [
  { s: null, e: P, inset: 0 },              // podium, starts at each cell's ground
  { s: P + 1, e: A, inset: 3 },             // tower A
  { s: A + 1, e: B, inset: 6 },             // tower B (first setback)
  { s: B + 1, e: R, inset: 9 },             // crown (second setback)
  { s: R + 1, e: 66, inset: 12 },           // roof plant room
];

const inT = (k, x, z) => inside(x, z) && dist[x][z] >= tiers[k].inset;
const outDirs = (k, x, z) => {
  const out = [];
  if (!inT(k, x - 1, z)) out.push("w");
  if (!inT(k, x + 1, z)) out.push("e");
  if (!inT(k, x, z - 1)) out.push("n");
  if (!inT(k, x, z + 1)) out.push("s");
  return out;
};

// ---- writer ----
const vox = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, name, props);
  else vox.set(x, y, z, name);
};

// Entrance: centre of the south face of the podium.
const doorX = Math.floor(W / 2);
let doorZ = -1;
for (let z = 0; z < D; z++) if (inside(doorX, z)) doorZ = z;

const paneProps = (face) =>
  face === "w" || face === "e"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// ---- build ----
for (const [x, z, g] of cells) {
  const d = dist[x][z];

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  for (let k = 0; k < tiers.length; k++) {
    const t = tiers[k];
    if (d < t.inset) continue;
    const s = k === 0 ? g : t.s;
    const e = t.e;
    if (e < s) continue;

    const dirs = outDirs(k, x, z);
    const shell = dirs.length > 0;
    const face = dirs[0];
    const corner = dirs.length > 1;

    for (let y = s; y <= e; y++) {
      const rel = y - s;

      // top course of the tier: cornice on the edge, slab inside (also the next tier's floor)
      if (y === e) {
        put(x, y, z, shell ? "white_concrete" : "light_gray_concrete");
        continue;
      }

      // interior: only floor slabs, air gap elsewhere
      if (!shell) {
        if (rel % 5 === 0) put(x, y, z, "light_gray_concrete");
        continue;
      }

      // facade: storey line
      if (rel % 5 === 0) {
        put(x, y, z, (k === 0 && rel === 0) ? "polished_granite" : "light_gray_concrete");
        continue;
      }

      // facade: window zone
      const along = (face === "w" || face === "e") ? z : x;
      const inShop = k === 0 && (y - g) <= 4;

      if (inShop) {
        const isDoor = x === doorX && z === doorZ && dirs.includes("s");
        if (isDoor && (y === g + 1 || y === g + 2)) {
          const half = y === g + 1 ? "lower" : "upper";
          put(x, y, z, "iron_door", {
            facing: "south", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (y === g + 3) {
          put(x, y, z, "white_concrete");                    // fascia band
        } else if (along % 4 === 0 || corner) {
          put(x, y, z, "white_concrete");                    // shopfront mullion
        } else {
          put(x, y, z, "light_blue_stained_glass");          // shop glass
        }
        continue;
      }

      if (corner || along % 3 === 0) {
        put(x, y, z, "white_concrete");                      // mullion / frame
        continue;
      }

      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));

      // warm light: glowstone one block inside some windows
      if (along % 6 === 4 && rel % 5 === 3 && (k + x + z) % 2 === 0) {
        const ix = face === "w" ? x + 1 : face === "e" ? x - 1 : x;
        const iz = face === "n" ? z + 1 : face === "s" ? z - 1 : z;
        if (inT(k, ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// Roof mast on the plant room, near the centre.
let best = null;
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inside(x, z) || dist[x][z] < 12) continue;
    const dd = Math.abs(x - 23) + Math.abs(z - 14);
    if (!best || dd < best.dd) best = { x, z, dd };
  }
}
if (best) {
  for (let y = 67; y <= 70; y++) put(best.x, y, best.z, "iron_block");
  put(best.x, 71, best.z, "lightning_rod", { facing: "up", powered: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
