import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87338.cells.json`, "utf8"));

const W = 25, H = 31, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 6, Math.round(gr)));
  let roof = Math.max(ground + 4, Math.min(H - 3, Math.round(rf)));
  // Quantize to whole storeys (3 blocks) so massing forms clean tiers
  const n = Math.max(2, Math.round((roof - ground) / 3));
  roof = Math.min(H - 3, ground + 3 * n);
  cellMap.set(key(x, z), { gr: ground, rf: roof });
}

const inFoot = (x, z) => cellMap.has(key(x, z));
const faceZ = (x, z) => !inFoot(x, z - 1) || !inFoot(x, z + 1); // north/south face
const faceX = (x, z) => !inFoot(x - 1, z) || !inFoot(x + 1, z); // east/west face
const exposed = (x, z) => faceZ(x, z) || faceX(x, z);

// Piers follow the face the cell lies on: bays are counted along the wall
function isPier(x, z) {
  if (faceZ(x, z)) return x % 3 === 0;
  return z % 3 === 0;
}

// Entrance on the minimum-z face, near its middle
const overrides = new Map();
{
  const perim = [];
  for (const [k] of cellMap) {
    const [x, z] = k.split(",").map(Number);
    if (exposed(x, z)) perim.push([x, z]);
  }
  if (perim.length) {
    const minZ = Math.min(...perim.map(([, z]) => z));
    const xs = perim.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
    const dx = xs[Math.floor(xs.length / 2)];
    const c = cellMap.get(key(dx, minZ));
    if (c) {
      const gr = c.gr;
      overrides.set(`${dx},${gr},${minZ}`, {
        n: "dark_oak_door",
        props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" },
      });
      overrides.set(`${dx},${gr + 1},${minZ}`, {
        n: "dark_oak_door",
        props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" },
      });
      overrides.set(`${dx},${gr + 2},${minZ}`, {
        n: "lantern",
        props: { hanging: "true", waterlogged: "false" },
      });
      for (const ox of [dx - 2, dx + 2]) {
        if (inFoot(ox, minZ)) {
          overrides.set(`${ox},${gr + 2},${minZ}`, {
            n: "lantern",
            props: { hanging: "true", waterlogged: "false" },
          });
        }
      }
    }
  }
}

// Block decision for a voxel position
function place(x, z, y) {
  const c = cellMap.get(key(x, z));
  if (!c) return null;
  const { gr, rf } = c;
  if (y < gr) return { n: "stone_bricks" };
  if (y >= rf) return null;
  if (y === rf - 1) return { n: "smooth_stone" };          // cornice cap
  if (y === rf - 2) return { n: "chiseled_stone_bricks" }; // cornice band

  const exp = exposed(x, z);
  const k = Math.floor((y - gr) / 3);
  const r = (y - gr) % 3;

  if (!exp) {
    // Interior: floor slabs only, air otherwise
    return r === 0 ? { n: "white_concrete" } : null;
  }

  const pier = isPier(x, z);

  if (k === 0) {
    // Ground storey: granite base band and shopfront glazing
    if (r === 0 || pier) return { n: "polished_granite" };
    return { n: "light_blue_stained_glass" };
  }

  if (r === 0) return { n: "white_concrete" };   // spandrel / floor band
  if (pier) return { n: "white_concrete" };      // mullion
  if (r === 2 && k >= 1 && ((x * 3 + z * 5 + k) % 7 === 0)) {
    return { n: "glowstone" };                   // warm lit window
  }
  return { n: "light_blue_stained_glass_pane", pane: true };
}

function paneProps(x, y, z) {
  const side = (dx, dz) => {
    const b = place(x + dx, z + dz, y);
    return b && b.pane ? "true" : "false";
  };
  return {
    north: side(0, -1),
    south: side(0, 1),
    east: side(1, 0),
    west: side(-1, 0),
    waterlogged: "false",
  };
}

const footCells = [];
for (const [k] of cellMap) footCells.push(k.split(",").map(Number));

// Massing
for (const [x, z] of footCells) {
  const c = cellMap.get(key(x, z));
  for (let y = 0; y < c.rf; y++) {
    const ov = overrides.get(`${x},${y},${z}`);
    if (ov) {
      g.set(x, y, z, ov.n, ov.props);
      continue;
    }
    const b = place(x, z, y);
    if (!b) continue;
    if (b.pane) g.set(x, y, z, b.n, paneProps(x, y, z));
    else g.set(x, y, z, b.n);
  }
}

// Rooftop plant: one compact mechanical block on the highest interior roof
{
  let maxRf = 0;
  for (const [, c] of cellMap) if (c.rf > maxRf) maxRf = c.rf;
  const xs = footCells.map(([x]) => x);
  const zs = footCells.map(([, z]) => z);
  const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const x = cx + dx, z = cz + dz;
      const c = cellMap.get(key(x, z));
      if (!c || c.rf !== maxRf || exposed(x, z)) continue;
      for (let y = c.rf; y <= Math.min(H - 1, c.rf + 1); y++) {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/DC87338.nbt`);
