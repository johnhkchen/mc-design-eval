import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3425340.cells.json`, "utf8"));
const W = 6, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint map: key "x,z" -> { gr: ground, roof: lidar roof height }
const fp = new Map();
for (const [x, z, gr, roof] of cells) {
  fp.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isPerim = (x, z) => inFp(x, z) && exposed(x, z).length > 0;

// one flat roofline for the whole block: median lidar roof, never below any ground + 5
const roofVals = [...fp.values()].map((c) => c.roof).sort((a, b) => a - b);
const ROOF = Math.min(23, roofVals[Math.floor(roofVals.length / 2)]);
const maxGround = Math.max(...[...fp.values()].map((c) => c.gr));
const T_ALL = Math.min(23, Math.max(ROOF, maxGround + 5));

// entrance: perimeter cell on the low-z face, nearest x = 2
let door = null;
{
  const cands = [];
  for (const k of fp.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (exposed(x, z).some(([dx, dz]) => dz === -1 && dx === 0)) cands.push([x, z]);
  }
  cands.sort((a, b) => Math.abs(a[0] - 2) - Math.abs(b[0] - 2));
  if (cands.length) door = cands[0];
}

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.gr;
  const T = T_ALL;

  const faces = exposed(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const N = Math.max(1, Math.floor((T - gr - 2) / 2));
  const roofY = gr + 2 * N;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // ground floor: base course on the perimeter, floor slab inside
  S(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // storeys
  for (let s = 0; s < N; s++) {
    const base = gr + 2 * s;
    if (s > 0) S(x, base, z, perim ? "bricks" : "smooth_stone"); // floor slab / spandrel
    const wy = base + 1;
    if (perim) {
      const face = faces[0];
      const idx = face ? (face[0] !== 0 ? z : x) : 0;
      const win = !corner && idx % 3 !== 0;
      const isDoorCell = door && door[0] === x && door[1] === z;
      if (isDoorCell && s === 0) {
        // door is placed after the loop; keep the cell as brick here
        S(x, wy, z, "bricks");
      } else {
        S(x, wy, z, win ? "glass_pane" : "bricks");
      }
      if (win && !(isDoorCell && s === 0) && (idx + s) % 3 === 1 && face) {
        const ix = x - face[0], iz = z - face[1];
        if (inFp(ix, iz) && !isPerim(ix, iz)) {
          S(ix, wy, iz, s % 2 === 0 ? "glowstone" : "shroomlight");
        }
      }
    }
    // interior air behind glass
  }

  // roof slab
  S(x, roofY, z, perim ? "bricks" : "smooth_stone");
  if (perim) {
    for (let y = roofY + 1; y <= T - 2; y++) S(x, y, z, "bricks");
    S(x, T - 1, z, "smooth_stone"); // cornice
  } else if ((x * 3 + z * 5) % 13 === 0 && T - 2 >= roofY + 2) {
    // rooftop mechanical boxes, sitting on the flat roof
    S(x, roofY + 1, z, "light_gray_concrete");
    S(x, roofY + 2, z, "light_gray_concrete");
  }
}

// entrance: door on the low-z face, with a stone lintel above it
if (door) {
  const [dx0, dz0] = door;
  const gr = fp.get(`${dx0},${dz0}`).gr;
  const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
  S(dx0, gr, dz0, "oak_door", { ...props, half: "lower" });
  S(dx0, gr + 1, dz0, "oak_door", { ...props, half: "upper" });
  // stone surround: lintel and jambs so the entrance reads from the street
  S(dx0, gr + 2, dz0, "stone_bricks");
  for (const dx of [-1, 1]) {
    const jx = dx0 + dx;
    if (inFp(jx, dz0)) {
      S(jx, gr, dz0, "stone_bricks");
      S(jx, gr + 1, dz0, "stone_bricks");
    }
  }
}

g.save(`${DIR}/NYC3425340.nbt`);
