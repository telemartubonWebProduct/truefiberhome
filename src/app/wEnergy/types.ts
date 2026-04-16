export type SolarPlan = {
  id: string;
  name: string;
  subtitle: string;
  packageLabel: string;
  price: number;
  oldPrice?: number | null;
  features: string[];
  note?: string | null;
  buyUrl?: string | null;
};

export type WEnergyKnowledgeItem = {
  title: string;
  content: string;
  imageSrc: string;
  imageAlt: string;
};

export type WEnergyPageContent = {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaUrl: string;
  heroSecondaryCtaLabel: string;
  productTitle: string;
  productSubtitle: string;
  productDescription: string;
  productPhone: string;
  productImageUrl: string;
  packageSectionTitle: string;
  packageSectionSubtitle: string;
  knowledgeTitle: string;
  knowledgeSubtitle: string;
  knowledgeItems: WEnergyKnowledgeItem[];
};
