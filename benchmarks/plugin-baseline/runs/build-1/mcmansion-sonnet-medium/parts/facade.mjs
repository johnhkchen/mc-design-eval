// P4 facade: portico (columns, entablature, ceiling, landing, lanterns), the entry and back doors with fanlight and
// sidelights, the palladian windows, every arch window in OPENINGS with its sill and hood, the three carriage doors,
// and the garage lamp posts. Builds only into air: the shells leave every opening empty, and the portico footprint is
// RESERVED for this part.
import { B, OPENINGS, archOpening, carriageDoor, entryDoor, lampPost, openingsOf, portico } from "../vocab.mjs";

export function build(g) {
  const free = unclaimed(g);
  portico(free);
  // Portico lanterns at the two inner bays too (plan Part 4); the vocab already hangs them at x26..27.
  free.set(24, 8, 8, ...B.lantern(true));
  free.set(29, 8, 8, ...B.lantern(true));

  // Entry (z=11) and back door (z=25): doors, sidelights, transom, fan, springers.
  for (const o of openingsOf("entry")) entryDoor(free, o);

  // Glazing with springers, sills and hoods. Interior arches (kind arch) and cased openings stay open.
  for (const o of OPENINGS) if (o.kind === "window" || o.kind === "palladian") archOpening(free, o);

  // Three carriage bays on the street front (z=7).
  for (const x0 of [3, 8, 13]) carriageDoor(free, x0);

  // Lamp posts on the garage piers, between the bays.
  lampPost(free, 7, 6);
  lampPost(free, 12, 6);
}

// The roof prism and its eave already hold cells the facade's windows, hoods and portico reach into (runParts would refuse
// those writes). Drop them here instead: a write into a cell above ground that already holds a block, and that this part
// did not place itself, is skipped. Ground (y=0) and the facade's own cells stay writable.
function unclaimed(g) {
  const mine = new Set();
  const place = (x, y, z, block, state, nbt) => {
    const k = `${x},${y},${z}`;
    if (y > 0 && !mine.has(k) && !g.isAir(x, y, z)) return;
    mine.add(k);
    g.set(x, y, z, block, state, nbt);
  };
  const free = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { place(x, y, z, block, state, nbt); return free; };
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) place(x, y, z, block, state);
        return free;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return free;
}
