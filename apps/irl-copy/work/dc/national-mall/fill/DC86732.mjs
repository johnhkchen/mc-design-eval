// DC86732: a 1930s Stripped-Classical federal office block, Indiana limestone (calcite walls, smooth-stone storey bands,
// stone-brick plinth), a T-shaped footprint: a 19-wide front block with a 6-wide wing running south from its middle.
// Massing from lidar: wings to y 12, the pavilion core (x 9..12, z 4..5) rises to 15 as a setback tower on the pavilion
// ring (which stops at 12). Four storey bands (y 2, 5, 8, 11), a fifth at 14 on the core. The walls are hollow: exterior
// walls are one cell thick, a storey's windows have air behind the glass, floor slabs sit on the band rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86732.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 19, H = 27, D = 14;
const WALL = "calcite", PILASTER = "smooth_quartz", BAND = "smooth_stone", PLINTH = "stone_bricks", GLASS = "glass_pane";

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const CORE = (x, z) => x >= 9 && x <= 12 && z >= 4 && z <= 5;
// the roof row (exclusive top) of a cell: wings 12, the pavilion core 15 (lidar), the ring stays at 12 as a setback
const top = (x, z) => (inFoot(x, z) ? (CORE(x, z) ? 15 : 12) : 0);
const BANDS = new Set([2, 5, 8, 11, 14]);

// the block map: "x,y,z" -> { block, state }
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// a wall cell at height y is exposed where a side neighbour is missing or lower than y
const exposed = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz; return !inFoot(nx, nz) || top(nx, nz) <= y;
});
// the direction a face looks out (for glass and the inward side of a lit window)
const outward = (x, z, y) => {
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (!inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= y) return [dx, dz];
  return null;
};

// 1. the solid parts: plinth (y 0..1, also the foundation on the ground-1 cells), storey bands, cells' interior up to roof
for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < 2) { put(x, y, z, PLINTH); continue; }
    if (BANDS.has(y)) { put(x, y, z, BAND); continue; }
    if (!exposed(x, z, y)) continue;                              // interior air behind the glass
    const [dx, dz] = outward(x, z, y);
    // pilasters every third cell along the face (corners too); between them, a pair of windows per bay
    const u = dx !== 0 ? z : x;
    put(x, y, z, u % 3 === 0 ? PILASTER : WALL);
  }
}

// 2. the window glass: every non-pilaster exposed wall cell in a window row, with an air cell behind (interior)
const windowRow = (y) => (y >= 3 && y <= 4) || (y >= 6 && y <= 7) || (y >= 9 && y <= 10) || (y >= 12 && y <= 13);
const glassCells = [];
for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 2; y < t; y++) {
    if (!windowRow(y) || !exposed(x, z, y)) continue;
    const cur = B.get(`${x},${y},${z}`);
    if (cur?.block !== WALL) continue;
    put(x, y, z, GLASS);
    glassCells.push([x, y, z]);
  }
}

// the pane arms: a pane connects to any solid neighbour on the wall's plane (other panes, pilasters, walls)
for (const [x, y, z] of glassCells) {
  const link = (dx, dz) => has(x + dx, y, z + dz);
  put(x, y, z, GLASS, {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false",
  });
}

// 3. lit windows: a glowstone just behind some glass, inside the air cell
glassCells.forEach(([x, y, z], i) => {
  if ((x * 7 + y * 3 + z * 5) % 11 !== 0) return;               // about one window in eleven: few enough to read as light, not speckle
  const [dx, dz] = outward(x, z, y); if (!dx && !dz) return;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, y, iz)) put(ix, y, iz, "glowstone");
});

// 4. the entrance on the north face (z 0): two iron doors at x 10..11, a stone lintel, a vestibule, lanterns flanking
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  put(x, 2, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 4, 0, BAND);
  B.delete(`${x},2,1`); B.delete(`${x},3,1`);                      // the vestibule: air behind the doors
}
put(9, 2, 0, "lantern", { hanging: "false" });
put(12, 2, 0, "lantern", { hanging: "false" });

// 5. roof equipment: two plant boxes on the wing roof, a lightning rod on the core
put(4, 12, 5, "iron_block");
put(15, 12, 2, "iron_block");
put(10, 15, 4, "lightning_rod");

// write the volume
const g = new Voxels([W, H, D]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) continue;
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC86732.nbt`);
console.log("saved", out);
