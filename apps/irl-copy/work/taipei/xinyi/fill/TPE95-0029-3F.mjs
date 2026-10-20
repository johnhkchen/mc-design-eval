import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE95-0029-3F: 2006 Xinyi mid-rise office/residential block.
// Blue-tinted glass curtain wall on white concrete mullions, grey spandrels,
// stone-clad podium with a three-bay entrance shopfront, lit windows, plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0029-3F";
const W = 11, D = 18, H = 71;
const ROOF = 58;        // top structural slab, ~59 blocks above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north" },
  { name: "south", dx: 0, dz: 1, facing: "south" },
  { name: "west", dx: -1, dz: 0, facing: "west" },
  { name: "east", dx: 1, dz: 0, facing: "east" },
];
const exposedFace = (x, z) => FACES.find((f) => !has(x + f.dx, z + f.dz)) ?? null;
const isPerim = (x, z) => exposedFace(x, z) !== null;

const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass_pane";
const SPANDREL = "gray_concrete";
const MULLION = "white_concrete";
const SLAB = "light_gray_concrete";
const doorU = Math.floor(W / 2);

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Storey lines for this column, evenly spread so the top lands on ROOF.
  const N = Math.max(1, Math.round((ROOF - gy) / STOREY));
  const line = (k) => gy + Math.round((k * (ROOF - gy)) / N);

  for (let k = 0; k <= N; k++) {
    g.set(x, line(k), z, k === 0 ? "polished_granite" : SLAB);
  }

  const face = exposedFace(x, z);
  if (face) {
    const u = face.dz === 0 ? x : z;
    const ix = x - face.dx, iz = z - face.dz;
    const inwardInterior = has(ix, iz) && !isPerim(ix, iz);
    const paneProps = face.dz === 0
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };

    // Entrance bay: the south face's centre three columns on the ground floor
    // are a glass shopfront with no mullions, so the door reads from the street.
    const entranceBay = face.name === "south" && Math.abs(u - doorU) <= 1;

    for (let k = 0; k < N; k++) {
      const L = line(k);
      const h = line(k + 1) - L;
      for (let w = 0; w <= h - 2; w++) {
        const y = L + 1 + w;
        const isLastRow = w === h - 2;
        const isSpandrel = w === 0 || isLastRow;

        if (k === 0 && w === 0) {
          g.set(x, y, z, "stone_bricks");            // podium base course
          continue;
        }
        if (k === 0 && entranceBay && !isLastRow) {
          g.set(x, y, z, GLASS, paneProps);           // open shopfront bay
          continue;
        }
        if (isSpandrel) {
          g.set(x, y, z, u % 2 === 0 ? MULLION : SPANDREL);
          continue;
        }
        if (u % 2 === 0) {
          g.set(x, y, z, MULLION);
          continue;
        }
        g.set(x, y, z, GLASS, paneProps);

        // Warm light behind some windows.
        if (w === 1 && inwardInterior && (u + k * 2) % 5 === 1) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }

    // Parapet / cornice on the roof edge.
    g.set(x, ROOF + 1, z, MULLION);
    g.set(x, ROOF + 2, z, MULLION);
  }
}

// Entrance: door centred in the shopfront bay, with warm light just inside.
{
  const z = D - 1;
  const x = doorU;
  if (has(x, z) && exposedFace(x, z)?.name === "south") {
    const L0 = Math.round(0); // ground line for this column
    const gy = ground.get(`${x},${z}`);
    const N = Math.max(1, Math.round((ROOF - gy) / STOREY));
    const base = gy; // k=0 line
    void L0; void N;
    g.set(x, base + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, base + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Warm light inside the lobby behind the entrance bay.
    for (const dx of [-1, 1]) {
      if (has(x + dx, z - 1) && !isPerim(x + dx, z - 1)) {
        g.set(x + dx, base + 2, z - 1, "glowstone");
      }
    }
  }
}

// Rooftop plant penthouse, set back from the edges, resting on the roof slab.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 3 && x <= W - 4 && z >= 4 && z <= D - 5) {
    g.set(x, ROOF + 1, z, SPANDREL);
    for (let y = ROOF + 2; y <= ROOF + 4; y++) g.set(x, y, z, SLAB);
  }
}

// Small antenna on the penthouse centreline.
if (has(5, 9)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) g.set(5, y, 9, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
