import { dialog, ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";
import { getCustomersOverview, listCustomers, pingDatabase } from "../db";

const initHandlers = () => {
  ipcMain.handle(CHANNELS.FILES.PICK_FOLDER, async () => {
    const res = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    if (res.canceled) return null;

    return res.filePaths[0];
  });

  ipcMain.handle(CHANNELS.DATABASE.PING, async () => {
    const result = await pingDatabase();
    return result;
  });

  ipcMain.handle(CHANNELS.CUSTOMERS.LIST, async (_, payload) => {
    const result = await listCustomers(payload);
    return result;
  });

  ipcMain.handle(CHANNELS.CUSTOMERS.OVERVIEW, async () => {
    const result = await getCustomersOverview();
    return result;
  });
};

export default initHandlers;
