import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980405";
const W = 21, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, Math.round(gr));
const F = Math.min(...gm.values());

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => gm.has(key(x, z));
const outs = (x, z) => Object.keys(DIRS).filter(d => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// Front door: edge cell facing south, median x; fallback to any edge cell.
let frontCands = cells.filter(([x, z]) => outs(x, z).includes("south")).sort((a, b) => a[0] - b[0]);
if (frontCands.length === 0) frontCands = cells.filter(([x, z]) => outs(x, z).length > 0).sort((a, b) => a[0] - b[0]);
const doorCell = frontCands[Math.floor(frontCands.length / 2)];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const paneProps = face => (face === "north" || face === "south")
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" };

// Foundation and envelope, cell by cell
for (const [x, z, grRaw] of cells) {
  const gc = Math.round(grRaw);
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const o = outs(x, z);
  const edge = o.length > 0;
  const corner = o.length > 1;
  const face = o[0];
  const isDoor = key(x, z) === doorKey;
  const along = (face === "north" || face === "south") ? x : z;
  const bay = edge && !corner && along % 3 === 1;

  // Storey floor slabs (ground, 2nd floor, roof) across all cells
  put(x, F + 0, z, "light_gray_concrete");
  put(x, F + 5, z, "light_gray_concrete");
  put(x, F + 10, z, "light_gray_concrete");

  // Ground storey, rel 1..4
  for (let rel = 1; rel <= 4; rel++) {
    if (!edge) { put(x, F + rel, z, "air"); continue; }
    if (isDoor) {
      if (rel === 1 || rel === 2) {
        const p = { facing: face, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        put(x, F + rel, z, "dark_oak_door", p);
      } else put(x, F + rel, z, "gray_concrete");
    } else if (bay) {
      if (rel === 1) put(x, F + rel, z, "polished_andesite");
      else if (rel === 4) put(x, F + rel, z, "gray_concrete");
      else put(x, F + rel, z, "glass_pane", paneProps(face));
    } else {
      if (rel === 1) put(x, F + rel, z, "polished_andesite");
      else put(x, F + rel, z, "smooth_quartz");
    }
  }

  // Storey string course at rel 5
  put(x, F + 5, z, edge ? "stone_bricks" : "light_gray_concrete");

  // Upper storey, rel 6..9
  for (let rel = 6; rel <= 9; rel++) {
    if (!edge) { put(x, F + rel, z, "air"); continue; }
    if (bay) {
      if (rel === 6) put(x, F + rel, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      else if (rel === 9) put(x, F + rel, z, "gray_concrete");
      else put(x, F + rel, z, "glass_pane", paneProps(face));
    } else {
      put(x, F + rel, z, "white_concrete");
    }
  }

  // Cornice rel 10, parapet rel 11
  if (edge) {
    put(x, F + 10, z, "stone_bricks");
    put(x, F + 11, z, "smooth_quartz");
  } else {
    put(x, F + 11, z, "air");
    // Roof plant box in the middle of the roof
    if (Math.abs(x - 10) <= 3 && Math.abs(z - 7) <= 2) {
      put(x, F + 11, z, "gray_concrete");
      put(x, F + 12, z, "smooth_stone");
    }
  }
}

// Warm lights behind some windows (inside the shell, never on the facade)
for (const [x, z] of cells) {
  const o = outs(x, z);
  if (o.length !== 1) continue;
  const face = o[0];
  const along = (face === "north" || face === "south") ? x : z;
  if (along % 3 !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || outs(ix, iz).length > 0) continue;
  if (along % 6 === 1) put(ix, F + 6, iz, "glowstone");
  else put(ix, F + 1, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
