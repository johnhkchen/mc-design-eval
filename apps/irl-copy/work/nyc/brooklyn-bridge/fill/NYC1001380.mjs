import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001380";
const W = 9, H = 27, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const key = (x, z) => `${x},${z}`;

// Per-cell ground (gr) and roof (R), snapped to even tiers.
const info = new Map();
for (const c of cells) {
  const [x, z, gr0, rf0] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = clamp(Math.round(gr0 ?? 0), 0, H - 8);
  const rfRaw = Number.isFinite(rf0) ? rf0 : 15;
  const R = clamp(2 * Math.round(rfRaw / 2), gr + 6, 25);
  info.set(key(x, z), { gr, R });
}

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !info.has(key(x + d.dx, z + d.dz)));
const alongIdx = (x, z, d) => (d.dz !== 0 ? x : z);

// Street frontage: south face if exposed, else the first exposed face found.
let doorDir = DIRS.find((d) => d.name === "south");
const hasFace = (d) => [...info.keys()].some((k) => {
  const [x, z] = k.split(",").map(Number);
  return exposed(x, z).some((e) => e.name === d.name);
});
if (!hasFace(doorDir)) doorDir = DIRS.find(hasFace);

const faceCells = [...info.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => exposed(x, z).some((d) => d.name === doorDir.name))
  .sort((a, b) => alongIdx(a[0], a[1], doorDir) - alongIdx(b[0], b[1], doorDir));
const doorCell = faceCells.length ? faceCells[Math.floor(faceCells.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const paneProps = (d) =>
  d.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const setSafe = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const windowCells = [];

for (const [k, { gr, R }] of info) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  const primary = ex[0];
  const corner = ex.length > 1;
  const along = primary ? alongIdx(x, z, primary) : 0;
  const isWin = perim && !corner && along % 2 === 1;
  const isDoor = perim && k === doorKey && primary && primary.name === doorDir.name;

  // Foundation: solid stone from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) setSafe(x, y, z, "stone_bricks");

  // Interior floor slabs at storey lines.
  const floorLines = [gr];
  for (let L = gr + 4; L < R - 1; L += 2) floorLines.push(L);
  for (const L of floorLines) {
    setSafe(x, L, z, perim ? (corner ? "stone_bricks" : "smooth_stone") : "smooth_stone");
  }

  if (perim) {
    for (let y = gr; y < R - 1; y++) {
      const off = y - gr;
      if (off === 0) {
        // Stone base course; the door cell gets a step instead.
        if (isDoor) setSafe(x, y, z, "stone_brick_stairs", { facing: doorDir.name, half: "bottom", shape: "straight", waterlogged: "false" });
        else setSafe(x, y, z, "stone_bricks");
      } else if (off <= 3) {
        // Ground floor: shopfront glazing, door, stone lintel at the top.
        if (off === 3) setSafe(x, y, z, "stone_bricks");
        else if (isDoor) {
          const half = off === 1 ? "lower" : "upper";
          setSafe(x, y, z, "dark_oak_door", {
            facing: doorDir.name, half, hinge: "left", open: "false", powered: "false",
          });
        } else if (isWin && primary) {
          setSafe(x, y, z, "glass_pane", paneProps(primary));
          windowCells.push({ x, y, z, d: primary });
        } else setSafe(x, y, z, "stone_bricks");
      } else if (off % 2 === 0) {
        // Storey belt course in stone.
        setSafe(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else {
        // Upper storeys: brick piers with window panes between.
        if (isWin && primary) {
          setSafe(x, y, z, "glass_pane", paneProps(primary));
          windowCells.push({ x, y, z, d: primary });
        } else setSafe(x, y, z, corner ? "stone_bricks" : "bricks");
      }
    }

    // Plain stone cornice with a single course above the roof.
    setSafe(x, R - 1, z, "stone_bricks");
    setSafe(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof surface on every footprint cell.
  setSafe(x, R - 1, z, "smooth_stone");
}

// Brick chimney stacks on a few interior roof cells.
for (const [k, { R }] of info) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).length) continue;
  if ((x * 3 + z * 5) % 23 === 0 && R <= 24) {
    setSafe(x, R, z, "bricks");
    setSafe(x, R + 1, z, "bricks");
  }
}

// Warm light behind a sparse set of windows.
for (const { x, y, z, d } of windowCells) {
  const ix = x - d.dx, iz = z - d.dz;
  if (!info.has(key(ix, iz))) continue;
  if (exposed(ix, iz).length) continue;
  if ((x + z + y) % 5 === 0) setSafe(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
