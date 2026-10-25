import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const id = "FR301499759";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 8, H = 22, D = 7;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const cmap = new Map();
for (const [x, z, gr, rf] of cells) cmap.set(`${x},${z}`, { x, z, gr: Math.round(gr), rf });
const has = (x, z) => cmap.has(`${x},${z}`);

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

// one flat roof level from the median lidar height
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const ridgeY = Math.round(med);
const eave = ridgeY - 4;
const centreZ = (minZ + maxZ) / 2;
const maxDist = Math.floor((maxZ - minZ) / 2);

const faces = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const isRing = (x, z) => faces.some((f) => !has(x + f.dx, z + f.dz));

const glassNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.round(c[2]);
  const ring = isRing(x, z);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (ring) {
    // walls: base course, granite shaft, storey course, cornice band
    for (let y = gr; y < eave; y++) {
      let b = "granite";
      if (y === gr) b = "stone_bricks";                 // plinth
      else if (y === gr + 5) b = "stone_bricks";        // storey course
      else if (y === eave - 1) b = "stone_bricks";      // cornice band
      put(x, y, z, b);
    }

    const outs = faces.filter((f) => !has(x + f.dx, z + f.dz));
    const f = outs[0];
    if (f) {
      const alongZ = f.name === "north" || f.name === "south";
      const idx = alongZ ? x - minX : z - minZ;
      const isDoor = f.name === "north" && z === minZ && idx === 4 && gr + 1 < eave;

      if (isDoor) {
        // stone-brick surround and lintel over the door
        put(x, gr + 2, z, "stone_bricks");
        put(x, gr, z, "spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 1, z, "spruce_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (idx % 2 === 1) {
        // window bands: sill on the plinth course, glass, lintel under the storey course
        const bands = [gr + 1, gr + 6].filter((s) => s + 2 < eave);
        for (const s of bands) {
          for (let y = s; y <= s + 2; y++) {
            put(x, y, z, "glass_pane", alongZ ? glassNS : glassEW);
          }
          if (idx % 4 === 1) {
            const ix = x - f.dx, iz = z - f.dz;
            if (has(ix, iz) && !isRing(ix, iz)) put(ix, s + 1, iz, "glowstone");
          }
        }
      }
    }
  } else {
    // interior: air cavity with a floor slab at the storey line
    if (gr + 5 < eave) put(x, gr + 5, z, "stone_bricks");
  }

  // roof: solid infill under the slate, gable profile running along x
  const dist = Math.min(z - minZ, maxZ - z);
  const top = eave + 1 + dist;
  for (let y = eave; y < top; y++) put(x, y, z, "granite");
  if (dist < maxDist) {
    const facing = z < centreZ ? "north" : "south";
    put(x, top, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    put(x, top, z, "deepslate_tiles");
  }
}

g.save(`${dir}/${id}.nbt`);
