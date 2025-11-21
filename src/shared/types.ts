export type AppAPI = {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  files: {
    pickFolder: () => Promise<string | null>;
  };
};
