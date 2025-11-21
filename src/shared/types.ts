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
};

export type DatabasePingResult = {
  ok: boolean;
  database: string | null;
  now: string;
};
