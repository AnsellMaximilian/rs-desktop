import { dialog, ipcMain } from "electron";
import { CHANNELS } from "../../shared/channels";

const initHandlers = () => {
  ipcMain.handle(CHANNELS.FILES.PICK_FOLDER, async () => {
    const res = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    if (res.canceled) return null;

    return res.filePaths[0];
  });
};

export default initHandlers;
