// OpenStreetMap through the Overpass API: worldwide. ODbL 1.0, so wherever a build made with it is shown, credit
// "© OpenStreetMap contributors". Gives what city portals often lack (footpaths, steps, mapped trees, small water) and,
// where no city layer exists, building outlines (with height or building:levels when tagged) and streets. And the street's
// furnishings for the dressing pass (dress.mjs): tram rails, street lamps, benches, bollards, railings and fences,
// platforms, piers, lawns and gardens.
const ODBL = "ODbL 1.0 (credit \"© OpenStreetMap contributors\")";
async function overpass(query) {
  for (let wait = 2000; ; wait *= 2) {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "user-agent": "mc-design irl-copy/0.1" }, body: new URLSearchParams({ data: query }) });
    if (r.ok) return (await r.json()).elements;
    if (wait > 64000) throw new Error(`Overpass: ${r.status}`);
    await new Promise((ok) => setTimeout(ok, wait));                    // the public server is often busy: back off
  }
}
const feature = (e) => ({ type: "Feature", properties: { osm: `${e.type}/${e.id}`, ...e.tags },
  geometry: e.type === "node" ? { type: "Point", coordinates: [e.lon, e.lat] }
    : (e.geometry ?? []).length > 3 && e.geometry[0].lat === e.geometry.at(-1).lat && e.geometry[0].lon === e.geometry.at(-1).lon && !e.tags?.barrier
      && (e.tags?.building || /^(farmland|meadow|orchard)$/.test(e.tags?.landuse ?? "") || /^(water|scrub|grassland)$/.test(e.tags?.natural ?? "") || e.tags?.leisure || e.tags?.landuse || e.tags?.area === "yes" || e.tags?.man_made === "pier" || e.tags?.public_transport === "platform" || e.tags?.railway === "platform")
      ? { type: "Polygon", coordinates: [e.geometry.map((p) => [p.lon, p.lat])] } : { type: "LineString", coordinates: (e.geometry ?? []).map((p) => [p.lon, p.lat]) } });
const fc = (features) => ({ type: "FeatureCollection", features });

export default [{
  id: "osm", layers: ["paths", "trees", "water", "playgrounds", "buildings", "streets", "rails", "furniture", "barriers", "platforms", "piers", "greens", "fields"], name: "OpenStreetMap (Overpass API)", licence: ODBL,
  attribution: "© OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", covers: () => true,
  async fetch(place, { box: b }) {
    const bb = `${b.south},${b.west},${b.north},${b.east}`;
    const els = await overpass(`[out:json][timeout:90];(way["highway"](${bb});node["natural"="tree"](${bb});way["natural"="water"](${bb});way["leisure"~"playground|pitch"](${bb});way["building"](${bb});`
      + `way["railway"~"^(tram|light_rail)$"](${bb});node["highway"~"^(street_lamp|crossing)$"](${bb});node["amenity"~"^(bench|waste_basket|bicycle_parking|drinking_water|fountain)$"](${bb});`
      + `node["barrier"="bollard"](${bb});node["leisure"="picnic_table"](${bb});way["barrier"~"^(fence|railing|wall|hedge|guard_rail)$"](${bb});`
      + `way["railway"="platform"](${bb});way["public_transport"="platform"](${bb});way["man_made"~"^(pier|breakwater)$"](${bb});`
      + `way["landuse"~"^(farmland|meadow|orchard)$"](${bb});way["leisure"~"^(park|garden)$"](${bb});way["landuse"~"^(grass|flowerbed|village_green)$"](${bb});way["natural"="scrub"](${bb}););out geom;`);
    const f = els.map(feature), t = (e) => e.properties;
    const levels = (p) => (p.height ? parseFloat(p.height) : p["building:levels"] ? 3.2 * parseFloat(p["building:levels"]) : 8);
    return {
      paths: fc(f.filter((e) => /^(footway|path|pedestrian|steps|cycleway)$/.test(t(e).highway ?? ""))),
      trees: fc(f.filter((e) => t(e).natural === "tree")),
      water: fc(f.filter((e) => t(e).natural === "water")),
      playgrounds: fc(f.filter((e) => /playground|pitch/.test(t(e).leisure ?? ""))),
      buildings: fc(f.filter((e) => t(e).building).map((e) => ({ ...e, properties: { id: t(e).osm, height: levels(t(e)), peak: null, name: t(e).name ?? null } }))),
      streets: fc(f.filter((e) => /^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service)$/.test(t(e).highway ?? ""))
        .map((e) => ({ ...e, properties: { name: t(e).name ?? t(e).highway, osm: t(e).osm, highway: t(e).highway, ...Object.fromEntries(["bridge", "layer", "min_height", "tunnel", "service", "surface"].filter((k) => t(e)[k] != null).map((k) => [k, t(e)[k]])) } }))),
      // the furnishings, tags kept whole (dress.mjs reads them)
      rails: fc(f.filter((e) => /^(tram|light_rail)$/.test(t(e).railway ?? "") && e.geometry.type === "LineString")),
      furniture: fc(f.filter((e) => e.geometry.type === "Point" && (/^(street_lamp|crossing)$/.test(t(e).highway ?? "") || t(e).amenity || t(e).barrier === "bollard" || t(e).leisure === "picnic_table"))),
      barriers: fc(f.filter((e) => t(e).barrier && e.geometry.type === "LineString")),
      platforms: fc(f.filter((e) => (t(e).railway === "platform" || t(e).public_transport === "platform") && e.geometry.type !== "Point")),
      piers: fc(f.filter((e) => /^(pier|breakwater)$/.test(t(e).man_made ?? ""))),
      fields: fc(f.filter((e) => e.geometry.type === "Polygon" && /^(farmland|meadow|orchard)$/.test(t(e).landuse ?? ""))),
      greens: fc(f.filter((e) => e.geometry.type === "Polygon" && (/^(park|garden)$/.test(t(e).leisure ?? "") || t(e).landuse || t(e).natural === "scrub"))),
    };
  },
}];
