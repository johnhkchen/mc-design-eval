import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343879";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Two-storey low-rise commercial block: cream concrete shell, stone bands,
// shopfront glazing at ground, punched upper windows, flat parapet roof.
const W = 20, H = 23, D = 23;
const vox = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);
const isPer = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the +z street face, middle of that edge.
let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;
const frontXs = cells.filter(([x, z]) => z === maxZ && isPer(x, z)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = maxZ;

const roofEquip = (x, z) => (x * 5 + z * 3) % 13 === 0;

for (const [x, z, gr] of cells) {
  const per = isPer(x, z);
  const onXFace = !has(x - 1, z) || !has(x + 1, z);
  const corner = onXFace && (!has(x, z - 1) || !has(x, z + 1));
  const t = onXFace ? z : x;
  const pillar = corner || t % 3 === 0;
  const isDoor = per && x === doorX && z === doorZ;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  // Shell from ground to parapet (roof at y=10, parapet at y=11).
  for (let y = gr; y <= 11; y++) {
    if (!per) {
      if (y === gr || y === 5 || y === 10) vox.set(x, y, z, "light_gray_concrete");
      else if (y === 11 && roofEquip(x, z)) vox.set(x, y, z, "iron_block");
      continue;
    }

    if (isDoor) {
      if (y === gr) vox.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 1) vox.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 4 || y === 5 || y === 9 || y === 10) vox.set(x, y, z, "smooth_stone");
      else if (y === 11) vox.set(x, y, z, "white_concrete");
      else if (y > 5 && y < 9) vox.set(x, y, z, "light_gray_concrete");
      else if (y >= gr + 2 && y < 4) vox.set(x, y, z, "white_concrete");
      continue;
    }

    if (y === gr) vox.set(x, y, z, "polished_andesite");           // base course
    else if (y === 11) vox.set(x, y, z, "white_concrete");          // parapet
    else if (y === 10) vox.set(x, y, z, "smooth_stone");           // cornice
    else if (y === 9 || y === 5) vox.set(x, y, z, "smooth_stone"); // storey bands
    else if (y === 4) vox.set(x, y, z, "smooth_stone");            // shopfront lintel
    else if (y > gr && y < 4) {                                     // shopfront glazing
      if (pillar) vox.set(x, y, z, "white_concrete");
      else vox.set(x, y, z, "glass_pane");
    } else if (y >= 6 && y <= 8) {                                  // upper windows
      if (pillar) vox.set(x, y, z, "light_gray_concrete");
      else vox.set(x, y, z, "glass_pane");
    }
  }
}

// Interior: warm lights standing on floor slabs, behind some windows.
const inward = (x, z) => {
  if (has(x + 1, z) && !isPer(x + 1, z)) return [1, 0];
  if (has(x - 1, z) && !isPer(x - 1, z)) return [-1, 0];
  if (has(x, z + 1) && !isPer(x, z + 1)) return [0, 1];
  if (has(x, z - 1) && !isPer(x, z - 1)) return [0, -1];
  return null;
};

for (const [x, z, gr] of cells) {
  if (!isPer(x, z)) continue;
  if (x === doorX && z === doorZ) continue;
  const onXFace = !has(x - 1, z) || !has(x + 1, z);
  const corner = onXFace && (!has(x, z - 1) || !has(x, z + 1));
  if (corner) continue;
  const t = onXFace ? z : x;
  if (t % 3 === 0) continue; // pillar column, no window
  const d = inward(x, z);
  if (!d) continue;
  const [dx, dz] = d;
  const ix = x + dx, iz = z + dz;
  // Upper storey lights on the slab at y=5 (light at y=6).
  if (t % 4 === 1) vox.set(ix, 6, iz, "glowstone");
  // Ground storey lights on the floor at gr (light at gr+1).
  if (t % 4 === 2) vox.set(ix, gr + 1, iz, "glowstone");
}

vox.save(`${dir}/${id}.nbt`);
