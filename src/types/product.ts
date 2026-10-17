export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number | null;
  images: string[];
  portions: number | null;
  category: string;
  available: boolean;
  customizable: boolean;
  seoTitle: string;
  seoDescription: string;
};
