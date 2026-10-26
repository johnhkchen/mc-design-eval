import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 901 15th St NW, Commercial-Office-Large, 12 x 4 footprint.
// Late-1970s/1980s stone-clad office: calcite piers and spandrels, tinted glass
// window bands, stone base with shopfront, double entrance on the south face,
// parapet, and a central mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86591.cells.json`, "utf8"));

const W = 12, D = 4, H = 28;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Index footprint: [x, z, ground, roof]
const byKey = new Map();
for (const row of cells) {
  const [x, z, ground, roof] = row;
  byKey.set(`${x},${z}`, { gr: ground, rf: roof });
}

// Smooth lidar roofs into flat tiers on the 3-block storey rhythm (3k+1).
// 16 stays 16; noisy values snap to the nearest tier.
function tierRoof(rf, gr) {
  let t = 3 * Math.round((rf - 1) / 3) + 1;
  if (t < gr + 3) t = gr + 3;
  if (t > H - 3) t = H - 3;
  return t;
}

// Tallest tier across the footprint, for the penthouse
let maxRf = 0;
for (const c of byKey.values()) maxRf = Math.max(maxRf, tierRoof(c.rf, c.gr));

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = byKey.get(`${x},${z}`);
    if (!c) continue;

    const gr = c.gr;
    const rf = tierRoof(c.rf, gr);

    const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    // Horizontal index along the face this cell sits on
    const u = (z === 0 || z === D - 1) ? x : z;
    const pier = corner || u % 2 === 0;

    // Foundation: solid from y 0 up to this cell's ground
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    for (let y = gr; y < rf; y++) {
      // Roof cover
      if (y === rf - 1) {
        put(x, y, z, edge ? "calcite" : "light_gray_concrete");
        continue;
      }
      // Cornice band under the parapet
      if (y === rf - 2 && edge) {
        put(x, y, z, "smooth_quartz");
        continue;
      }
      // Floor slabs on the storey rhythm
      if (y % 3 === 0 && y > gr) {
        put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
        continue;
      }
      // Front entrance: double doors on the south face, ground storey
      if (z === D - 1 && (x === 5 || x === 6) && y - gr < 2) {
        const half = (y - gr) === 0 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "south",
          half,
          hinge: x === 5 ? "left" : "right",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (!edge) {
        // Interior: z=1 is the air gap behind the glass (warm lights in some bays),
        // z=2 is solid structural core so the building reads as mass, not a shell.
        if (z === 1) {
          if (y % 3 === 1 && x % 3 === 1 && y - gr >= 2) {
            put(x, y, z, "glowstone");
          }
        } else {
          put(x, y, z, "light_gray_concrete");
        }
        continue;
      }
      // Facade
      if (corner) {
        put(x, y, z, "calcite");
        continue;
      }
      if (y - gr < 2) {
        // Shopfront at grade
        put(x, y, z, pier ? "calcite" : "light_blue_stained_glass");
        continue;
      }
      if (y % 3 === 1) {
        // Window band: tinted glass between calcite mullions
        put(x, y, z, pier ? "calcite" : "light_blue_stained_glass");
      } else {
        // Spandrel band
        put(x, y, z, "smooth_quartz");
      }
    }

    // Central mechanical penthouse on the tallest tier
    if (rf === maxRf && x >= 4 && x <= 7 && z >= 1 && z <= 2) {
      put(x, rf, z, "calcite");
      put(x, rf + 1, z, "calcite");
      put(x, rf + 2, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/DC86591.nbt`);
