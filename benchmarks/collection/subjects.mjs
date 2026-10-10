// Fresh benchmark subjects for the collection pipeline: deliberately varied themes, styles, sizes and materials, so the
// tools are tested beyond one district's palette. 1:1 scale (a player is 2 blocks tall).
export const SUBJECTS = {
  "tea-house": { name: "Japanese tea house", size: { w: 13, d: 11, h: 9 },
    what: "a small Japanese tea house in a garden: raised timber floor on stone footings, sliding paper-screen walls (white panels in dark timber frames), a deep hipped-and-gabled roof with curved eaves in dark tiles, an engawa veranda, stepping stones, a stone lantern and a maple" },
  "desert-market": { name: "Desert adobe market hall", size: { w: 17, d: 13, h: 9 },
    what: "an adobe market hall in a desert town: thick rounded sandstone/terracotta walls, a flat roof with a parapet and protruding wooden vigas (beam ends), shaded arcade with striped cloth awnings, clay pots and woven baskets, a small dome or wind tower" },
  "stave-church": { name: "Nordic stave church", size: { w: 13, d: 17, h: 22 },
    what: "a Norwegian stave church: dark tarred timber, stacked steep roofs in tiers with shingles, carved dragon-head gable ends, a small spire, an open gallery (svalgang) around the ground floor, a stone base" },
  "lighthouse": { name: "Coastal lighthouse and keeper's cottage", size: { w: 15, d: 15, h: 28 },
    what: "a round striped lighthouse tower (white and red) on a rocky base with a lantern room (glass, railing gallery, cap) and an attached small keeper's cottage with a pitched roof and chimney" },
  "wizard-tower": { name: "Fantasy wizard tower", size: { w: 13, d: 13, h: 30 },
    what: "a crooked fantasy wizard tower: stone base, timber-framed upper floors that jetty outward, a tall conical roof with a slight lean, small round windows, a balcony with a telescope, lanterns, ivy and a glowing window" },
  "glass-cafe": { name: "Modern glass café", size: { w: 17, d: 13, h: 8 },
    what: "a modern single-storey café: floor-to-ceiling glass on two sides, slim dark steel frame, a cantilevered flat roof with a timber soffit, a concrete plinth, outdoor terrace with tables, planters and a neon-style sign" },
  "red-barn": { name: "Farm barn", size: { w: 15, d: 21, h: 14 },
    what: "a classic red farm barn: gambrel roof, big sliding double doors with white X-braced trim, a hay loft door with a hoist beam, a small cupola with a weather vane, a stone foundation, hay bales and a fence" },
  "steampunk-workshop": { name: "Steampunk workshop", size: { w: 17, d: 15, h: 14 },
    what: "a steampunk inventor's workshop: brick and riveted copper walls, a sawtooth or curved roof with skylights, big gear-shaped round window, tall chimney stacks, pipes and valves on the walls, a loading door with a crane" },
};

export function conceptPrompt(s) {
  return [
    "Minecraft builder reference sheet for ONE building, vanilla Minecraft blocks only, crisp voxel style, plain light background, no characters, no street scene.",
    "Two views side by side: LEFT a straight-on FRONT ELEVATION; RIGHT a three-quarter view at the same scale.",
    `Subject: ${s.name}: ${s.what}.`,
    `Size: about ${s.size.w} blocks wide, ${s.size.d} deep, ${s.size.h} tall; 1:1 scale, a player is 2 blocks tall (doors 2 tall, storeys 4).`,
    "Skilled human builder quality: real massing, depth, framed openings, real roof edges, sub-block detail.",
  ].join(" ");
}
