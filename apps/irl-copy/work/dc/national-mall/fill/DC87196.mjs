import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 704 Jackson Place NW: Special Purpose, Lafayette Square edge. Read as a
// 1880s-1900s brick Federal/Italianate office annex: red brick walls, pale
// stone (smooth quartz) string courses, window lintels and sills, cornice and
// cap, stone base, a street-side entrance with pilasters and a lantern, and a
// few brick chimneys on the flat tar roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87196";
const W = 15, H = 20, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint map: key "x,z" -> { x, z, g: ground, r: roof top (exclusive) }
const cm = new Map();
for (const [x, z, gr, ro] of cells) {
  const gg = Math.max(0, Math.round(gr));
  let r = Math.round(ro);
  r = Math.min(Math.max(r, gg + 6), H - 4);
  cm.set(`${x},${z}`, { x, z, g: gg, r });
}
const has = (x, z) => cm.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const isCorner = (x, z) => {
  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  return missX && missZ;
};
const list = [...cm.values()].map((c) => ({ ...c, edge: isEdge(c.x, c.z) }));

// Entrance: on the lowest-z (street) face, the cell nearest the middle of that face.
const minZ = Math.min(...list.map((c) => c.z));
const faceCells = list.filter((c) => c.z === minZ);
const medX = faceCells.reduce((s, c) => s + c.x, 0) / faceCells.length;
let doorCell = faceCells[0];
for (const c of faceCells) if (Math.abs(c.x - medX) < Math.abs(doorCell.x - medX)) doorCell = c;
const doorKey = `${doorCell.x},${doorCell.z}`;

// Pass 1: foundations, walls, interior floors and roofs
for (const c of list) {
  const { x, z, g: gg, r, edge } = c;

  for (let y = 0; y < gg; y++) S(x, y, z, "stone_bricks");

  if (edge) {
    for (let y = gg; y <= r - 1; y++) S(x, y, z, "bricks");
    S(x, gg, z, "stone_bricks");          // base course
    S(x, r - 3, z, "smooth_quartz");      // cornice
    S(x, r - 1, z, "smooth_quartz");      // parapet cap
  } else {
    S(x, r - 1, z, "stone");              // tar roof
  }

  for (let L = gg; L < r - 1; L += 4) {
    if (edge) S(x, L, z, "smooth_quartz");   // storey string course
    else S(x, L, z, "oak_planks");           // interior floor slab
  }
}

// Pass 2: windows with quartz lintels and sills, and warm lights behind glass
for (const c of list) {
  const { x, z, g: gg, r, edge } = c;
  if (!edge || isCorner(x, z)) continue;
  if (`${x},${z}` === doorKey) continue;
  if ((x + z) % 2 !== 0) continue;

  for (let L = gg; L + 3 < r - 3; L += 4) {
    S(x, L + 1, z, "glass_pane");
    S(x, L + 2, z, "glass_pane");
    S(x, L + 3, z, "smooth_quartz");      // lintel
    const k = (L - gg) / 4;
    if ((x * 3 + z + k) % 3 === 0) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dz] of dirs) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !isEdge(nx, nz)) {
          S(nx, L + 1, nz, "glowstone");
          break;
        }
      }
    }
  }
}

// Pass 3: entrance on the street face, with pilasters and a lantern
{
  const { x, z, g: gg } = doorCell;
  for (const dx of [-1, 1]) {
    const px = x + dx;
    if (has(px, z) && isEdge(px, z)) {
      S(px, gg + 1, z, "smooth_quartz");
      S(px, gg + 2, z, "smooth_quartz");
    }
  }
  S(x, gg, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(x, gg + 3, z, "smooth_quartz");
  S(x, gg + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: brick chimneys on interior roof cells
for (const c of list) {
  const { x, z, r, edge } = c;
  if (edge) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    S(x, r, z, "bricks");
    S(x, r + 1, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
