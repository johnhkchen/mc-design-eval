import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001590";
const W = 15, H = 24, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { ground: gr, roof: rf });
const inside = (x, z) => map.has(`${x},${z}`);
const perimeter = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const corner = (x, z) => (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));
const zFace = (x, z) => (!inside(x, z - 1) || !inside(x, z + 1)) && !corner(x, z);
const xFace = (x, z) => (!inside(x - 1, z) || !inside(x + 1, z)) && !corner(x, z);

// flatten roof noise into clean tiers (even heights)
const roofs = cells.map(c => c[3]);
const mean = roofs.reduce((a, b) => a + b, 0) / roofs.length;
const mainR = Math.round(mean / 2) * 2;
const roofOf = (rf) => {
  let r = Math.round(rf / 2) * 2;
  if (Math.abs(r - mean) <= 2) r = mainR;
  return Math.min(H - 3, Math.max(4, r));
};

const DOOR_X = 4;
const SHOP_Z = 0;

const storeyInfo = new Map();

for (const [x, z, gr, rf] of cells) {
  const G = Math.max(0, Math.round(gr));
  const R = roofOf(rf);
  storeyInfo.set(`${x},${z}`, { G, R });

  // foundation up to ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const per = perimeter(x, z);
  const cor = corner(x, z);

  for (let y = G; y < R; y++) {
    const j = y - G;

    if (!per) {
      // interior: floor slabs each storey, roof deck on top, hollow air between
      if (y === R - 1) g.set(x, y, z, "stone");
      else if (j % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // perimeter shell
    if (y === R - 1) { g.set(x, y, z, "stone_bricks"); continue; }      // parapet
    if (y === R - 2) { g.set(x, y, z, "smooth_sandstone"); continue; }  // cornice
    if (j === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (j % 2 === 0) {                                                  // spandrel rows
      g.set(x, y, z, j % 6 === 0 ? "smooth_sandstone" : "bricks");      // sandstone string course every 3rd storey
      continue;
    }

    // window row (j odd)
    if (z === SHOP_Z && j === 1) {
      if (x === DOOR_X) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (cor) {
        g.set(x, y, z, "bricks");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }
    if (z === SHOP_Z && j === 2 && x === DOOR_X) {
      g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (cor) { g.set(x, y, z, "bricks"); continue; }
    if (zFace(x, z) && x % 3 === 0) { g.set(x, y, z, "bricks"); continue; } // brick piers
    g.set(x, y, z, "glass");
  }

  // rooftop chimneys on a few perimeter cells
  if (per && !cor && (x + z) % 7 === 3 && R + 2 <= H) {
    g.set(x, R, z, "bricks");
    g.set(x, R + 1, z, "bricks");
  }
}

// warm light behind some windows
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!perimeter(x, z) || corner(x, z)) continue;
  if (z === SHOP_Z) continue;
  const { G, R } = storeyInfo.get(`${x},${z}`);
  let ix = x, iz = z;
  if (zFace(x, z)) iz = z === 0 ? 1 : (z === D - 1 ? D - 2 : z);
  if (xFace(x, z)) ix = x === 0 ? 1 : (x === W - 1 ? W - 2 : x);
  if (!inside(ix, iz) || perimeter(ix, iz)) continue;
  for (let k = 0; ; k++) {
    const y = G + 2 * k + 1;
    if (y >= R - 2) break;
    if ((x + k) % 4 === 1) {
      g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
