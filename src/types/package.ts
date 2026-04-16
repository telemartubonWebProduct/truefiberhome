// ===== Package-related Types =====

export type PackageCategory = {
  id: number;
  name: string;
  slug: string;
};

export type PerkItem = {
  text: string;
  imageUrl?: string;
};

export type PackageItem = {
  id: number;
  category_id: number;
  name: string;
  price: number;
  price_note?: string | null;
  download_speed?: number | null;
  upload_speed?: number | null;
  speed_unit?: string | null;
  description?: string | null;
  buy_link?: string | null;
  speed?: string | null;
  display_order?: number | null;
  is_active: boolean;
  promo_badge?: string | null;
  highlight_price?: number | null;
  contract_months?: number | null;
  perks?: PerkItem[];
  freebies?: PerkItem[];
  header_theme?: "netflix" | "youtube" | "generic";
  theme_color?: string;
};

export interface CardItem {
  title: string;
  detail: string;
  image: string;
  hoverImage: string;
  package?: {
    icon: string;
    title: string;
  }[];
  path: string;
}

export interface PromotionItem {
  id: number;
  title: string;
  validity?: string;
  speed?: string;
  price: number;
  vat?: string;
  call?: string;
  unlock?: string;
  imgae?: { icon: string }[];
  phone?: string;
  coupon?: string;
  iconCoupon?: { icon: string }[];
  note?: string;
}
