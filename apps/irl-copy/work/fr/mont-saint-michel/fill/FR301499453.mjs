import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499453.cells.json`, "utf8"));

// Footprint 19 x 16, roof about 10 above y0. Two storeys of stone walls with
// glazed bays, a dark slate gable running east-west, and an arched-looking
// entrance on the south face.
const W = 19, H = 22, D = 16;
const g = new Voxels([W, H, D]);

const inside = new Set(cells.map(c => c[0] + "," + c[1]));
const has = (x, z) => inside.has(x + "," + z);

const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const ridge0 = Math.min(12, Math.max(9, Math.round(med)));

const zMax = Math.max(...cells.map(c => c[1]));
const southCells = cells.filter(c => c[1] === zMax).map(c => c[0]).sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false"
});

for (const [x, z, groundRaw] of cells) {
  const G = Math.max(0, Math.round(groundRaw));

  // Foundation: solid granite from y0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "granite");

  // Eave and storey structure, smoothed to flat tiers.
  const eave = Math.min(H - 8, Math.max(G + 7, ridge0 - 3));
  const wallH = eave - G;
  const rise = Math.max(2, Math.min(5, (ridge0 + 1) - eave));

  // Gable roof sloping toward the north and south eaves.
  const e = Math.min(z, zMax - z);
  const top = Math.min(H - 1, eave + Math.min(rise, Math.round((e + 0.5) * rise / 8)));
  for (let y = eave; y <= top; y++) g.set(x, y, z, "deepslate_tiles");

  const outer = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  if (outer) {
    // Shell wall, one block thick, with glazing and storey lines.
    for (let y = G; y < eave; y++) {
      const r = y - G;
      let id = "stone_bricks";
      if (r === 4) id = "smooth_stone";            // first floor line
      if (r === wallH - 1) id = "stone_bricks";    // cornice course

      // Entrance door on the south face.
      if (z === zMax && x === doorX && (r === 1 || r === 2)) {
        g.set(x, y, z, "oak_door", doorProps(r === 1 ? "lower" : "upper"));
        continue;
      }

      const bay = (x + z) % 3 === 1;
      const groundBay = r >= 1 && r <= 2;
      const upperBay = r >= 5 && r <= wallH - 2;
      if (bay && (groundBay || upperBay) && r !== 4) {
        if (((x * 2 + z) % 7 === 1) && r === 2) {
          g.set(x, y, z, "glowstone");           // warm lit window
        } else {
          g.set(x, y, z, "glass_pane", { waterlogged: "false" });
        }
        continue;
      }
      g.set(x, y, z, id);
    }
  } else {
    // Interior mass: solid from the ground to the ceiling, so every floor
    // slab and ceiling rests on material beneath it.
    for (let y = G; y < eave; y++) {
      g.set(x, y, z, y === G + 4 ? "smooth_stone" : "stone_bricks");
    }
  }
}

g.save(`${DIR}/FR301499453.nbt`);
