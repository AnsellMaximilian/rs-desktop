import { ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";
import { getProductsOverview, listProducts } from "../db";

export function registerProductHandlers() {
  ipcMain.handle(CHANNELS.PRODUCTS.LIST, async (_, payload) => {
    return listProducts(payload);
  });

  ipcMain.handle(CHANNELS.PRODUCTS.OVERVIEW, async () => {
    return getProductsOverview();
  });
}
