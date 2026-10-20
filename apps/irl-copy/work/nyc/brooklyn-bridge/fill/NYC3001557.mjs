import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001557";

// [x, z, ground, roof] per footprint cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2], r: c[3] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g, r: c.roof ?? c.r }
);

const W = 10, H = 25, D = 4;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => cellMap.has(key(x, z));

const minX = Math.min(...cells.map((c) => c.x));
const maxX = Math.max(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));
const maxZ = Math.max(...cells.map((c) => c.z));

// Flat, clean massing: one roof tier from the median lidar roof height.
const roofs = cells.map((c) => c.r).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const ROOF = clamp(Math.round(medRoof), 8, H - 2);

const BAND = "smooth_sandstone";   // brownstone string courses / cornice
const FRONT = "brown_terracotta";  // brownstone street facade
const BACK = "bricks";             // brick rear and sides
const BASE = "stone_bricks";       // foundation / plinth
const FLOOR = "smooth_stone";      // interior floor slabs
const GLASS = "glass_pane";

const paneProps = (ew) => ({
  east: ew ? "true" : "false",
  west: ew ? "true" : "false",
  north: "false",
  south: "false",
  waterlogged: "false",
});

const lights = [];
const stoop = []; // [x, y, z] front stoop steps

for (const c of cells) {
  const { x, z } = c;
  const gy = clamp(Math.round(c.g), 0, ROOF - 4);
  const top = ROOF;

  const front = !has(x, z - 1); // street side (low z)
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const exterior = front || back || left || right;
  const xi = x - minX;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, BASE);

  for (let y = gy; y < top; y++) {
    const dy = y - gy;
    const k = Math.floor(dy / 3);
    const r = dy % 3;

    if (!exterior) {
      // Interior: floor slabs only, air elsewhere (gap behind glass).
      if (r === 0 || y === top - 1) g.set(x, y, z, FLOOR);
      continue;
    }

    const faceFB = front || back;
    const mat = faceFB ? (front ? FRONT : BACK) : BACK;

    if (r === 0) {
      // Storey line / base course.
      g.set(x, y, z, dy === 0 ? BASE : BAND);
      continue;
    }

    if (faceFB) {
      const openingCol = xi >= 1 && xi <= W - 2 && xi % 3 !== 0;
      const isDoor = front && k === 0 && x === minX + 4;
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (openingCol) {
        g.set(x, y, z, GLASS, paneProps(true));
        // Warm light behind some panes, on the first row of each storey.
        if (r === 1 && k >= 1 && (xi + k) % 2 === 0) {
          const iz = front ? z + 1 : z - 1;
          if (has(x, iz)) lights.push([x, y, iz]);
        }
        continue;
      }
      g.set(x, y, z, mat);
    } else {
      // Party/side walls: solid brick.
      g.set(x, y, z, BACK);
    }
  }

  // Cornice: capping course on exterior cells.
  if (exterior) {
    g.set(x, top - 1, z, BAND);
  }

  // Entrance stoop: three steps up to the door on the street row,
  // rising toward the building (lower side faces the street, north).
  if (front && x >= minX + 3 && x <= minX + 5) {
    stoop.push([x, gy, z]);
  }
}

for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

for (const [x, y, z] of stoop) {
  g.set(x, y, z, "stone_brick_stairs", {
    facing: "north",
    half: "bottom",
    shape: "straight",
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
