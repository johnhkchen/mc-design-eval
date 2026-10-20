import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1159644356";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Low-rise 1970s-80s Xinyi commercial block: two storeys of glazed shopfront/office
// over a stone base, white-concrete piers, storey lines, parapet and roof plant.
const W = 23, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const occ = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => occ.has(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const L = Math.min(...cells.map(c => Math.round(c[2]))); // lowest ground = y 0 of the building
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const centreX = Math.round((minX + maxX) / 2);

const isPerim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Pass 1: foundations, walls, floors, roof deck, parapet, entrance
for (const [x, z, g0] of cells) {
  const gr = Math.round(g0);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

  if (out.length === 0) {
    // Interior: floor slab at storey line and roof deck, no interior fit-out
    if (L + 5 >= gr) put(x, L + 5, z, "smooth_stone");
    if (L + 10 >= gr) put(x, L + 10, z, "light_gray_concrete");
    continue;
  }

  const corner = out.length >= 2;
  const [, , face] = out[0];
  const t = (face === "north" || face === "south") ? x : z;
  const pier = corner || t % 3 === 0;
  const entrance = face === "south" && !corner && x === centreX;

  // Facade rows 0..9 (two storeys of 5), parapet cap at row 10
  for (let r = 0; r <= 9; r++) {
    const y = L + r;
    if (y < gr) continue;
    let b;
    if (r === 0 || y === gr) b = "stone_bricks";          // base course
    else if (r === 4 || r === 9) b = "light_gray_concrete"; // spandrels / sills
    else if (r === 5) b = "smooth_stone";                  // storey line
    else b = pier ? "white_concrete" : "light_blue_stained_glass"; // glazing bays

    if (entrance && (r === 1 || r === 2)) b = "air";        // open doorway
    if (entrance && r === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (b === "air") continue;
    put(x, y, z, b);
  }

  // Parapet cap on the perimeter
  if (L + 10 >= gr) put(x, L + 10, z, "smooth_stone");
}

// Pass 2: warm light behind some ground/upper glazing (interior cell just inside the glass)
for (const [x, z, g0] of cells) {
  if (!isPerim(x, z)) continue;
  const gr = Math.round(g0);
  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (out.length !== 1) continue;
  const [dx, dz, face] = out[0];
  const t = (face === "north" || face === "south") ? x : z;
  if (t % 3 === 0 || t % 6 !== 2) continue;
  if (face === "south" && x === centreX) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (const r of [2, 7]) {
    const y = L + r;
    if (y < Math.round(g0)) continue;
    const yi = y;
    if (yi < Math.round(cells.find(c => c[0] === ix && c[1] === iz)?.[2] ?? 0)) continue;
    put(ix, yi, iz, r === 2 ? "glowstone" : "shroomlight");
  }
}

// Roof plant: a central penthouse block on the roof deck
for (const [x, z, g0] of cells) {
  if (isPerim(x, z)) continue;
  if (Math.abs(x - 11) > 2 || Math.abs(z - 11) > 2) continue;
  if (L + 10 >= Math.round(g0)) put(x, L + 11, z, "light_gray_concrete");
}

g.save(`${dir}/${id}.nbt`);
