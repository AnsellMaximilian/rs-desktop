import { AppAPI } from "../shared/types";

declare global {
  const api: AppAPI;
  interface Window {
    api: AppAPI;
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}
export {};
