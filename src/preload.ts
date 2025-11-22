// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { AppAPI } from "./shared/types";
import { CHANNELS } from "./shared/channels";

const api: AppAPI = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  files: {
    pickFolder: () => ipcRenderer.invoke(CHANNELS.FILES.PICK_FOLDER),
  },
  database: {
    ping: () => ipcRenderer.invoke(CHANNELS.DATABASE.PING),
  },
  customers: {
    list: (input) => ipcRenderer.invoke(CHANNELS.CUSTOMERS.LIST, input),
    overview: () => ipcRenderer.invoke(CHANNELS.CUSTOMERS.OVERVIEW),
    detail: (id) => ipcRenderer.invoke(CHANNELS.CUSTOMERS.DETAIL, id),
  },
  products: {
    list: (input) => ipcRenderer.invoke(CHANNELS.PRODUCTS.LIST, input),
    overview: () => ipcRenderer.invoke(CHANNELS.PRODUCTS.OVERVIEW),
  },
};

contextBridge.exposeInMainWorld("api", api);
