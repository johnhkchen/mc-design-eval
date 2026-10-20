import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858019";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), gr);

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p === undefined) g.set(x, y, z, id);
  else g.set(x, y, z, id, p);
};

const pane = (axis) =>
  axis === "NS"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Faces exposed to outside for a footprint cell
const exposedFaces = (x, z) =>
  ["W", "E", "N", "S"].filter((f) => {
    if (f === "W") return !map.has(key(x - 1, z));
    if (f === "E") return !map.has(key(x + 1, z));
    if (f === "N") return !map.has(key(x, z - 1));
    return !map.has(key(x, z + 1));
  });

// Front entrance on the west (long) face, mid-depth
const doorZ = minZ + Math.floor((maxZ - minZ + 1) / 2);

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Floors per storey and the roof deck (interior; edges overwritten below)
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 11, z, "smooth_stone");
}

for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length === 0) continue;

  const face = faces[0];
  const corner = faces.length >= 2;
  const along = face === "W" || face === "E" ? "NS" : "EW";
  const t = along === "NS" ? z - minZ : x - minX;
  const pier = corner || t % 3 === 0;
  const isDoor = face === "W" && z === doorZ;
  const paneP = pane(along === "NS" ? "NS" : "EW");

  for (let rel = 0; rel <= 13; rel++) {
    const y = gr + rel;
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }

    if (rel <= 3) {
      if (isDoor && rel === 1) {
        put(x, y, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && rel === 2) {
        put(x, y, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && rel === 3) { put(x, y, z, "glass_pane", paneP); continue; }
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }
      if (rel === 2 && (t + x + z) % 5 === 2) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "glass_pane", paneP);
      continue;
    }

    if (rel === 4 || rel === 5) { put(x, y, z, "smooth_quartz"); continue; }

    if (rel <= 10) {
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }
      if (rel === 6 || rel === 10) { put(x, y, z, "smooth_quartz"); continue; }
      if (rel === 8 && (t + x + z) % 4 === 1) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "glass_pane", paneP);
      continue;
    }

    if (rel === 11) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (rel === 12) { put(x, y, z, "white_concrete"); continue; }
  }
}

// Rooftop plant room, set back from the edges
for (const [x, z, gr] of cells) {
  const interior = exposedFaces(x, z).length === 0;
  if (!interior) continue;
  if (x >= minX + 2 && x <= minX + 5 && z >= minZ + 6 && z <= minZ + 12) {
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
