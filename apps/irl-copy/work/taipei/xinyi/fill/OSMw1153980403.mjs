import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980403";
const W = 29, H = 23, D = 13;

// Record: 2-storey 1980s Taipei commercial block: cream tile facade, red sign band,
// blue-tinted upper glazing, shopfront on the ground floor, flat roof with plant.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => ({ x, z, g: Math.round(gr) }));
if (cells.length === 0) throw new Error("no footprint cells");

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map((c) => [key(c.x, c.z), c]));
const minX = Math.min(...cells.map((c) => c.x));
const maxX = Math.max(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));
const B = Math.min(...cells.map((c) => c.g));   // lowest ground under footprint
const CAP = B + 10;                              // top of roof slab
const PAR = CAP + 1;                             // parapet / plant level

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => map.has(key(x, z));

// Outward face of an exterior cell; (dx,dz) points inward.
function faceOf(c) {
  if (!has(c.x, c.z - 1)) return { f: "north", dx: 0, dz: 1, k: c.x - minX };
  if (!has(c.x, c.z + 1)) return { f: "south", dx: 0, dz: -1, k: c.x - minX };
  if (!has(c.x - 1, c.z)) return { f: "west", dx: 1, dz: 0, k: c.z - minZ };
  if (!has(c.x + 1, c.z)) return { f: "east", dx: -1, dz: 0, k: c.z - minZ };
  return null;
}

// Entrance: on the north (street) face, nearest the middle of the frontage.
const midK = (maxX - minX) / 2;
let doorCell = null;
{
  const cand = cells
    .map((c) => ({ c, f: faceOf(c) }))
    .filter((o) => o.f && o.f.f === "north")
    .sort((a, b) => Math.abs(a.f.k - midK) - Math.abs(b.f.k - midK));
  if (cand.length) doorCell = { ...cand[0].c, face: cand[0].f };
}

for (const c of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone");

  const f = faceOf(c);

  if (!f) {
    // Interior: floor slabs per storey, roof deck, rooftop plant. No interior fit-out.
    put(c.x, c.g, c.z, "smooth_quartz");
    if (B + 5 > c.g) put(c.x, B + 5, c.z, "smooth_quartz");
    if (CAP > c.g) put(c.x, CAP, c.z, "light_gray_concrete");
    if (PAR <= H - 1) {
      if ((c.x + 2 * c.z) % 9 === 0) put(c.x, PAR, c.z, "iron_block");
      else if ((c.x * 3 + c.z) % 7 === 3) put(c.x, PAR, c.z, "moss_block");
    }
    continue;
  }

  const isDoor = doorCell && c.x === doorCell.x && c.z === doorCell.z;

  // Facade column from the ground cell up to the cornice.
  for (let y = c.g; y <= CAP; y++) {
    const rel = y - B;
    let id = null;
    let props;

    if (y === c.g) {
      id = "stone_bricks";                       // base course
    } else if (rel === 4) {
      id = "red_terracotta";                     // sign band over shopfront
    } else if (rel === 5 || rel === 9) {
      id = "smooth_quartz";                      // storey lines / lintel
    } else if (rel === 10) {
      id = "light_gray_concrete";                // cornice
    } else if (rel >= 1 && rel <= 3) {
      id = f.k % 3 === 0 ? "smooth_quartz" : "glass";
      if (f.k % 3 !== 0 && rel === 2 && f.k % 6 === 4) {
        // warm light behind shopfront glass
        const ic = map.get(key(c.x + f.dx, c.z + f.dz));
        if (ic && ic.g <= B + 2) put(ic.x, B + 2, ic.z, "glowstone");
      }
    } else if (rel >= 6 && rel <= 8) {
      id = f.k % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
      if (f.k % 3 !== 0 && rel === 7 && f.k % 6 === 1) {
        const ic = map.get(key(c.x + f.dx, c.z + f.dz));
        if (ic && ic.g <= B + 7) put(ic.x, B + 7, ic.z, "glowstone");
      }
    }

    if (isDoor && (y === c.g + 1 || y === c.g + 2)) {
      props = {
        facing: doorCell.face.f,
        half: y === c.g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      put(c.x, y, c.z, "dark_oak_door", props);
      continue;
    }

    if (id) put(c.x, y, c.z, id);
  }

  if (isDoor && c.g + 3 < B + 4) {
    // hanging lantern under the sign band
    put(c.x, c.g + 3, c.z, "lantern", { hanging: "true" });
  }

  // Parapet ring on the roof edge.
  if (PAR <= H - 1) put(c.x, PAR, c.z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
