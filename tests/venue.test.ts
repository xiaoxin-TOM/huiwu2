import { expect, test } from "vitest";
import { parseVenueLocation, amapNavUrl } from "@/lib/venue";

const cfg = (o: Partial<Record<string, string>>) => ({
  venueLng: "", venueLat: "", venueName: "", venueAddress: "", ...o,
});

test("会场位置:坐标齐全才返回,名称空时回退", () => {
  expect(parseVenueLocation(null)).toBeNull();
  expect(parseVenueLocation(cfg({}))).toBeNull();
  expect(parseVenueLocation(cfg({ venueLng: "116.397" }))).toBeNull();
  expect(parseVenueLocation(cfg({ venueLng: "abc", venueLat: "39.9" }))).toBeNull();
  const loc = parseVenueLocation(cfg({
    venueLng: "116.397", venueLat: "39.909",
    venueName: "北京国际会议中心", venueAddress: "北辰东路8号",
  }));
  expect(loc).toEqual({ lng: 116.397, lat: 39.909, name: "北京国际会议中心", address: "北辰东路8号" });
  const noName = parseVenueLocation(cfg({ venueLng: "116.397", venueLat: "39.909" }));
  expect(noName?.name).toBe("会场");
});

test("会场位置:导航链接指向高德 URI API 且名称已编码", () => {
  const url = amapNavUrl({ lng: 116.397, lat: 39.909, name: "北京国际会议中心", address: "" });
  expect(url).toBe(
    `https://uri.amap.com/navigation?to=116.397,39.909,${encodeURIComponent("北京国际会议中心")}&mode=car&callnative=1`
  );
});

test("会场位置:提供起点时导航链接包含 from", () => {
  const url = amapNavUrl(
    { lng: 116.397, lat: 39.909, name: "北京国际会议中心", address: "" },
    { lng: 116.407, lat: 39.904, name: "我的位置" }
  );
  expect(url).toBe(
    `https://uri.amap.com/navigation?from=116.407,39.904,${encodeURIComponent("我的位置")}&to=116.397,39.909,${encodeURIComponent("北京国际会议中心")}&mode=car&callnative=1`
  );
});
