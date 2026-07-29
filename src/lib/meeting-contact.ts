/**
 * 结构化联系方式的展示辅助——纯函数，可独立单测。
 */

export type ContactInfoLike = {
  orgName: string;
  phone: string;
  phone2: string;
  email: string;
  wechatId: string;
  address: string;
  wecomQrUrl: string | null;
  groupQrUrl: string | null;
  mpQrUrl: string | null;
};

/** 是否有任何可展示的结构化内容；全空时前台退回只渲染原有富文本 */
export function hasAnyContactInfo(contact: ContactInfoLike | null | undefined): boolean {
  if (!contact) return false;
  const texts = [
    contact.orgName,
    contact.phone,
    contact.phone2,
    contact.email,
    contact.wechatId,
    contact.address,
  ];
  if (texts.some((t) => t?.trim())) return true;
  return Boolean(contact.wecomQrUrl || contact.groupQrUrl || contact.mpQrUrl);
}

export type QrCard = { key: string; title: string; url: string; note: string };

type QrSource = {
  wecomQrUrl: string | null;
  groupQrUrl: string | null;
  mpQrUrl: string | null;
  wecomNote: string;
  groupNote: string;
  mpNote: string;
};

/** 只返回确实上传了图片的二维码卡片，保持固定顺序 */
export function contactQrCards(source: QrSource): QrCard[] {
  const defs: { key: string; title: string; url: string | null; note: string }[] = [
    { key: "wecom", title: "企业微信客服", url: source.wecomQrUrl, note: source.wecomNote },
    { key: "group", title: "微信交流群", url: source.groupQrUrl, note: source.groupNote },
    { key: "mp", title: "官方公众号", url: source.mpQrUrl, note: source.mpNote },
  ];
  return defs
    .filter((d): d is typeof d & { url: string } => Boolean(d.url))
    .map((d) => ({ key: d.key, title: d.title, url: d.url, note: d.note ?? "" }));
}
