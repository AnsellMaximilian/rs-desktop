export type AppAPI = {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  files: {
    pickFolder: () => Promise<string | null>;
  };
  database: {
    ping: () => Promise<DatabasePingResult>;
  };
  customers: {
    list: (input: CustomersListRequest) => Promise<CustomersListResponse>;
    overview: () => Promise<CustomersOverview>;
    detail: (id: number) => Promise<CustomerDetail>;
  };
  products: {
    list: (input: ProductsListRequest) => Promise<ProductsListResponse>;
    overview: () => Promise<ProductsOverview>;
    detail: (id: number) => Promise<ProductDetail>;
  };
  suppliers: {
    list: (input: SuppliersListRequest) => Promise<SuppliersListResponse>;
    detail: (id: number) => Promise<SupplierDetail>;
    overview: () => Promise<SuppliersOverview>;
  };
};

export type DatabasePingResult = {
  ok: boolean;
  database: string | null;
  now: string;
};

export type Customer = {
  id: number;
  fullName: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  rsMember: boolean | null;
  receiveDrDiscount: boolean | null;
  regionId: number | null;
  regionName: string | null;
  note: string | null;
  accountName: string | null;
  accountNumber: string | null;
  isActive: boolean | null;
};

export type CustomersSortKey =
  | "fullName"
  | "phone"
  | "region"
  | "createdAt"
  | "updatedAt"
  | "isActive";

export type CustomersListRequest = {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: CustomersSortKey;
  sortDir?: "asc" | "desc";
};

export type CustomersListResponse = {
  data: Customer[];
  total: number;
  limit: number;
  offset: number;
};

export type RegionCount = {
  regionName: string;
  count: number;
};

export type CustomersOverview = {
  total: number;
  active: number;
  inactive: number;
  rsMember: number;
  receiveDrDiscount: number;
  withInvoices30d: number;
  lastInvoiceDate: string | null;
  topRegions: RegionCount[];
};

export type CustomerDetail = {
  customer: Customer;
  invoiceCount: number;
  deliveryCount: number;
  lastInvoiceDate: string | null;
  lastDeliveryDate: string | null;
  lastActivityDate: string | null;
  invoiceTrend: TrendPoint[];
  deliveryTrend: TrendPoint[];
  spendTrend: TrendAmountPoint[];
  categoryBreakdown: CategorySlice[];
  orderValueBuckets: BucketSlice[];
  rfm: {
    recencyDays: number | null;
    frequency: number;
    monetary: number;
  };
};

export type TrendPoint = {
  label: string;
  count: number;
};

export type TrendAmountPoint = {
  label: string;
  amount: number;
};

export type CategorySlice = {
  label: string;
  amount: number;
};

export type BucketSlice = {
  label: string;
  count: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  resellerPrice: number | null;
  cost: number;
  unit: string;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  keepStockSince: string | null;
  restockNumber: number | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductsSortKey =
  | "name"
  | "price"
  | "cost"
  | "category"
  | "supplier"
  | "createdAt"
  | "updatedAt"
  | "isActive";

export type ProductsListRequest = {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: ProductsSortKey;
  sortDir?: "asc" | "desc";
};

export type ProductsListResponse = {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
};

export type TopItem = {
  label: string;
  value: number;
};

export type ProductsOverview = {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  suppliers: number;
  purchased30d: number;
  sold30d: number;
  lastPurchaseDate: string | null;
  lastSaleDate: string | null;
  topCategories: TopItem[];
  topSuppliers: TopItem[];
  topSellers30d: TopItem[];
};

export type ProductTrendPoint = {
  label: string;
  revenue: number;
  overallCost: number;
};

export type ProductQtyTrendPoint = {
  label: string;
  qty: number;
  month: string;
};

export type Supplier = {
  id: number;
  name: string;
  accountNumber: string | null;
  accountName: string | null;
  productCount: number;
  soldQty: number;
  revenue: number;
};

export type SuppliersSortKey = "name" | "productCount" | "soldQty" | "revenue";

export type SuppliersListRequest = {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: SuppliersSortKey;
  sortDir?: "asc" | "desc";
};

export type SuppliersListResponse = {
  data: Supplier[];
  total: number;
  limit: number;
  offset: number;
};

export type SupplierTrendPoint = {
  label: string;
  qty: number;
};

export type SupplierTopProductPoint = {
  label: string;
  qty: number;
  productId: number;
  productName: string;
};

export type SupplierDetail = {
  supplier: {
    id: number;
    name: string;
    accountNumber: string | null;
    accountName: string | null;
    productCount: number;
  };
  totals: {
    soldQty: number;
    revenue: number;
    lastSaleDate: string | null;
  };
  qtyTrend: SupplierTrendPoint[];
  topProductTrends: SupplierTopProductPoint[];
  topProducts: TopItem[];
};

export type StockMovement = {
  date: string;
  kind: "purchase" | "delivery" | "adjustment" | "match";
  qty: number;
  description: string | null;
  ref: string | null;
};

export type ProductDetail = {
  product: Product;
  totals: {
    soldQty: number;
    purchasedQty: number;
    revenue: number;
    cogs: number;
    margin: number;
    lastSaleDate: string | null;
    lastPurchaseDate: string | null;
    currentStock: number;
  };
  salesTrend: ProductTrendPoint[];
  purchaseTrend: ProductTrendPoint[];
  qtyTrend: ProductQtyTrendPoint[];
  stockMovements: StockMovement[];
  topCustomers: TopItem[];
  latestStockMatch: {
    date: string | null;
    qty: number | null;
    description: string | null;
  } | null;
};
