import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70244.cells.json`, "utf8"));

const W = 4, H = 15, D = 8;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Clamp grounds, then smooth the lidar roof into one flat parapet height.
const raw = cells.map(([x, z, gr0, rf0]) => ({
  x, z,
  gr: clamp(Math.round(gr0), 0, H - 7),
  rf0: Math.round(rf0),
}));
const rfs = raw.map(c => c.rf0).sort((a, b) => a - b);
const target = clamp(rfs[Math.floor(rfs.length / 2)], 5, H - 1);

const cellMap = new Map();
for (const c of raw) {
  const rf = clamp(Math.max(target, c.gr + 5), 0, H - 1);
  cellMap.set(key(c.x, c.z), { x: c.x, z: c.z, gr: c.gr, rf });
}
const has = (x, z) => cellMap.has(key(x, z));

// Door: on the street (z-min) face, nearest the middle of the front.
let door = null;
for (const c of cellMap.values()) {
  if (has(c.x, c.z - 1)) continue;
  const score = Math.abs(c.x - 1.5);
  if (!door || score < door.score) door = { ...c, score };
}

// Pass 1: massing, foundation, base course, cornice, cap.
for (const { x, z, gr, rf } of cellMap.values()) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  g.set(x, gr, z, perim ? "stone_bricks" : "bricks");
  for (let y = gr + 1; y <= rf - 2; y++) g.set(x, y, z, "bricks");

  // Cornice course, then a flat cap (slab on edges, smooth stone inside).
  g.set(x, rf - 2, z, perim ? "stone_bricks" : "bricks");
  if (perim) {
    g.set(x, rf - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, rf - 1, z, "smooth_stone");
  }
}

// Pass 2: openings on the perimeter, door on the street face.
for (const { x, z, gr, rf } of cellMap.values()) {
  const faces = [];
  if (!has(x, z - 1)) faces.push({ dx: 0, dz: -1, axis: "z", idx: x });
  if (!has(x, z + 1)) faces.push({ dx: 0, dz: 1, axis: "z", idx: x });
  if (!has(x - 1, z)) faces.push({ dx: -1, dz: 0, axis: "x", idx: z });
  if (!has(x + 1, z)) faces.push({ dx: 1, dz: 0, axis: "x", idx: z });

  for (const f of faces) {
    const isDoor = door && x === door.x && z === door.z && f.dz === -1;

    if (isDoor) {
      g.set(x, gr + 1, z, "oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // Stone surround over the door with a warm lantern.
      g.set(x, gr + 3, z, "stone_bricks");
      g.set(x, gr + 4 <= rf - 3 ? gr + 4 : gr + 3, z, "stone_bricks");
      continue;
    }

    // Window bays on odd positions along each facade; corners stay solid piers.
    if (f.idx % 2 !== 1) continue;
    const inX = f.axis === "x" ? f.dx : 0;
    const inZ = f.axis === "z" ? f.dz : 0;
    const ix = x - inX, iz = z - inZ;
    const boarded = (x + z) % 4 === 0;

    // Window band from above the base to just under the lintel course.
    for (let y = gr + 1; y <= rf - 4; y++) {
      if (boarded) {
        g.set(x, y, z, "oak_planks");
      } else {
        const props = f.axis === "z"
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
        if (has(ix, iz)) g.set(ix, y, iz, "air");
      }
    }
    // Stone lintel over the window bay.
    g.set(x, rf - 3, z, "stone_bricks");
  }
}

// Warm light above the entrance.
if (door) {
  const ly = door.gr + 3;
  g.set(door.x, ly, door.z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/DC70244.nbt`);
