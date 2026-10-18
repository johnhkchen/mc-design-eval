// A place's frame: a square box around a centre (WGS84), mapped to blocks at the place's scale (default 1 block =
// 1 m), x east, z south (Minecraft's), origin at the box's north-west corner. Equirectangular about the centre, which is
// under a metre off across a few hundred metres.
// place.rotate (degrees, clockwise seen from above) turns the place on the grid about its centre, so a building set at an
// angle to the compass (the Ferry Building runs along the Embarcadero, 54 degrees off) lines up with Minecraft's axes and its
// fronts are straight walls, not staircases. The fetch box then grows to hold the turned square.
const M_PER_DEG_LAT = 111_000, R = 6378137;

export function frameFor(place) {
  const [lat, lon] = place.centre, half = place.half, scale = place.scale ?? 1, rot = ((place.rotate ?? 0) * Math.PI) / 180;
  const kLon = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180), c = Math.cos(rot), s = Math.sin(rot), reach = half * (Math.abs(c) + Math.abs(s));
  const box = { north: lat + reach / M_PER_DEG_LAT, south: lat - reach / M_PER_DEG_LAT, west: lon - reach / kLon, east: lon + reach / kLon };
  const N = Math.round(2 * half * scale), mid = N / 2;
  return {
    N, box, scale, centre: [lat, lon], rotate: place.rotate ?? 0,
    /** lon/lat -> [x, z] in blocks (fractional) */
    toBlock: (lo, la) => { const u = (lo - lon) * kLon * scale, v = (lat - la) * M_PER_DEG_LAT * scale; return [mid + u * c - v * s, mid + u * s + v * c]; },
    /** block centre -> [lon, lat] */
    lonLat: (x, z) => { const a = x + 0.5 - mid, b = z + 0.5 - mid, u = a * c + b * s, v = -a * s + b * c; return [lon + u / (kLon * scale), lat - v / (M_PER_DEG_LAT * scale)]; },
    /** WGS84 -> Web Mercator metres (EPSG:3857), for rasters in that projection */
    merc: (lo, la) => [(lo * Math.PI * R) / 180, R * Math.log(Math.tan(Math.PI / 4 + (la * Math.PI) / 360))],
  };
}
