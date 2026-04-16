// ===== Shared CMS Content Types =====

export interface MenuItem {
  src: string;
  alt: string;
  text: string;
  path: string;
}

export interface HeroContent {
  tagline: string;
  rotatingTexts: string[];
  titlePrefix: string;
  description: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  backgroundImage: string;
}

export interface SlideData {
  id: number;
  image: string;
  alt?: string;
}

export interface ResponsiveSlideData {
  id: number;
  desktopImage: string;
  mobileImage: string;
  alt: string;
}

export interface BannerData {
  id: number;
  image: string;
  alt?: string;
}

export interface Agent {
  id: number;
  name: string;
  phoneNumber: string;
  role: string;
  closedDeal: number;
  photo?: string;
}

export interface WhyChooseItem {
  iconName: string;
  title: string;
  desc: string;
}

export interface ProcessStep {
  num: number;
  iconName: string;
  title: string;
  desc: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  socialLinks: {
    label: string;
    href: string;
    colorClass: string;
  }[];
}
