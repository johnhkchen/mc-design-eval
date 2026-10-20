import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459515";
const W = 30, H = 23, D = 16;

// Two-storey cream-tiled commercial block with dark-glass shopfront, red fascia,
// granite string courses and a quartz parapet. Roof sits 11 blocks above lowest ground.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(`${x},${z}`, gr);
const has = (x, z) => GR.has(`${x},${z}`);
const gAt = (x, z) => GR.get(`${x},${z}`);
const F = Math.min(...cells.map((c) => c[2]));
const TOP = F + 11;
const DOOR_I = [14, 15];

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// outward (dx,dz), inward (ix,iz), index along face, face length, ordinal
const FACES = [
  { name: "north", dx: 0, dz: -1, ix: 0, iz: 1, along: "x", len: W, ord: 0 },
  { name: "south", dx: 0, dz: 1, ix: 0, iz: -1, along: "x", len: W, ord: 1 },
  { name: "west", dx: -1, dz: 0, ix: 1, iz: 0, along: "z", len: D, ord: 2 },
  { name: "east", dx: 1, dz: 0, ix: -1, iz: 0, along: "z", len: D, ord: 3 },
];

const paneProps = (face) =>
  face.along === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (i, half) => ({
  facing: "north",
  half,
  hinge: i === 14 ? "left" : "right",
  open: "false",
  powered: "false",
});

// Pass 1: foundations, base course, floors, roof deck (every footprint cell)
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const perimeter = FACES.some((f) => !has(x + f.dx, z + f.dz));
  put(x, gr, z, perimeter ? "polished_granite" : "smooth_stone");
  if (gr <= F + 5 && !perimeter) put(x, F + 5, z, "smooth_stone");
  if (!perimeter) put(x, F + 10, z, "gray_concrete");
}

// Pass 2: perimeter walls, shopfront, windows, pillars, parapet, lights
for (const [x, z, gr] of cells) {
  const fs = FACES.filter((f) => !has(x + f.dx, z + f.dz));
  if (!fs.length) continue;
  const corner = fs.length > 1;
  const face = fs[0];
  const i = face.along === "x" ? x : z;
  const front = face.name === "north";
  const isDoor = front && DOOR_I.includes(i);

  for (let y = gr + 1; y <= TOP; y++) {
    if (corner) {
      if (y === TOP) put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "quartz_pillar");
      continue;
    }

    // storey line and parapet
    if (y === F + 5) { put(x, y, z, "polished_granite"); continue; }
    if (y === TOP) { put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === F + 10) { put(x, y, z, "smooth_quartz"); continue; }

    // ground-storey head fascia
    if (y === F + 4) {
      put(x, y, z, front ? "red_terracotta" : "smooth_quartz");
      continue;
    }

    // ground shopfront zone
    if (y <= F + 3) {
      if (isDoor) {
        if (y === F + 1) { put(x, y, z, "dark_oak_door", doorProps(i, "lower")); continue; }
        if (y === F + 2) { put(x, y, z, "dark_oak_door", doorProps(i, "upper")); continue; }
        if (y === F + 3) { put(x, y, z, "smooth_quartz"); continue; }
      }
      if (i % 3 === 0) { put(x, y, z, "quartz_pillar"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      continue;
    }

    // upper storey zone
    if (y === F + 6 || y === F + 9) { put(x, y, z, "smooth_quartz"); continue; }
    if (i % 3 === 0) { put(x, y, z, "quartz_pillar"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));

    // warm light standing two blocks behind the glass
    if (y === F + 6 && i % 3 !== 0 && (i + face.ord) % 5 === 2) {
      const lx = x + 2 * face.ix, lz = z + 2 * face.iz;
      if (has(lx, lz)) put(lx, y, lz, "glowstone");
    }
  }

  // ground-floor lights behind shopfront glass (not behind the door)
  if (F + 1 <= TOP && !isDoor && i % 3 !== 0 && (i + face.ord) % 6 === 1) {
    const lx = x + 2 * face.ix, lz = z + 2 * face.iz;
    if (has(lx, lz)) put(lx, F + 1, lz, "glowstone");
  }
}

// Rooftop plant: two condenser enclosures on the interior roof deck
const plant = [
  { x0: 5, x1: 8, z0: 4, z1: 6, block: "gray_concrete", h: 2 },
  { x0: 20, x1: 23, z0: 9, z1: 11, block: "light_gray_concrete", h: 1 },
];
for (const p of plant) {
  for (let x = p.x0; x <= p.x1; x++)
    for (let z = p.z0; z <= p.z1; z++) {
      if (!has(x, z)) continue;
      for (let k = 1; k <= p.h; k++) put(x, F + 10 + k, z, p.block);
    }
}

g.save(`${DIR}/${ID}.nbt`);
