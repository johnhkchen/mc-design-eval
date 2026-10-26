import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86666";
const W = 6, H = 17, D = 8;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const list = raw.map(([x, z, gr, rf]) => {
  const ground = Math.max(0, Math.round(gr));
  const top = Math.min(H - 3, Math.max(ground + 4, Math.round(rf)));
  return { x, z, g: ground, t: top };
});
const L = new Map(list.map(c => [key(c.x, c.z), c]));

// Exposed faces: sides of a cell with no neighbouring footprint cell.
const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
function exposed(c) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(OFF)) {
    if (!L.has(key(c.x + dx, c.z + dz))) out.push(d);
  }
  return out;
}

const paneProps = dir => {
  const ns = dir === "north" || dir === "south";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
};

// Door position chosen up front so the shell can leave that cell open.
let doorCell = null;
{
  const ext = list.filter(c => exposed(c).length > 0);
  const south = ext.filter(c => exposed(c).includes("south"));
  const pool = south.length ? south : ext;
  if (pool.length) {
    pool.sort((a, b) => Math.abs(a.x - 2.5) - Math.abs(b.x - 2.5));
    doorCell = pool[0];
  }
}
const doorDir = doorCell
  ? (exposed(doorCell).includes("south") ? "south" : exposed(doorCell)[0])
  : null;

// 1) Shell: foundation, base course, floor slabs, windows, cornice.
for (const c of list) {
  const ex = exposed(c);
  const isDoor = doorCell && c.x === doorCell.x && c.z === doorCell.z;

  // Foundation up to the cell's ground.
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");

  for (let y = c.g; y < c.t; y++) {
    const rel = y - c.g;
    const isFloor = rel % 3 === 0;

    // Roof deck under the coping.
    if (y === c.t - 1) {
      g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }

    if (ex.length === 0) {
      // Interior: air gap, with a floor slab per storey.
      if (isFloor) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }

    // Exposed shell cells.
    if (rel === 0) {
      g.set(c.x, y, c.z, "stone_bricks"); // base course
    } else if (y === c.t - 2) {
      // Cornice: outward-facing stairs give the wall a projecting profile.
      g.set(c.x, y, c.z, "stone_brick_stairs", {
        facing: ex[0], half: "bottom", shape: "straight", waterlogged: "false",
      });
    } else if (isFloor) {
      g.set(c.x, y, c.z, "smooth_stone"); // storey string course
    } else if (ex.length === 1) {
      const dir = ex[0];
      const along = (dir === "north" || dir === "south") ? c.x : c.z;
      if (along % 3 === 0) {
        g.set(c.x, y, c.z, "calcite"); // pilaster column
      } else {
        g.set(c.x, y, c.z, "glass_pane", paneProps(dir));
        // Warm light in the air gap behind some panes.
        const [ox, oz] = OFF[OPP[dir]];
        const ix = c.x + ox, iz = c.z + oz;
        if (L.has(key(ix, iz)) && (along + rel) % 4 === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else {
      g.set(c.x, y, c.z, "calcite"); // corner pier
    }
  }

  // Coping: a continuous slab course on the exposed perimeter.
  if (ex.length > 0) {
    g.set(c.x, c.t, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2) Entrance: dark oak door on the chosen face, with a calcite surround.
if (doorCell) {
  const c = doorCell;
  const doorProps = { facing: doorDir, hinge: "left", open: "false", powered: "false" };
  g.set(c.x, c.g, c.z, "dark_oak_door", { ...doorProps, half: "lower" });
  g.set(c.x, c.g + 1, c.z, "dark_oak_door", { ...doorProps, half: "upper" });
  // Lintel course above the door opening.
  g.set(c.x, c.g + 2, c.z, "smooth_stone");
}

// 3) Roof equipment: a small stone-slab plinth on the central roof cell.
let centre = null;
let best = Infinity;
for (const c of list) {
  if (exposed(c).length) continue;
  const d = Math.abs(c.x - 2.5) + Math.abs(c.z - 3.5);
  if (d < best) { best = d; centre = c; }
}
if (centre) {
  g.set(centre.x, centre.t, centre.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
