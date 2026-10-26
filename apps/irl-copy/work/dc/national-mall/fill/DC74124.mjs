// DC74124: a vacant five-storey brick-and-stone rowhouse block on S Street NW, c. 1910s, 13 x 22 footprint.
// Massing from the lidar roof heights (cell[3]); foundation from the lowest ground (cell[2]); windows on every exposed face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74124.cells.json", "utf8"));
const W = 13, D = 22, H = 25;

const at = new Map(); for (const [x, z, gr, r] of cells) at.set(`${x},${z}`, { x, z, g: gr, r });
const cell = (x, z) => at.get(`${x},${z}`) ?? null;

// outward normals; a face is exposed where the neighbour is outside the footprint or sits 2+ blocks lower (a setback)
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.r <= c.r - 2; }).map(([k]) => k);

const BRICK = "bricks", STONE = "stone_bricks", BAND = "smooth_stone", ROOF = "stone";
const g = new Voxels([W, H, D]);

// pass 1: the solid mass, storey by storey
for (const c of at.values()) {
  const ex = exposed(c);
  for (let y = 0; y < c.r; y++) {
    const rel = y - c.g;
    let b;
    if (y < c.g) b = STONE;                                   // foundation down to the lowest ground
    else if (y === c.r - 1) b = ex.length ? BAND : ROOF;      // cornice cap / flat roof membrane
    else if (ex.length && y === c.r - 2) b = STONE;           // frieze under the cap
    else if (rel <= 1) b = ex.length ? STONE : BRICK;         // base course and plinth
    else if (rel % 2 === 1) b = ex.length ? BAND : BRICK;     // storey lines (sill / lintel bands)
    else b = BRICK;
    g.set(c.x, y, c.z, b);
  }
}

// pass 2: window grids on exposed faces. Piers every third block; panes between; an air gap behind each pane
const paneState = (dz) => (dz ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
for (const c of at.values()) {
  const ex = exposed(c);
  if (!ex.length) continue;
  const face = ex[0], [dx, dz] = DIRS[face];
  const i = dz ? c.x : c.z;                                   // position along the face
  if (i % 3 === 0) continue;                                  // pier
  for (let y = c.g + 2; y < c.r - 2; y += 2) {                // window rows: rel 2, 4, 6 ...
    const rel = y - c.g;
    const ix = c.x, iz = c.z;
    if (rel === 2) {                                          // ground floor: vacant, boarded up
      g.set(ix, y, iz, "dark_oak_planks");
      continue;
    }
    g.set(ix, y, iz, "glass_pane", paneState(dz));
    const inner = cell(ix - dx, iz - dz);
    if (inner) {
      const warm = (ix + y + iz) % 5 === 0 && rel < c.r - 4;   // a few lit rooms behind the glass
      g.set(ix - dx, y, iz - dz, warm ? "glowstone" : "air");
    }
  }
}

// the entrance: a door in the pier at x 6 on the street face (z 0), a stone lintel over it, the room behind it open
{
  const c = cell(6, 0);
  g.set(6, c.g + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(6, c.g + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(6, c.g + 1, 1, "air"); g.set(6, c.g + 2, 1, "air");
  g.set(6, c.g + 3, 0, BAND);
}

// roof plant: two small 2x2 boxes set back from the edge, on the flat roof of the low wings
for (const c of at.values()) {
  if (exposed(c).length) continue;
  if ((c.x === 3 || c.x === 4) && (c.z === 9 || c.z === 10) && c.r <= 11) g.set(c.x, c.r, c.z, STONE);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74124.nbt";
const info = g.save(out);
console.log(JSON.stringify(info));
