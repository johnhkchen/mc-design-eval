import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi mid-rise commercial block, c. 1990s: white-tiled concrete walls, quartz
// storey lines and cornice, stone-brick plinth, glass-pane window grid on a 3-block
// module with white mullions, a recessed-free entrance on the street-facing side,
// and a small rooftop plant box. Roof sits at lowest ground + 11 blocks; higher
// cells are stepped down by their own foundation, so the downhill side shows more storeys.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541455215";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2]));

// Exterior faces of a footprint cell (neighbour missing from the footprint).
function faces(x, z) {
  const F = [];
  if (!has(x, z - 1)) F.push({ side: "north", dx: 0, dz: -1, axis: "x", i: x });
  if (!has(x, z + 1)) F.push({ side: "south", dx: 0, dz: 1, axis: "x", i: x });
  if (!has(x - 1, z)) F.push({ side: "west", dx: -1, dz: 0, axis: "z", i: z });
  if (!has(x + 1, z)) F.push({ side: "east", dx: 1, dz: 0, axis: "z", i: z });
  return F;
}

// Pick the entrance: the street-facing side (south, else north, east, west),
// at the median cell along that side.
let doorX = null, doorZ = null, doorSide = null;
for (const side of ["south", "north", "east", "west"]) {
  const list = cells
    .filter(([x, z]) => faces(x, z).some((f) => f.side === side))
    .sort((a, b) => (side === "south" || side === "north" ? a[0] - b[0] : a[1] - b[1]));
  if (list.length) {
    const mid = list[Math.floor(list.length / 2)];
    doorX = mid[0];
    doorZ = mid[1];
    doorSide = side;
    break;
  }
}

const paneProps = (axis) =>
  axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: doorSide, half, hinge: "left", open: "false", powered: "false",
});

// Block (or null for air) at structural row r above L for a footprint cell.
function blockAt(x, z, r) {
  const F = faces(x, z);

  // Interior: floor slabs and roof, air elsewhere (no interiors).
  if (F.length === 0) {
    if (r === 0) return { id: "smooth_stone" };
    if (r === 5) return { id: "smooth_quartz" };
    if (r === 10) return { id: "light_gray_concrete" };
    if (r === 11 && x >= 5 && x <= 7 && z >= 5 && z <= 7) return { id: "light_gray_concrete" };
    return null;
  }

  // Corners: quartz pillars with a stone-brick plinth.
  if (F.length >= 2) {
    if (r === 0) return { id: "stone_bricks" };
    if (r === 10) return { id: "quartz_block" };
    if (r === 11) return { id: "white_concrete" };
    return { id: "quartz_pillar", props: { axis: "y" } };
  }

  const f = F[0];
  const isDoor = x === doorX && z === doorZ && f.side === doorSide;

  if (r === 0) return { id: "stone_bricks" };           // base course
  if (r === 5) return { id: "smooth_quartz" };          // storey line
  if (r === 10) return { id: "quartz_block" };          // cornice
  if (r === 11) return { id: "white_concrete" };        // parapet

  if (isDoor) {
    if (r === 1) return { id: "oak_door", props: doorProps("lower") };
    if (r === 2) return { id: "oak_door", props: doorProps("upper") };
    if (r === 3) return { id: "quartz_block" };         // entrance lintel
  }

  const windowRow = r === 1 || r === 2 || r === 3 || r === 7 || r === 8;
  if (windowRow) {
    if (f.i % 3 === 0) return { id: "white_concrete" }; // mullion
    return { id: "glass_pane", props: paneProps(f.axis) };
  }

  return { id: "white_concrete" };                      // spandrel / lintel bands
}

// Structure: foundation under every cell, then the body above its ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  for (let r = 0; r <= 11; r++) {
    const y = L + r;
    if (y < gr) continue;
    const b = blockAt(x, z, r);
    if (b) g.set(x, y, z, b.id, b.props);
  }
}

// Warm lights set back behind some windows (inside air, one cell in from the glass).
for (const [x, z, gr] of cells) {
  const F = faces(x, z);
  if (F.length !== 1) continue;
  const f = F[0];
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || faces(ix, iz).length !== 0) continue;
  for (const r of [2, 8]) {
    const y = L + r;
    if (y < groundAt(ix, iz) || y < gr) continue;
    const onRow = f.i % 6 === 1;
    if (onRow && !(x === doorX && z === doorZ)) g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${dir}/${id}.nbt`);
