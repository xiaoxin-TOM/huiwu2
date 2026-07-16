export type VenueLocation = {
  lng: number;
  lat: number;
  name: string;
  address: string;
};

export function parseVenueLocation(
  cfg: { venueLng: string; venueLat: string; venueName?: string; venueAddress: string } | null
): VenueLocation | null {
  if (!cfg) return null;
  if (cfg.venueLng.trim() === "" || cfg.venueLat.trim() === "") return null;
  const lng = Number(cfg.venueLng);
  const lat = Number(cfg.venueLat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat, name: cfg.venueName || "会场", address: cfg.venueAddress };
}

// 高德 URI API:手机端 callnative=1 拉起高德 App 导航,电脑端打开网页版路线规划,无需 key
export function amapNavUrl(loc: VenueLocation): string {
  return `https://uri.amap.com/navigation?to=${loc.lng},${loc.lat},${encodeURIComponent(loc.name)}&mode=car&callnative=1`;
}
