// ===== Solar Cell Types =====

export interface SolarcellPackage {
  id: string;
  title: string;
  description: string;
  pack: string;
  price: string;
  discount_price: string;
  solarcell: string;
  arae: string;
  scope: string;
  karantee: string;
}

export interface SolarStats {
  province: string;
  team: string;
  project: string;
  solarcell: string;
}

export interface SolarBenefit {
  text: string;
}

export interface InstallationStep {
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
}

export interface KnowledgeArticle {
  title: string;
  content: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: "left" | "right";
}

export interface SolarProductInfo {
  title: string;
  subtitle: string;
  description: string;
  contactPhone: string;
  imageSrc: string;
  imageAlt: string;
}
