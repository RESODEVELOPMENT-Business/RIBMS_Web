export interface BrandProductItem {
  itemId: number;
  itemName: string;
  unit?: string;
  unit2?: string;
  unitRate?: number;
  price?: number;
  isAvailable?: boolean;
  imageUrl?: string;
  itemCode?: string;
  categoryName?: string;
}

export interface ProductCompositionItem {
  productId: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  unit2?: string;
  unitRate?: number;
  price?: number;
  quantity: number;
}

export interface MaterialConsumingProduct {
  productId: number;
  productCode?: string;
  productName?: string;
  quantitySold: number;
  quantityPerCup: number;
  totalConsumedBase: number;
  isAddition: boolean;
}

export interface MaterialConsumptionItem {
  itemId: number;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  unit2?: string;
  unitRate: number;
  totalConsumedBase: number;
  totalConsumedPackage: number;
  totalInward: number;
  variance: number;
  varianceRate: number;
  consumingProducts: MaterialConsumingProduct[];
}

export interface SkuMaterialItem {
  itemId: number;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  unit2?: string;
  unitRate: number;
  quantityPerCup: number;
  totalConsumedBase: number;
  totalConsumedPackage: number;
}

export interface ToppingConsumption {
  productId: number;
  productName?: string;
  quantitySold: number;
  hasRecipe: boolean;
  materials: SkuMaterialItem[];
}

export interface ProductSkuConsumption {
  productId: number;
  productCode?: string;
  productName?: string;
  quantitySold: number;
  hasRecipe: boolean;
  materials: SkuMaterialItem[];
  toppings: ToppingConsumption[];
}

export interface ProductConsumptionTree {
  parentProductId: number;
  parentProductCode?: string;
  parentProductName?: string;
  categoryName?: string;
  totalSold: number;
  skus: ProductSkuConsumption[];
}

export interface MaterialConsumptionReportData {
  totalSoldCups: number;
  totalDistinctMaterials: number;
  byMaterial: MaterialConsumptionItem[];
  byProduct: ProductConsumptionTree[];
}

