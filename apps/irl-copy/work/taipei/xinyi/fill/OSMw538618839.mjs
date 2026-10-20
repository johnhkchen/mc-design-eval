import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618839";
const W = 31, H = 23, D = 42;

// ---- footprint -----------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const arr = Array.isArray(raw) ? raw : (raw.cells ?? []);
const ground = new Map();
for (const c of arr) {
  const x = Array.isArray(c) ? c[0] : c.x;
  const z = Array.isArray(c) ? c[1] : c.z;
  let G = Array.isArray(c) ? c[2] : (c.ground ?? c.g ?? 0);
  G = Math.round(G ?? 0);
  // keep the roof (ground + 11) inside the structure height
  G = Math.min(Math.max(0, G), H - 12);
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(`${x},${z}`, G);
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// ---- voxel helpers -------------------------------------------------------
const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Entrance: exposed south face cell closest to the footprint centre
let doorX = null;
{
  let best = Infinity;
  for (const [k, G] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (!inFp(x, z + 1) && Math.abs(x - W / 2) < best) {
      best = Math.abs(x - W / 2);
      doorX = { x, z };
    }
  }
}

// ---- build ---------------------------------------------------------------
for (const [k, G] of ground) {
  const [x, z] = k.split(",").map(Number);

  const N = !inFp(x, z - 1), S = !inFp(x, z + 1);
  const Wf = !inFp(x - 1, z), E = !inFp(x + 1, z);
  const edge = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);

  // foundation under the cell
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  // base course / floors / roof (full cover on every footprint cell)
  set(x, G, z, "smooth_stone");                 // base course at ground
  set(x, G + 5, z, "light_gray_concrete");      // storey line 1/2
  set(x, G + 10, z, "light_gray_concrete");     // storey line 2/roof
  set(x, G + 11, z, "white_concrete");          // roof / parapet cap

  // roof equipment on interior roof cells (sparse)
  if (!edge && (x * 3 + z * 5) % 23 === 0) {
    set(x, G + 12, z, "iron_block");
  }

  if (!edge) continue;

  // exterior wall column: storeys G+1..G+4 (commercial), G+6..G+9 (office)
  const idx = (N || S) ? x : z;
  const pillar = corner || idx % 3 === 0;

  for (let y = G + 1; y <= G + 11; y++) {
    if (y === G + 5 || y === G + 10 || y === G + 11) continue; // already set above
    const rel = y - G;

    // Entrance on ground storey, south face
    if (doorX && x === doorX.x && z === doorX.z && (rel === 1 || rel === 2)) {
      set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (doorX && x === doorX.x && z === doorX.z && rel === 3) {
      set(x, y, z, "white_concrete"); // canopy frame over door
      continue;
    }

    // sills and lintels
    if (rel === 1 || rel === 6 || rel === 4 || rel === 9) {
      set(x, y, z, rel === 1 || rel === 6 ? "smooth_stone" : "white_concrete");
      continue;
    }

    if (pillar) {
      set(x, y, z, "white_concrete");
      continue;
    }

    // glass window bands
    const isWindowRow = (rel >= 2 && rel <= 3) || (rel >= 7 && rel <= 8);
    if (isWindowRow) {
      const props = (N || S) ? PANE_NS : PANE_EW;
      set(x, y, z, "glass_pane", props);
    } else {
      set(x, y, z, "white_concrete");
    }
  }

  // warm lights behind some upper-storey windows
  if (!pillar && (x + z) % 5 === 0) {
    let ix = x, iz = z;
    if (N) iz = z + 1;
    else if (S) iz = z - 1;
    else if (Wf) ix = x + 1;
    else if (E) ix = x - 1;
    if (inFp(ix, iz)) {
      set(ix, G + 7, iz, "glowstone");
    }
  }
}

// ---- save ----------------------------------------------------------------
g.save(`${DIR}/${ID}.nbt`);
