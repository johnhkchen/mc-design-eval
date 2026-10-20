import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, two storeys over a shopfront band, flat roof with cornice and parapet,
// mid-century Taipei style: white-tiled concrete piers, tinted glass panes, grey deck, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857625";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 23, D = 15;
const TOP = 11;          // parapet top, absolute y
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.min(10, Math.max(0, Math.round(gy))));
const has = (x, z) => ground.has(`${x},${z}`);

const outward = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: lowest-ground facade cell on north or south face, nearest the middle of the plan.
let entranceKey = null, best = Infinity;
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const out = outward(x, z);
  if (!out.length) continue;
  const gy = ground.get(`${x},${z}`);
  const pref = out.includes("south") || out.includes("north") ? 0 : 500;
  const score = pref + gy * 100 + Math.abs(x - 14.5);
  if (score < best) { best = score; entranceKey = `${x},${z}`; }
}

const lamps = [];

for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gy = ground.get(`${x},${z}`);
  const out = outward(x, z);
  const edge = out.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slab at storey line, grey roof deck. Air between (no interiors).
    if (gy <= 5) g.set(x, 5, z, "white_concrete");
    g.set(x, 10, z, "gray_concrete");
    continue;
  }

  const face = out[0];
  const axisX = face === "north" || face === "south";
  const a = axisX ? x : z;
  const pillar = a % 3 === 0;

  // Shopfront band: base course at ground, glass between piers, lintel at y 4.
  for (let y = gy; y <= 4; y++) {
    if (y === gy) g.set(x, y, z, "stone_bricks");
    else if (y === 4) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, pillar ? "white_concrete" : "glass");
  }

  // Entrance door with its lower and upper halves, outward facing.
  if (`${x},${z}` === entranceKey) {
    g.set(x, gy + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gy + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Upper storey and parapet.
  const paneProps = axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = 5; y <= TOP; y++) {
    if (y === 5 || y === 9) g.set(x, y, z, "white_concrete");           // floor / spandrel lines
    else if (y >= 6 && y <= 8) {
      if (pillar) g.set(x, y, z, "white_concrete");                      // piers
      else g.set(x, y, z, "glass_pane", paneProps);                      // tinted panes
    }
    else if (y === 10) g.set(x, y, z, "stone_bricks");                   // cornice
    else g.set(x, y, z, "white_concrete");                               // parapet
  }

  // Warm light behind selected windows, on the interior floor slab.
  if (!pillar && a % 6 === 1) {
    const [dx, dz] = INWARD[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && outward(ix, iz).length === 0) lamps.push([ix, 6, iz]);
  }
}

for (const [x, y, z] of lamps) g.set(x, y, z, "glowstone");

// Rooftop plant room on the deck, set back from the parapet.
for (let x = 10; x <= 18; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!has(x, z) || outward(x, z).length) continue;
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
