import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888760";
const W = 10, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const groundAt = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => inFp.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
// Parapet row. Roof is about 11 blocks above the lowest ground.
const T = minG + 11;

// Outward normals of a footprint cell: [dx, dz, faceName]
function outward(x, z) {
  const n = [];
  if (!has(x, z - 1)) n.push([0, -1, "north"]);
  if (!has(x, z + 1)) n.push([0, 1, "south"]);
  if (!has(x - 1, z)) n.push([-1, 0, "west"]);
  if (!has(x + 1, z)) n.push([1, 0, "east"]);
  return n;
}

// Glass pane connection props for a pane sitting in a wall facing `face`
function paneProps(face) {
  const ns = face === "north" || face === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
}

// Door: front (north-facing) wall, cell nearest the average x of that row
const northCells = cells.filter(([x, z]) => outward(x, z).some((o) => o[2] === "north"));
const pool = northCells.length ? northCells : cells.filter(([x, z]) => outward(x, z).length > 0);
const avgX = pool.reduce((s, c) => s + c[0], 0) / pool.length;
const doorCell = pool.reduce((best, c) =>
  Math.abs(c[0] - avgX) < Math.abs(best[0] - avgX) ? c : best
);
const door = { x: doorCell[0], z: doorCell[1], gr: doorCell[2], face: outward(doorCell[0], doorCell[1]).find((o) => o[2] === "north")?.[2] ?? outward(doorCell[0], doorCell[1])[0]?.[2] ?? "north" };

for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  const shell = out.length > 0;
  const corner = out.length >= 2;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  if (!shell) {
    // Interior: floor slabs only, air elsewhere
    if (gr < H) g.set(x, gr, z, "smooth_stone");
    for (const fy of [minG + 5, minG + 10]) {
      if (fy > gr && fy < H) g.set(x, fy, z, "smooth_stone");
    }
    continue;
  }

  // Shell walls from ground to parapet row
  for (let y = gr; y <= T && y < H; y++) {
    const rel = y - minG;
    let id = "white_concrete";
    let props;

    if (y === gr) {
      id = "stone_bricks"; // base course
    } else if (rel === 5 || rel === 10) {
      id = "light_gray_concrete"; // storey lines and roof deck line
    } else if (rel === 4 || rel === 9) {
      id = "white_concrete"; // spandrel
    } else if (rel === 11) {
      id = "stone_brick_slab"; // parapet cap
      props = { type: "bottom", waterlogged: "false" };
    } else if ((rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8)) {
      const ground = rel <= 3;
      const [dx, dz, face] = out[0];
      const u = face === "north" || face === "south" ? x : z;
      const isDoor = !corner && x === door.x && z === door.z && face === door.face &&
        (y === door.gr + 1 || y === door.gr + 2);

      if (isDoor) {
        id = "oak_door";
        props = {
          facing: face,
          half: y === door.gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (corner) {
        id = "white_concrete";
      } else {
        const mullion = ground ? u % 4 === 0 : u % 3 === 0;
        if (mullion) {
          id = "white_concrete";
        } else {
          id = "light_blue_stained_glass_pane";
          props = paneProps(face);
          // Warm light in the room behind some panes
          const lightRow = ground ? rel === 2 : rel === 7;
          if (lightRow && u % 8 === 2) {
            const xi = x - dx, zi = z - dz;
            const gi = groundAt.get(key(xi, zi));
            if (gi !== undefined && !has(xi - (dx ? 0 : 0), zi) === false && y >= gi && y < H) {
              // inward cell must be an interior cell of the footprint
              const inwardShell = outward(xi, zi).length > 0;
              if (!inwardShell) g.set(xi, y, zi, "glowstone");
            }
          }
        }
      }
    }

    g.set(x, y, z, id, props);
  }
}

// Roof equipment: a small water tank on a 2x2 interior roof patch, if it fits the volume
const tankTop = T + 2;
if (tankTop <= H - 1) {
  let spot = null;
  for (const [x, z] of cells) {
    const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    const ok = block.every(([a, b]) => has(a, b) && outward(a, b).length === 0);
    if (ok) {
      const d = Math.abs(x - 4.5) + Math.abs(z - 7);
      if (!spot || d < spot.d) spot = { x, z, d };
    }
  }
  if (spot) {
    for (const [a, b] of [[spot.x, spot.z], [spot.x + 1, spot.z], [spot.x, spot.z + 1], [spot.x + 1, spot.z + 1]]) {
      const gp = groundAt.get(key(a, b));
      if (T >= gp) {
        g.set(a, T, b, "light_gray_concrete");
        g.set(a, T + 1, b, "light_gray_concrete");
        g.set(a, T + 2, b, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
