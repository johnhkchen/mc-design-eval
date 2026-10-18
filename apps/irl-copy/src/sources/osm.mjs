// OpenStreetMap through the Overpass API: worldwide. ODbL 1.0, so wherever a build made with it is shown, credit
// "© OpenStreetMap contributors". Gives what city portals often lack (footpaths, steps, mapped trees, small water) and,
// where no city layer exists, building outlines (with height or building:levels when tagged) and streets.
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
    : (e.geometry ?? []).length > 3 && e.geometry[0].lat === e.geometry.at(-1).lat && e.geometry[0].lon === e.geometry.at(-1).lon && (e.tags?.building || e.tags?.natural === "water" || e.tags?.leisure)
      ? { type: "Polygon", coordinates: [e.geometry.map((p) => [p.lon, p.lat])] } : { type: "LineString", coordinates: (e.geometry ?? []).map((p) => [p.lon, p.lat]) } });
const fc = (features) => ({ type: "FeatureCollection", features });

export default [{
  id: "osm", layers: ["paths", "trees", "water", "playgrounds", "buildings", "streets"], name: "OpenStreetMap (Overpass API)", licence: ODBL,
  attribution: "© OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", covers: () => true,
  async fetch(place, { box: b }) {
    const bb = `${b.south},${b.west},${b.north},${b.east}`;
    const els = await overpass(`[out:json][timeout:90];(way["highway"](${bb});node["natural"="tree"](${bb});way["natural"="water"](${bb});way["leisure"~"playground|pitch"](${bb});way["building"](${bb}););out geom;`);
    const f = els.map(feature), t = (e) => e.properties;
    const levels = (p) => (p.height ? parseFloat(p.height) : p["building:levels"] ? 3.2 * parseFloat(p["building:levels"]) : 8);
    return {
      paths: fc(f.filter((e) => /^(footway|path|pedestrian|steps|cycleway)$/.test(t(e).highway ?? ""))),
      trees: fc(f.filter((e) => t(e).natural === "tree")),
      water: fc(f.filter((e) => t(e).natural === "water")),
      playgrounds: fc(f.filter((e) => /playground|pitch/.test(t(e).leisure ?? ""))),
      buildings: fc(f.filter((e) => t(e).building).map((e) => ({ ...e, properties: { id: t(e).osm, height: levels(t(e)), peak: null, name: t(e).name ?? null } }))),
      streets: fc(f.filter((e) => /^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service)$/.test(t(e).highway ?? ""))
        .map((e) => ({ ...e, properties: { name: t(e).name ?? t(e).highway } }))),
    };
  },
}];
