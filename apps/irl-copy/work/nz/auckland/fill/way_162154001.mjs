// Way 162154001: a three-storey brick commercial block of the 1930s, cream render on the piers, string courses
// and parapet, a shopfront on the ground floor, and a flat roof with a plant room. The footprint is the lidar cells
// ([x, z, ground, roof]); the shell is one cell thick, so each window is a pane in the wall cell with air behind it,
// and the floor slabs sit at y 3 and 7. Nothing stands outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162154001.cells.json`, "utf8"));

// the roof is one flat tier: the median of the lidar roof heights (its few 0-8 cells are edge noise)
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const ROOF = roofs[roofs.length >> 1];           // roof surface: the roof slab is y ROOF-1, the parapet y ROOF
const FLOORS = [3, 7];                           // floor slabs (string courses on the outer ring)
const SLAB = ROOF - 1;

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inF = (x, z) => G.has(`${x},${z}`);
const exposed = (x, z) => {                      // the outward faces of a footprint cell
  const e = [];
  if (!inF(x, z - 1)) e.push("N");
  if (!inF(x, z + 1)) e.push("S");
  if (!inF(x + 1, z)) e.push("E");
  if (!inF(x - 1, z)) e.push("W");
  return e;
};
const DELTA = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// the entrance: on the longest straight run of outer faces (the street side), at ground level near its middle
const runs = [];   // { face, line, at: [cell coords along the face] }; N/S runs share a z, E/W runs share an x
for (const face of ["N", "S", "E", "W"]) {
  const lines = new Map();
  for (const [x, z] of cells) {
    if (!exposed(x, z).includes(face)) continue;
    const line = face === "N" || face === "S" ? z : x, along = face === "N" || face === "S" ? x : z;
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(along);
  }
  for (const [line, alongs] of lines) {
    alongs.sort((a, b) => a - b);
    let cur = [alongs[0]];
    for (let i = 1; i <= alongs.length; i++) {
      if (i < alongs.length && alongs[i] === alongs[i - 1] + 1) cur.push(alongs[i]);
      else { runs.push({ face, line, at: cur }); cur = [alongs[i]]; }
    }
  }
}
const cellAt = (r, a) => (r.face === "N" || r.face === "S" ? [a, r.line] : [r.line, a]);
const run = runs
  .filter((r) => r.at.some((a) => G.get(cellAt(r, a).join(",")) <= 1))
  .sort((a, b) => b.at.length - a.at.length)[0];
const mid = run.at[run.at.length >> 1];
const doorAt = run.at.filter((a) => G.get(cellAt(run, a).join(",")) <= 1).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
const [doorX, doorZ] = cellAt(run, doorAt);
const door = { x: doorX, z: doorZ, facing: { N: "north", S: "south", E: "east", W: "west" }[run.face] };

// the outer ring: a plinth course at the ground, cream piers every 4 cells, brick panels, two-cell windows
// (a shopfront below), a sill, and the string courses, cornice and parapet.
function outerBlock(x, y, z, g, faces) {
  if (y === ROOF) return ["smooth_quartz"];                       // parapet on the outer ring
  if (door.x === x && door.z === z && g <= 1) {                   // entrance: a door, glazed transom above
    if (y === g) return ["dark_oak_door", { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === g + 1) return ["dark_oak_door", { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y <= 2) return ["glass"];
  }
  if (y < g) return ["stone_bricks"];                             // foundation: the plinth, under the shopfront glass
  if (y === SLAB || FLOORS.includes(y)) return ["smooth_quartz"]; // cornice and string courses
  if (faces.length > 1) return ["smooth_quartz"];                 // corners
  const along = faces[0] === "N" || faces[0] === "S" ? x : z;
  const bayPos = along % 4;
  if (bayPos === 0) return ["smooth_quartz"];                     // pier
  if (bayPos === 3) return ["bricks"];                            // solid brick panel
  if (y <= 2) return ["glass"];                                   // shopfront glass
  if (y === 4) return ["smooth_quartz"];                          // sill
  return ["glass_pane", null];                                    // upper window panes (connected below)
}

// the interior: floor slabs, the roof slab, and air between (no rooms)
function interiorBlock(y, g) {
  if (y < g) return ["stone_bricks"];
  if (FLOORS.includes(y)) return ["smooth_stone"];
  if (y === SLAB) return ["gravel"];
  return null;
}

const g = new Voxels([29, 24, 36]);
const windows = [];   // the glazed cells on the outer ring, to connect and light
for (const [x, z, gr] of cells) {
  const faces = exposed(x, z);
  for (let y = 0; y <= ROOF; y++) {
    const b = faces.length ? outerBlock(x, y, z, gr, faces) : interiorBlock(y, gr);
    if (!b) continue;
    if (b[0] === "glass_pane") {
      const along = faces[0] === "N" || faces[0] === "S" ? x : z;
      const storey = y <= 2 ? 0 : y <= 6 ? 1 : 2;
      windows.push({ x, y, z, face: faces[0], lit: (Math.floor(along / 4) + storey) % 2 === 0 });
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    } else if (b[0] === "glass" && faces.length) {
      const along = faces[0] === "N" || faces[0] === "S" ? x : z;
      windows.push({ x, y, z, face: faces[0], lit: (Math.floor(along / 4) + 0) % 2 === 0 });
      g.set(x, y, z, "glass");
    } else {
      g.set(x, y, z, b[0], b[1]);
    }
  }
}

// the plant room on the roof, the 4 x 3 interior block nearest the middle of the footprint
let plant = null;
for (let a = 0; a <= 25; a++) for (let b = 0; b <= 32; b++) {
  let ok = true;
  for (let dx = 0; dx < 4 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) ok = inF(a + dx, b + dz) && !exposed(a + dx, b + dz).length;
  if (!ok) continue;
  const score = Math.abs(a + 1.5 - 14) + Math.abs(b + 1 - 18);
  if (!plant || score < plant.score) plant = { a, b, score };
}
if (plant) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) for (let y = ROOF; y <= ROOF + 1; y++) {
  g.set(plant.a + dx, y, plant.b + dz, "light_gray_concrete");
}

// glass panes connect to the solid or glazed neighbour on each side
for (const w of windows) {
  if (!w.face) continue;
  const st = {};
  for (const [dir, [dx, dz]] of Object.entries({ N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] })) {
    const name = { N: "north", S: "south", E: "east", W: "west" }[dir];
    st[name] = g.get(w.x + dx, w.y, w.z + dz) ? "true" : "false";
  }
  if (g.get(w.x, w.y, w.z)?.block === "minecraft:glass_pane") g.set(w.x, w.y, w.z, "glass_pane", { ...st, waterlogged: "false" });
}

// warm lights: the lit windows get a glowstone two cells in, past an air gap behind the glass
let lights = 0;
for (const w of windows) {
  if (!w.lit) continue;
  const [ix, iz] = INWARD[w.face];
  const c1 = [w.x + ix, w.z + iz], c2 = [w.x + 2 * ix, w.z + 2 * iz];
  if (!inF(...c1) || exposed(...c1).length || !inF(...c2) || exposed(...c2).length) continue;
  g.set(c2[0], w.y, c2[1], "glowstone");
  lights++;
}

const stats = g.save(`${DIR}/way_162154001.nbt`);
console.log(JSON.stringify({ cells: cells.length, roof: ROOF, door, plant, windows: windows.length, lights, ...stats }));
