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
