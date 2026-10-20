import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414170";
const W = 17, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
const m = Math.min(...cells.map((c) => c[2]));

// Building levels (absolute, y 0 = lowest ground): roof top layer is y 10 => ~11 blocks
const FLOOR1 = 5;   // storey line between floors
const TOP = 10;     // parapet / roof deck top layer
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];

const glassProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const rowKind = (y, gc) => {
  if (y === gc) return "base";
  if (y === 4 || y === FLOOR1 || y === 9 || y === TOP) return "band";
  if ((y > gc && y <= 3) || (y >= 6 && y <= 8)) return "window";
  return "solid";
};

// Pass 1: classify cells and find the street-facing (south) door position
const perimeter = new Map(); // key -> { gc, exposed[] }
for (const [x, z, y] of cells) {
  const gc = y - m;
  const exposed = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  if (exposed.length) perimeter.set(key(x, z), { x, z, gc, exposed });
}

const southSingles = [...perimeter.values()].filter(
  (p) => p.exposed.length === 1 && p.exposed[0].name === "south"
);
let doorCell = null;
if (southSingles.length) {
  const axisVals = southSingles.map((p) => p.x).sort((a, b) => a - b);
  const midX = axisVals[Math.floor(axisVals.length / 2)];
  doorCell = southSingles.find((p) => p.x === midX) ?? southSingles[0];
} else {
  const any = [...perimeter.values()].find((p) => p.exposed.length === 1);
  if (any) doorCell = any;
}

// Pass 2: foundations, interiors and facades
for (const [x, z, y] of cells) {
  const gc = y - m;

  // Foundation from y 0 up to this cell's ground
  for (let yy = 0; yy < gc; yy++) g.set(x, yy, z, "stone");

  const p = perimeter.get(key(x, z));

  if (!p) {
    // Interior: floor slab per storey and roof deck, no room fit-out
    for (let yy = gc; yy <= TOP; yy++) {
      if (yy === FLOOR1) g.set(x, yy, z, "light_gray_concrete");
      else if (yy === TOP) g.set(x, yy, z, "gray_concrete");
    }
    continue;
  }

  const corner = p.exposed.length > 1;
  const face = p.exposed[0];
  const t = face.axis === "x" ? x : z;
  const pillar = t % 3 === 0;

  for (let yy = gc; yy <= TOP; yy++) {
    const kind = rowKind(yy, gc);
    let id;
    let props;

    if (corner) {
      id = kind === "base" ? "stone_bricks" : kind === "band" ? "smooth_quartz" : "quartz_pillar";
    } else if (kind === "base") {
      id = "stone_bricks";
    } else if (kind === "band") {
      id = "smooth_quartz";
    } else if (kind === "window") {
      if (pillar) id = "quartz_pillar";
      else { id = "light_blue_stained_glass_pane"; props = glassProps(face.axis); }
    } else {
      id = "smooth_quartz";
    }

    // Parapet cap and roof deck edge
    if (yy === TOP && !corner) id = "smooth_quartz";

    g.set(x, yy, z, id, props);
  }

  // Interior-facing storey floor slab hidden behind the facade (keeps floors reading as slabs)
  if (FLOOR1 >= gc && !corner) {
    // band row already placed at FLOOR1 for facade
  }
}

// Shopfront door on the south (street) facade, with flanking lanterns
if (doorCell) {
  const { x, z, gc, exposed } = doorCell;
  const face = exposed[0];
  const doorY = gc + 1;
  if (doorY + 1 <= 3) {
    g.set(x, doorY, z, "oak_door", {
      facing: face.name, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, doorY + 1, z, "oak_door", {
      facing: face.name, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  // Lanterns flanking the entrance beneath the lintel band
  const lanternY = gc + 3;
  for (const dt of [-1, 1]) {
    const lx = face.axis === "x" ? x + dt : x;
    const lz = face.axis === "z" ? z + dt : z;
    if (has(lx, lz) && lanternY > gc && lanternY <= 3) {
      g.set(lx, lanternY, lz, "lantern");
    }
  }
}

// Warm light: glowstone just inside some upper-storey windows
for (const p of perimeter.values()) {
  if (p.exposed.length !== 1) continue;
  const face = p.exposed[0];
  const t = face.axis === "x" ? p.x : p.z;
  if (t % 3 === 0 || t % 6 !== 1) continue;
  const ix = p.x - face.dx, iz = p.z - face.dz;
  const interior = DIRS.every((d) => has(ix + d.dx, iz + d.dz)) && !perimeter.has(key(ix, iz));
  if (interior) g.set(ix, 7, iz, "glowstone");
}

// Roof equipment: a small water tank and two lanterns, on the deck
for (const [x, z, y] of cells) {
  const gc = y - m;
  if (perimeter.has(key(x, z)) || gc > TOP) continue;
  if (x >= 6 && x <= 7 && z >= 8 && z <= 9) g.set(x, TOP + 1, z, "iron_block");
  if ((x === 3 && z === 3) || (x === 13 && z === 19)) g.set(x, TOP + 1, z, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);
