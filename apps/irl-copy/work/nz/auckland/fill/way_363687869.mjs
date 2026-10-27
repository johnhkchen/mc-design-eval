// Way 363687869, Eden Terrace / Mt Eden fringe: a 1930s stripped-classical plastered commercial block. Four storeys
// on the lidar core (roof >= 14 blocks), three on the lower wing, cream plaster with stone string courses and a
// cornice, blue-glazed bays, a shopfront entrance on the largest frontage with a cantilevered canopy, and a plant room.
// The footprint is a diagonal staircase, so each perimeter cell's facade normal is the sum of its outward faces.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_363687869.cells.json`, "utf8"));
const SIZE = [22, 29, 22];
const [W, Y, D] = SIZE;

const F = new Map();                                         // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);
const tierOf = (c) => (c.roof >= 14 ? 16 : 12);             // smooth the lidar roof into two flat tiers
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const P = new Map();                                         // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= Y || z >= D) return;
  P.set(`${x},${y},${z}`, { block, state });
};
const has = (x, y, z) => P.has(`${x},${y},${z}`);

const perim = new Map();                                     // "x,z" -> outward directions
const glass = [];                                            // glazed cells: face normal and which axis the bays run on
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  const H = tierOf(c);
  const out = outward(x, z);
  for (let y = 0; y < c.ground; y++) put(x, y, z, "stone_bricks");   // foundation up to this cell's ground
  if (!out.length) {                                         // interior: floor slabs and the roof deck, air between
    put(x, 0, z, "smooth_stone");
    for (let y = 4; y < H; y += 4) put(x, y, z, "smooth_stone");
    put(x, H - 1, z, "gray_concrete");
    continue;
  }
  perim.set(key, out);
  const sx = Math.sign(out.reduce((s, [a]) => s + a, 0)), sz = Math.sign(out.reduce((s, [, b]) => s + b, 0));
  const [nx, nz] = sx || sz ? [sx, sz] : out[0];
  const alongZ = nx !== 0 && nz === 0;                       // a plain east/west face: its bays run along z
  const u = alongZ ? z : x;                                  // position along the facade
  for (let y = 0; y <= H; y++) {
    let block;
    if (y === H) block = "smooth_quartz";                    // parapet
    else if (y === 0 || y === H - 1) block = "polished_andesite";   // base course, cornice
    else if (y % 4 === 0) block = "polished_andesite";       // storey string course
    else if (y % 4 === 3) block = "smooth_quartz";           // spandrels
    else {
      const m = ((u % 4) + 4) % 4;
      if (m === 0) block = "smooth_quartz";                  // piers
      else if (m === 3) block = "polished_andesite";         // window surrounds
      else {
        block = y < 4 ? "glass_pane" : "light_blue_stained_glass_pane";
        glass.push({ x, y, z, nx, nz, alongZ });
      }
    }
    put(x, y, z, block);
  }
}

// The entrance: a glazing bay on an axis-aligned frontage, preferring the frontage with the most such cells.
const singles = [...perim].filter(([, o]) => o.length === 1).map(([k, o]) => ({ key: k, n: o[0] }));
const bayU = (s) => { const [x, z] = s.key.split(",").map(Number); return s.n[0] !== 0 ? z : x; };
const count = (n) => singles.filter((s) => s.n.join() === n.join()).length;
const door = singles
  .filter((s) => ((bayU(s) % 4) + 4) % 4 === 1)
  .sort((a, b) => count(b.n) - count(a.n))[0];
const [doorX, doorZ] = door.key.split(",").map(Number);
const [nx, nz] = door.n;
const facing = FACE[`${-nx},${-nz}`];                        // a door faces into the building
for (const [half, y] of [["lower", 1], ["upper", 2]]) {
  put(doorX, y, doorZ, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
}
for (let i = glass.length - 1; i >= 0; i--) if (glass[i].x === doorX && glass[i].z === doorZ) glass.splice(i, 1);
// the canopy: a flat slab over the door on the wall and two posts out front
const tx = Math.abs(nz), tz = Math.abs(nx);
for (let k = 1; k <= 2; k++) for (let j = -1; j <= 1; j++) {
  const x = doorX + nx * k + tx * j, z = doorZ + nz * k + tz * j;
  if (!inF(x, z)) put(x, 3, z, "gray_concrete");
}
for (const j of [-1, 1]) {
  const x = doorX + nx * 2 + tx * j, z = doorZ + nz * 2 + tz * j;
  if (!inF(x, z)) for (let y = 0; y < 3; y++) put(x, y, z, "polished_andesite");
}

// Warm light behind some glass: on the floor slab, inside the air gap, bottom row only.
for (const g of glass) {
  if (g.y % 4 !== 1 || (g.x * 7 + g.z * 13 + g.y * 3) % 5 !== 0) continue;
  const ix = g.x - Math.sign(g.nx), iz = g.z - Math.sign(g.nz);
  if (!inF(ix, iz) || perim.has(`${ix},${iz}`) || has(ix, g.y, iz)) continue;
  put(ix, g.y, iz, (g.x + g.z) % 6 === 0 ? "shroomlight" : "glowstone");
}

// Glass panes connect along their bays to any neighbour (pane or wall), as the game would set them.
for (const g of glass) {
  const p = P.get(`${g.x},${g.y},${g.z}`);
  if (!p || !p.block.endsWith("glass_pane")) continue;
  const sides = g.alongZ ? [[0, 1, "south"], [0, -1, "north"]] : [[1, 0, "east"], [-1, 0, "west"]];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [ax, az, side] of sides) if (has(g.x + ax, g.y, g.z + az)) state[side] = "true";
  p.state = state;
}

// Plant room on the core roof: a 4 x 4 box set wholly on interior core cells, so it stands on the roof deck.
const core = [...F].filter(([k, c]) => tierOf(c) === 16 && !perim.has(k)).map(([k]) => k.split(",").map(Number));
const cx = core.reduce((s, p) => s + p[0], 0) / core.length, cz = core.reduce((s, p) => s + p[1], 0) / core.length;
let room = null;
for (let ox = 0; ox <= W - 4; ox++) for (let oz = 0; oz <= D - 4; oz++) {
  let ok = true;
  for (let i = 0; i < 4 && ok; i++) for (let j = 0; j < 4 && ok; j++) {
    const k = `${ox + i},${oz + j}`;
    ok = inF(ox + i, oz + j) && !perim.has(k) && tierOf(F.get(k)) === 16;
  }
  if (!ok) continue;
  const d = Math.hypot(ox + 1.5 - cx, oz + 1.5 - cz);
  if (!room || d < room.d) room = { ox, oz, d };
}
if (room) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const edge = i === 0 || i === 3 || j === 0 || j === 3;
    for (let y = 16; y <= 18; y++) if (edge) put(room.ox + i, y, room.oz + j, "smooth_quartz");
    put(room.ox + i, 19, room.oz + j, "gray_concrete");
  }
}

const g = new Voxels(SIZE);
for (const [k, { block, state }] of P) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const info = g.save(`${DIR}/way_363687869.nbt`);
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, door: [doorX, doorZ, facing], glass: glass.length, plantRoom: room && [room.ox, room.oz] }));
