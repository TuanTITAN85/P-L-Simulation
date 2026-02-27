import type { Location } from "../types";

export const DEFAULT_LOCS: Location[] = [
  { code: "HN",  name: { vi: "Hà Nội",       en: "Hanoi" } },
  { code: "HL",  name: { vi: "Hoà Lạc",      en: "Hoa Lac" } },
  { code: "DN",  name: { vi: "Đà Nẵng",      en: "Da Nang" } },
  { code: "HCM", name: { vi: "Hồ Chí Minh",  en: "Ho Chi Minh" } },
  { code: "CT",  name: { vi: "Cần Thơ",      en: "Can Tho" } },
  { code: "QNH", name: { vi: "Quy Nhơn",     en: "Quy Nhon" } },
  { code: "HUE", name: { vi: "Huế",           en: "Hue" } },
  { code: "NT",  name: { vi: "Nha Trang",    en: "Nha Trang" } },
];

export const DEFAULT_ROLES = [
  "Project Manager", "Business Analyst", "Tech Lead", "Senior Developer",
  "Developer", "Junior Developer", "QA Engineer", "DevOps", "Designer",
  "Comtor", "Scrum Master",
];

export const DEFAULT_CONTRACTS = ["EMP", "APP", "POI"];

export const DEFAULT_OTHER_COST_CATS = [
  "AI License", "VDI", "Office Mini", "Office 365", "Cloud Infrastructure", "Other",
];
