// Part 2, portal and forecourt: the E portal's piers and lintel (x 62 face), the forecourt paving at y 1 with its joint
// lines, the two granite pylons, the Atlas plinth, and the lit lobby behind the portal glass (a lit ceiling at y 16 and
// a gold floor strip at y 1). The paving uplights belong to the Atlas part. The shell leaves the portal and lobby cells as air, so this part only
// writes into air, except the paving and lobby floor, which are the ground course (set before the parts, so writable).
import { portal_bay, plinth, pylon, PLINTH, ROOF_DECK, LIT, GOLD, FORECOURT, LOBBY, PORTAL, PLINTH_BOX } from "../vocab.mjs";

// the forecourt paving at y 1: polished_andesite with smooth_stone joint lines every 3 cells
function paving(g) {
  const { x0, x1, z0, z1, y } = FORECOURT;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const joint = (x - x0) % 3 === 2 || (z - z0) % 3 === 2;
      g.set(x, y, z, joint ? ROOF_DECK : PLINTH);
    }
}

// the lobby behind the portal glass: a lit ceiling over the whole room, and a gold floor strip along its middle
function lobby(g) {
  const { x0, x1, z0, z1, ceilingY } = LOBBY;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) g.set(x, ceilingY, z, LIT);
  const mid = Math.floor((z0 + z1) / 2);
  for (let x = x0; x <= x1; x++)
    for (let z = mid; z <= mid + 1; z++) g.set(x, 1, z, GOLD);
}

export function build(g) {
  const out = [];
  out.push(portal_bay(g, { x: PORTAL.x1, z0: PORTAL.z0, y0: PORTAL.y0 }));
  paving(g);
  out.push(pylon(g, 66, 20, 2), pylon(g, 66, 34, 2));
  out.push(plinth(g, { x0: PLINTH_BOX.x0, z0: PLINTH_BOX.z0, x1: PLINTH_BOX.x1, z1: PLINTH_BOX.z1, y0: PLINTH_BOX.y0 }));
  lobby(g);
  return out;
}
