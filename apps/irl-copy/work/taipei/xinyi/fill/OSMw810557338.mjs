import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw810557338";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 346, H = 23, D = 38;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Safe setter: skips anything outside the volume
function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Pane connection states for a window running along the face axis
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Station: two storeys of cream precast and bronze-grey glazing, granite base,
// clear-glass entrance bays on the z-minimum (front) face, a granite cornice
// and quartz parapet, a skylit concourse roof, and warm glow behind some windows.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const B1 = gr + 1;   // storey 1 base (ground-floor slab)
  const B2 = gr + 6;   // storey 2 base
  const R = gr + 11;   // roof slab
  const P = gr + 12;   // parapet

  const zN = !has(x, z - 1);
  const zS = !has(x, z + 1);
  const xW = !has(x - 1, z);
  const xE = !has(x + 1, z);
  const edge = zN || zS || xW || xE;

  if (!edge) {
    // Interior: floor slabs per storey, air gap otherwise, support columns, roof
    put(x, B1, z, "light_gray_concrete");
    put(x, B2, z, "light_gray_concrete");
    if (x % 8 === 0 && z % 8 === 4) {
      for (let y = B1 + 1; y < R; y++) put(x, y, z, "quartz_pillar");
    }
    if (x % 20 >= 8 && x % 20 <= 11 && z >= 10 && z <= 27) {
      put(x, R, z, "light_blue_stained_glass"); // concourse skylight
    } else {
      put(x, R, z, "light_gray_concrete");
    }
    // Rooftop plant boxes
    if (x % 40 >= 24 && x % 40 <= 28 && z >= 12 && z <= 14) {
      put(x, R + 1, z, "smooth_stone");
    }
    continue;
  }

  // Edge cell: exterior shell
  const corner = (zN || zS) && (xW || xE);
  const alongX = zN || zS;               // face runs along x
  const u = alongX ? x : z;              // position along the face
  const pier = corner || u % 4 === 0;
  const entrance = alongX && zN && !corner && (u % 48 >= 20 && u % 48 <= 23);
  const dz = zN ? 1 : -1;                // inward direction for x-faces
  const dx = xW ? 1 : -1;                // inward direction for z-faces
  const paneProps = alongX ? PANE_X : PANE_Z;

  for (const b of [B1, B2]) {
    for (let dy = 0; dy <= 4; dy++) {
      const y = b + dy;
      let block;
      let props;
      if (dy === 0) {
        block = b === B1 ? "polished_granite" : "light_gray_concrete";
      } else if (dy === 4) {
        block = "light_gray_concrete";
      } else if (pier) {
        block = "white_concrete";
      } else if (entrance && b === B1) {
        block = "light_blue_stained_glass";
      } else {
        block = "light_blue_stained_glass_pane";
        props = paneProps;
      }
      put(x, y, z, block, props);
    }

    // Warm light behind some upper-storey windows (in the interior air gap)
    if (b === B2 && !pier && !entrance && u % 12 === 5) {
      const ix = alongX ? x : x + dx;
      const iz = alongX ? z + dz : z;
      if (has(ix, iz)) put(ix, b + 2, iz, "glowstone");
    }
  }

  // Cornice and parapet
  put(x, R, z, "polished_granite");
  put(x, P, z, "quartz_block");
}

g.save(`${DIR}/${ID}.nbt`);
