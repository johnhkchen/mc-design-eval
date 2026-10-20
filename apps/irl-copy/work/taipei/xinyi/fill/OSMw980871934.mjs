import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, 1980s Taipei: white tiled concrete
// frame, blue-tinted aluminium glazing above, clear shopfront below, a
// granite base course, a quartz cornice and parapet, and a rooftop plant room.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871934";
const W = 24, H = 23, D = 35;
const ROOF_Y = 11;

const raw = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(`${x},${z}`, Math.max(0, Math.min(17, Math.round(gr))));
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const cells = [...cellMap].map(([k, g]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g };
});

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxG = 0;
for (const { x, z, g } of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  maxG = Math.max(maxG, g);
}

// Flat roof at a common height; leave room for at least a storey on the highest cell.
const R = Math.min(20, Math.max(ROOF_Y, maxG + 3));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const edgeDirs = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Main entrance: a single-facing north cell nearest the middle of the north wall.
const mid = (minX + maxX) / 2;
let entry = null;
for (const c of cells) {
  const ed = edgeDirs(c.x, c.z);
  if (ed.length === 1 && ed[0] === "N") {
    if (!entry || Math.abs(c.x - mid) < Math.abs(entry.x - mid)) entry = c;
  }
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

for (const { x, z, g } of cells) {
  const dirs = edgeDirs(x, z);
  const edge = dirs.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: one at ground, then every 5 blocks while a full storey fits under the roof.
  const fbs = [];
  for (let b = g; b <= R - 5; b += 5) fbs.push(b);
  if (fbs.length === 0) fbs.push(g);

  for (let i = 0; i < fbs.length; i++) {
    const fb = fbs[i];
    if (!edge) put(x, fb, z, "smooth_stone");
    else put(x, fb, z, fb === g ? "polished_granite" : "white_concrete");

    const top = i + 1 < fbs.length ? fbs[i + 1] - 1 : R - 1;
    if (!edge) continue;

    const d = dirs[0];
    const ns = d === "N" || d === "S";
    const t = ns ? x - minX : z - minZ;
    const wallLen = ns ? maxX - minX : maxZ - minZ;
    const corner = dirs.length > 1;
    const pier = corner || t % 4 === 0 || t === wallLen;
    const ground = i === 0;
    const isEntry = entry !== null && entry.x === x && entry.z === z;

    for (let y = fb + 1; y <= top; y++) {
      // Entrance: double door with a slim canopy strip above.
      if (isEntry && ground && (y === fb + 1 || y === fb + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === fb + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isEntry && ground && y === fb + 3) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }

      // Warm light sitting on the interior floor, just behind the window bay.
      if (y === fb + 1 && !pier) {
        const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
        if (has(ix, iz) && edgeDirs(ix, iz).length === 0) {
          if (ground && t % 8 === 2) {
            put(ix, y, iz, "shroomlight");
          } else if (!ground && (t + i) % 3 === 1) {
            put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
          }
        }
      }

      // Concrete frame: cap, piers, and upper spandrel.
      if (y === top || pier || (!ground && y === fb + 1)) {
        put(x, y, z, "white_concrete");
        continue;
      }

      // Glazing: clear shopfront glass below, blue-tinted glass above, framed by piers.
      const paneId = ground ? "glass_pane" : "light_blue_stained_glass_pane";
      const props = ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, paneId, props);
    }
  }

  // Roof: quartz cornice and white parapet on the edge, concrete roof slab inside.
  put(x, R, z, edge ? "smooth_quartz" : "light_gray_concrete");
  if (edge) put(x, R + 1, z, "white_concrete");
}

// Rooftop plant room, inset from the parapet.
for (let x = minX + 5; x <= maxX - 5; x++) {
  for (let z = minZ + 8; z <= maxZ - 8; z++) {
    if (!has(x, z)) continue;
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
  }
}

vox.save(`${BASE}/${ID}.nbt`);
