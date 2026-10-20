import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296183";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 22;
const ROOF = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// outward directions: facade normal, axis along the face, and facing name
const DIRS = {
  N: { dx: 0, dz: -1, name: "north", axisX: true },
  S: { dx: 0, dz: 1, name: "south", axisX: true },
  W: { dx: -1, dz: 0, name: "west", axisX: false },
  E: { dx: 1, dz: 0, name: "east", axisX: false },
};
const outFaces = (x, z) => Object.keys(DIRS).filter(k => !has(x + DIRS[k].dx, z + DIRS[k].dz));

// front = longest exposed face (street side); entrance at its middle cell
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) for (const k of outFaces(x, z)) faceCount[k]++;
let front = "S";
for (const k of ["S", "N", "E", "W"]) if (faceCount[k] > faceCount[front]) front = k;
const frontCells = cells
  .filter(([x, z]) => outFaces(x, z).length && outFaces(x, z).includes(front))
  .map(([x, z]) => [x, z])
  .sort((a, b) => (DIRS[front].axisX ? a[0] - b[0] : a[1] - b[1]));
const entrance = frontCells.length
  ? `${frontCells[Math.floor(frontCells.length / 2)][0]},${frontCells[Math.floor(frontCells.length / 2)][1]}`
  : null;

const lights = [];

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const key = `${x},${z}`;

  // foundation below the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const at = (y, id, p) => {
    if (y < gr || y > ROOF || y >= H) return;
    p ? g.set(x, y, z, id, p) : g.set(x, y, z, id);
  };

  const faces = outFaces(x, z);

  // interior cell: floor slabs and roof deck only, air between
  if (!faces.length) {
    at(gr, "smooth_stone");
    at(5, "smooth_stone");
    at(10, "smooth_stone");
    if (gr <= 10 && (x * 3 + z * 5) % 11 === 0) at(11, "light_gray_concrete");
    continue;
  }

  const corner = faces.length > 1;
  const f = DIRS[faces[0]];
  const along = f.axisX ? x : z;
  const bay = !corner && along % 3 !== 0;
  const pane = f.axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isEntrance = key === entrance && faces.includes(front);

  // base course and ground-floor shopfront
  at(gr, "polished_granite");
  for (let y = gr + 1; y <= 3; y++) at(y, bay ? "light_blue_stained_glass" : "polished_granite");
  at(4, "polished_granite");

  // storey line, upper floor with framed pane windows
  at(5, "light_gray_concrete");
  at(6, "light_gray_concrete");
  at(7, bay ? "light_blue_stained_glass_pane" : "white_concrete", bay ? pane : undefined);
  at(8, bay ? "light_blue_stained_glass_pane" : "white_concrete", bay ? pane : undefined);
  at(9, "light_gray_concrete");

  // cornice and parapet
  at(10, "smooth_quartz");
  at(11, "smooth_quartz");

  // entrance: door, canopy band
  if (isEntrance) {
    const doorProps = (half) => ({ facing: f.name, half, hinge: "left", open: "false", powered: "false" });
    at(gr + 1, "oak_door", doorProps("lower"));
    at(gr + 2, "oak_door", doorProps("upper"));
    if (gr + 3 <= 3) at(gr + 3, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // warm light behind some windows (placed in a second pass)
  if (bay && along % 6 === 1) {
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz) && !outFaces(ix, iz).length) lights.push([ix, 7, iz]);
  }
  if (bay && along % 6 === 4 && gr + 2 <= 4) {
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz) && !outFaces(ix, iz).length) lights.push([ix, gr + 2, iz]);
  }
}

// interior glowstone behind windows (air gap kept, floor slabs untouched)
for (const [x, y, z] of lights) {
  if (y < H && y !== 5 && y !== 10) g.set(x, y, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
