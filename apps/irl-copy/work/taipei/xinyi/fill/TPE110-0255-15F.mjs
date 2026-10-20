import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0255-15F";
const W = 14, H = 23, D = 38;
const TOP = 11;    // parapet top, 11 blocks above lowest ground (lidar)
const ROOF = 10;   // roof deck / cornice level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerimeter = (x, z) =>
  !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

// facade palette: light spandrels and quartz so the walls read against dusk sky
const SPANDREL = "smooth_quartz";
const FRAME = "light_gray_concrete";
const PILLAR = "quartz_pillar";
const PLINTH = "polished_andesite";

for (const [x, z, G0] of cells) {
  const G = Math.max(0, Math.min(G0, TOP));

  let nx = 0, nz = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!has(x + dx, z + dz)) { nx += dx; nz += dz; }
  }
  const per = nx !== 0 || nz !== 0;
  const corner = nx !== 0 && nz !== 0;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // floor slab at the cell's ground level, polished plinth on the street edge
  if (G <= TOP) put(x, G, z, per ? PLINTH : "smooth_stone");

  for (let y = G + 1; y <= TOP; y++) {
    if (y === TOP) {
      if (per) put(x, y, z, SPANDREL);                           // parapet
      else if (x % 4 === 1 && z % 8 === 3 && G <= TOP - 1)
        put(x, y, z, FRAME);                                     // roof plant boxes
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, per ? FRAME : "smooth_stone");                // cornice / roof deck
      continue;
    }

    const rel = y - G;
    if (rel === 5) { put(x, y, z, "smooth_stone"); continue; }   // storey slab
    if (!per) continue;                                           // interior air

    if (corner) { put(x, y, z, PILLAR); continue; }               // corner pillar

    const band0 = rel <= 4;
    const idx = nz !== 0 ? x : z;                // position along the facade
    const mullion = idx % 3 === 0;
    const isWin = band0 ? (rel >= 1 && rel <= 3) : (rel >= 6 && rel <= 8);

    // entrance on the south (+z) facade, centred, three columns wide
    const isDoor = band0 && nz === 1 && Math.abs(x - 6) <= 1;
    if (isDoor) {
      const jamb = x === 5 || x === 7;
      if (rel === 4) {
        put(x, y, z, "smooth_stone");                            // canopy lintel
      } else if (jamb) {
        put(x, y, z, PILLAR);                                    // quartz door jambs
      } else if (rel === 3 && x === 6) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); // entrance light
      } else if (rel === 1 || rel === 2) {
        put(x, y, z, "glass");                                   // glass doors
      } else {
        put(x, y, z, "light_blue_stained_glass");                // transom
      }
      continue;
    }

    if (!isWin) { put(x, y, z, SPANDREL); continue; }            // spandrel

    if (mullion) {
      put(x, y, z, FRAME);
    } else {
      put(x, y, z, band0 ? "glass" : "light_blue_stained_glass");
      // warm light behind panes, more often at street level
      const every = band0 ? 3 : 5;
      if ((idx + rel) % every === 0) {
        const ix = x - nx, iz = z - nz;
        if (has(ix, iz) && !isPerimeter(ix, iz)) put(ix, y, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
