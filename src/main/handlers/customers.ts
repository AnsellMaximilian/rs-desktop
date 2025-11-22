import { ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";
import {
  getCustomersOverview,
  getCustomerDetail,
  listCustomers,
} from "../db";

export function registerCustomerHandlers() {
  ipcMain.handle(CHANNELS.CUSTOMERS.LIST, async (_, payload) => {
    return listCustomers(payload);
  });

  ipcMain.handle(CHANNELS.CUSTOMERS.OVERVIEW, async () => {
    return getCustomersOverview();
  });

  ipcMain.handle(CHANNELS.CUSTOMERS.DETAIL, async (_, id: number) => {
    return getCustomerDetail(id);
  });
}
