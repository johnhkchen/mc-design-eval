`facade.nbt` is written (56×48×24, faces south). It's a triumphal-arch front, taken from the concept sheet. I kept round 2, which reads closer to the concept than round 1. Round 2 is still visibly rougher than the concept, mainly the spandrels and the frieze.

**Palette.**
- Teal is oxidized copper, with warped planks as the dark accent.
- Orange is red sandstone.
- The yellow zone is yellow terracotta.
- Cream is end-stone bricks and cut sandstone.
- Honeycomb blocks form the gold rondels in the attic.

**Form.**
- **Piers:** two piers, 17 wide, on a stepped teal plinth. The cream base and orange ledge sit under a sculpture field, and a teal and orange group stands on a pedestal in each.
- **Arch:** a 16-wide opening with a round arch, a vaulted passage with teal ribs, a keystone, and an orange archivolt ring with a teal inner band.
- **Upper zones, bottom to top:**
  - a teal and orange impost band;
  - a yellow zone with teal-framed relief panels;
  - a teal frieze;
  - orange dentils and a projecting cornice;
  - an attic of 13 teal pilasters with gold rondels;
  - a crenellated teal parapet.
- **Relief:** the wall face is at z=17 and the cornice reaches z=23.
- **Method:** I authored it as code in `build.mjs`, painting the left half and mirroring it about x=27.5.

**Round 2 fixes.** Both rounds were compared side by side with the concept.
- The roof top was showing yellow; it is now teal and orange.
- The cream was grey-tan; it is now a warmer pale cream.
- The arch ring was too thick and checkered; it is now a thin teal and orange ring.
- The corbel teeth on the cornice were chunky; they are now orange dentils.

**Known gaps against the concept.**
- The sculptures and relief panels are coarser and busier than the concept's.
- The yellow reads more mustard than the concept's bright yellow, and there is less of it because the spandrels are busier.
- I did not add the small side arch on the passage walls that the 3/4 view shows.
- I didn't run `mcd check`, since there is no function to protect; `mcd info` lists 29,046 blocks and no unknown ids.

Files are in the working directory:
- facade.nbt
- build.mjs
- facade-sheet.png
- tiles/
- work/cmp1.png (round 1 against the concept)
- work/cmp2.png (round 2 against the concept)
- work/build_r1.mjs
- work/facade_r1.nbt