export type ShopSettings = {
  shopName: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  vatPct: number;
  servicePct: number;
  autoService: boolean;
  receiptFooter: string;
  language: string;
  notifEmail: string;
  printerOn: boolean;
  kdsOn: boolean;
  notifOn: boolean;
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "BJ PIZZA",
  shopTagline: "Pizza Fast Food",
  shopAddress: "Old Shujabad Road, Farooq Pura, Chowk Multan",
  shopPhone: "0305-7924444 / 0315-7924444",
  currency: "PKR",
  currencySymbol: "Rs",
  timezone: "Asia/Karachi",
  vatPct: 5,
  servicePct: 10,
  autoService: false,
  receiptFooter: "Thank you for dining with BJ Pizza ❤",
  language: "English",
  notifEmail: "ops@bjpizza.com",
  printerOn: true,
  kdsOn: true,
  notifOn: true,
};

const KEY = "bj_settings";

export function getSettings(): ShopSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ShopSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
