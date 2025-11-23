import { dialog, ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";
import { pingDatabase } from "../db";
import { registerCustomerHandlers } from "./customers";
import { registerProductHandlers } from "./products";
import { registerSupplierHandlers } from "./suppliers";

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

  registerCustomerHandlers();
  registerProductHandlers();
  registerSupplierHandlers();
};

export default initHandlers;
