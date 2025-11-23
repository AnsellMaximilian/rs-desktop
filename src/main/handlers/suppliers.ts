import { ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";
import { getSupplierDetail, getSuppliersOverview, listSuppliers } from "../db";

export function registerSupplierHandlers() {
  ipcMain.handle(CHANNELS.SUPPLIERS.LIST, async (_, payload) => {
    return listSuppliers(payload);
  });

  ipcMain.handle(CHANNELS.SUPPLIERS.DETAIL, async (_, id: number) => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) throw new Error("Invalid supplier id");
    return getSupplierDetail(numericId);
  });

  ipcMain.handle(CHANNELS.SUPPLIERS.OVERVIEW, async () => {
    return getSuppliersOverview();
  });
}
