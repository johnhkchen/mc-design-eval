// Landings facades and dusk lighting: corner glass bays, loggia balconies, shopfronts with awnings, upper windows,
// lanterns under the awnings and shroomlight behind the glass. Every write is into air (the shell's stucco stays).
import { cornerBay, loggia, shopBay, awning, lanternRow, LANDINGS, CORNER_BAYS, groundAt } from "../vocab.mjs";

// the upper floors of a block: floor 6 then every 4 (shop storey is 1..5)
const upperFloors = (storeys) => Array.from({ length: storeys - 1 }, (_, i) => 6 + 4 * i);

// inward direction of each face (into the block)
const INWARD = { east: [-1, 0], west: [1, 0], north: [0, 1], south: [0, -1] };

// the blocks that stand on the landings footprint (not penthouses)
const BLOCKS = LANDINGS.filter((b) => !b.penthouse);
const insideAnyBlock = (x, z) => BLOCKS.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);

// the block whose east or west face sits at x
const blockAt = (x, z0) => BLOCKS.find((b) => (b.x1 === x || b.x0 === x) && z0 >= b.z0 && z0 <= b.z1);

export function build(g) {
  const put = (x, y, z, block) => {
    if (groundAt(x, z) === null) return false;
    if (!g.isAir(x, y, z)) return false;
    g.set(x, y, z, block);
    return true;
  };

  // 1. corner glass bays on the street blocks, wrapped round the corner toward the nearer end
  for (const cb of CORNER_BAYS) {
    const b = blockAt(cb.x, cb.z0);
    const wrap = cb.z0 - b.z0 <= 2 ? "north" : "south";
    cornerBay(g, cb.x, cb.z0, cb.z1, { top: b.roofY, face: "east", wrap });
  }

  // 2. loggia balconies (2 deep, recessed) on the mid blocks, the south and north exposed faces, and the spines
  const LOGGIAS = [
    { face: "north", plane: 12, starts: [199, 205, 211, 217], floors: upperFloors(5) },
    { face: "south", plane: 38, starts: [199, 205, 211, 217], floors: upperFloors(5) },
    { face: "north", plane: 75, starts: [199, 205, 211, 217], floors: upperFloors(5) },
    { face: "south", plane: 104, starts: [199, 205, 211, 217], floors: upperFloors(5) },
    { face: "east", plane: 239, starts: [40, 46, 52, 58, 64, 70], floors: upperFloors(4) },
    { face: "north", plane: 9, starts: [269, 275, 281, 287], floors: upperFloors(5) },
    { face: "south", plane: 35, starts: [269, 275, 281, 287], floors: upperFloors(5) },
    { face: "north", plane: 69, starts: [269, 275, 281], floors: upperFloors(5) },
    { face: "east", plane: 306, starts: [37, 43, 49, 55, 61], floors: upperFloors(4) },
  ];
  const recess = new Set();
  const cellAt = (face, plane, d, t, y) => {
    const [ix, iz] = INWARD[face];
    return face === "east" || face === "west" ? [plane + ix * d, y, t] : [t, y, plane + iz * d];
  };
  for (const L of LOGGIAS) {
    for (const f of L.floors) for (const s of L.starts) {
      loggia(g, L.face, s, f, L.plane);
      for (let d = 0; d <= 1; d++) for (let t = s; t <= s + 3; t++) for (let y = f + 1; y <= f + 3; y++) {
        recess.add(cellAt(L.face, L.plane, d, t, y).join(","));
      }
    }
  }

  // 3. shopfronts with awnings and lanterns on the street faces (ground storey)
  const SHOPS = [
    { face: "east", plane: 239, pos: [13, 19, 25, 31] },   // plot 2 A
    { face: "east", plane: 239, pos: [76, 82, 88, 94] },   // plot 2 D
    { face: "east", plane: 239, pos: [40, 46, 59, 65] },   // plot 2 spine C
    { face: "east", plane: 309, pos: [10, 16, 22, 28] },   // plot 3 A
    { face: "east", plane: 303, pos: [70, 76] },           // plot 3 D
    { face: "east", plane: 306, pos: [37, 43, 53, 59] },   // plot 3 spine C
  ];
  for (const S of SHOPS) {
    // plot 3 east faces sit on the grid edge (x 309): the awning is flush (no proud cell)
    const proud = S.plane >= 309 ? 0 : 1;
    const lanterns = [];
    for (const p of S.pos) {
      shopBay(g, S.face, S.plane, p);
      awning(g, S.face, { plane: S.plane, from: p, to: p + 4 }, { y: 5, proud });
      lanterns.push([S.plane + proud, 3, p + 2]);
    }
    lanternRow(g, lanterns);
  }

  // 4. two-wide glass windows every 3 cells on each exposed face of each block, every upper storey
  for (const b of BLOCKS) {
    const faces = [
      { face: "east", plane: b.x1, t0: b.z0, t1: b.z1 },
      { face: "west", plane: b.x0, t0: b.z0, t1: b.z1 },
      { face: "north", plane: b.z0, t0: b.x0, t1: b.x1 },
      { face: "south", plane: b.z1, t0: b.x0, t1: b.x1 },
    ];
    const floors = upperFloors(b.storeys);
    for (const F of faces) {
      const [ix, iz] = INWARD[F.face];
      const across = F.face === "east" || F.face === "west";
      for (let t = F.t0 + 1; t < F.t1; t++) {
        const idx = t - F.t0 - 1;
        if (idx % 3 === 2) continue;                       // the solid pier between windows
        const [x, , z] = across ? [F.plane, 0, t] : [t, 0, F.plane];
        const ox = across ? (F.face === "east" ? 1 : -1) : 0;
        const oz = across ? 0 : (F.face === "north" ? -1 : 1);
        if (insideAnyBlock(x + ox, z + oz)) continue;      // shared wall with a neighbour
        for (const f of floors) for (const y of [f + 1, f + 2]) {
          if (recess.has(`${x},${y},${z}`)) continue;
          put(x, y, z, "glass");
          if (idx % 6 === 0) put(x + ix, y, z + iz, "shroomlight");
        }
      }
    }
  }
}
