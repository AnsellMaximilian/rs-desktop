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
