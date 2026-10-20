import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001346";

// 233 Water Street, South Street Seaport: a 1930 institutional building of
// load-bearing brick on a granite base, with stone string courses, a cornice
// and a continuous brick parapet. Four storeys on one smoothed roof level.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, H = 20, D = 16;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(`${x},${z}`, { ground, roof });

// Smooth the lidar roof to a single level (median), so the massing is flat-topped.
const roofs = [...map.values()].map((c) => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

const inFp = (x, z) => map.has(`${x},${z}`);
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];
const outFaces = (x, z) => FACES.filter((f) => !inFp(x + f.dx, z + f.dz));

// Street-facing side: the outward face carried by the most wall cells.
const faceCount = {};
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  const of = outFaces(x, z);
  if (of.length) faceCount[of[0].name] = (faceCount[of[0].name] || 0) + 1;
}
const entranceName = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const entranceU = [];
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  const of = outFaces(x, z);
  if (of.length && of[0].name === entranceName) {
    entranceU.push(entranceName === "north" || entranceName === "south" ? x : z);
  }
}
entranceU.sort((a, b) => a - b);
const doorU = entranceU[Math.floor(entranceU.length / 2)];

const paneProps = (face) =>
  face.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [k, { ground }] of map) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  // Storeys in 2-block steps up to the smoothed roof level.
  let h = Math.max(4, 2 * Math.round((medRoof - ground) / 2));
  while (ground + h > 18 && h > 4) h -= 2;

  const of = outFaces(x, z);
  const perim = of.length > 0;
  const face = perim ? of[0] : null;
  const u = perim ? (face.dz !== 0 ? x : z) : -1;
  const onEntrance = perim && face.name === entranceName;
  const isDoorCell = onEntrance && u === doorU;

  for (let r = 0; r < h; r++) {
    const y = ground + r;

    if (perim) {
      let block = "bricks";
      let props = null;
      if (r === 0) block = "polished_granite";
      else if (r === h - 1) block = "smooth_stone";
      else if (r % 2 === 0) block = "bricks";
      else if (u % 3 === 0) block = "bricks";
      else {
        block = "glass_pane";
        props = paneProps(face);
      }
      g.set(x, y, z, block, props || undefined);

      // Entrance: double door, glazed shopfront flanking it, stone lintel above
      if (onEntrance) {
        if (r === 1 && Math.abs(u - doorU) === 1) {
          g.set(x, y, z, "glass_pane", paneProps(face));
        }
        if (isDoorCell && (r === 1 || r === 2)) {
          g.set(x, y, z, "dark_oak_door", {
            facing: face.name,
            half: r === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        }
        if (isDoorCell && r === 3) g.set(x, y, z, "smooth_stone");
      }
    } else {
      // Interior: floor slabs per storey and the roof slab; air otherwise
      if (r % 2 === 0 || r === h - 1) g.set(x, y, z, "smooth_stone");
    }
  }

  // Continuous brick parapet one block above the cornice on the wall ring
  if (perim) g.set(x, ground + h, z, "bricks");

  // Warm light behind some windows (interior cell just inside the wall)
  if (perim && u % 3 !== 0) {
    const ix = x - face.dx, iz = z - face.dz;
    if (inFp(ix, iz) && outFaces(ix, iz).length === 0) {
      const wr = [1, 3, 5].filter((r) => r < h - 1);
      if (u % 6 === 1 && wr.includes(1)) {
        g.set(ix, ground + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      } else if (u % 6 === 4 && wr.includes(3)) {
        g.set(ix, ground + 3, iz, "shroomlight");
      }
      if (u % 6 === 2 && wr.includes(5)) {
        g.set(ix, ground + 5, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
