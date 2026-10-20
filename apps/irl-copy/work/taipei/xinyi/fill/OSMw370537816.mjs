import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370537816";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 80 x 17 footprint, late-1990s Xinyi office block: tiled piers, blue-tinted
// glazing, grey spandrels, granite base, shopfront ground floor with two-bay
// entrances and canopies, seven 5-block storeys, flat roof, parapet, plant.
const W = 80, H = 47, D = 17;
const ROOF = 35;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const minG = Math.min(...G.values());
const roofY = minG + ROOF;

const DOOR_X = [10, 40, 70];   // entrances on the south (z = max) frontage

function faces(x, z) {
  return {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}

// Pass 1: foundation, floors, facade, roof deck
for (const [x, z] of cells) {
  const gr = ground(x, z);
  const { N, S, W: Wf, E } = faces(x, z);
  const ext = N || S || Wf || E;
  // Two-cell piers at every fourth cell give a stronger bay rhythm
  const pier =
    ((N || S) && (x % 4 === 0 || x % 4 === 1)) ||
    ((Wf || E) && (z % 4 === 0 || z % 4 === 1));

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= roofY; y++) {
    const r = y % 5;
    const k = Math.floor(y / 5);

    if (y === roofY) {
      g.set(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!ext) continue;   // air gap behind the glass

    if (r === 4) {
      // Ground storey sign band is stone; upper storeys are grey spandrels
      g.set(x, y, z, k === 0 ? "smooth_stone" : "light_gray_concrete");
    } else {
      // Ground storey: glazed shopfront between stone piers
      // Upper storeys: glazing between white tiled piers
      if (k === 0) {
        g.set(x, y, z, pier ? "stone_bricks" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    }
  }

  // Parapet
  if (ext) {
    g.set(x, roofY + 1, z, "white_concrete");
    g.set(x, roofY + 2, z, "white_concrete");
  }

  // Granite base course at grade on the exposed edge
  if (ext) g.set(x, gr, z, "polished_granite");
}

// Pass 2: entrances with doors, flanking piers and a canopy band
for (const [x, z] of cells) {
  const gr = ground(x, z);
  const { S } = faces(x, z);
  if (!S) continue;
  for (const dx of DOOR_X) {
    if (Math.abs(x - dx) <= 1 && has(x, z)) {
      // Canopy/lintel band across the three-cell entrance bay
      g.set(x, gr + 3, z, "polished_granite");
      g.set(x, gr + 4, z, "light_gray_concrete");
    }
  }
  if (DOOR_X.includes(x)) {
    const doorProps = (half) => ({
      facing: "south",
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    g.set(x, gr + 1, z, "dark_oak_door", doorProps("lower"));
    g.set(x, gr + 2, z, "dark_oak_door", doorProps("upper"));
  }
}

// Pass 3: warm lights behind glass (glowstone in the air gap)
for (const [x, z] of cells) {
  const { N, S, W: Wf, E } = faces(x, z);
  if (!(N || S || Wf || E)) continue;
  if (x % 8 !== 2) continue;
  let ix = x, iz = z;
  if (N) iz = z + 1;
  else if (S) iz = z - 1;
  else if (Wf) ix = x + 1;
  else if (E) ix = x - 1;
  if (!has(ix, iz)) continue;
  const inner = faces(ix, iz);
  if (inner.N || inner.S || inner.W || inner.E) continue;
  const gr2 = ground(ix, iz);
  for (let k = 1; k <= 6; k += 2) {
    const y = k * 5 + 2;
    if (y > gr2 && y < roofY) g.set(ix, y, iz, "glowstone");
  }
}

// Pass 4: roof plant penthouse on the central roof
const PX0 = 30, PX1 = 46, PZ0 = 5, PZ1 = 11;
let plantOk = true;
for (let x = PX0; x <= PX1 && plantOk; x++)
  for (let z = PZ0; z <= PZ1; z++)
    if (!has(x, z)) { plantOk = false; break; }

if (plantOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      g.set(x, roofY + 1, z, "light_gray_concrete");
      g.set(x, roofY + 4, z, "light_gray_concrete");
      if (edge) {
        g.set(x, roofY + 2, z, "white_concrete");
        g.set(x, roofY + 3, z, "light_blue_stained_glass");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
