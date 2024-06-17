import { getVersionFromGithub } from "../../utils/misc";
import { Settings } from "../../utils/settings";
import { EventResult } from "../types";
import { connectSocket, disconnectSocket, getSocketInfo, reloadSockets, sendEventResult, updateSettings } from "./port";
import { readSettings, saveSettings } from "./shared";

export type ServiceWorkerMessage = {
  event:
    | "resetOutdated"
    | "getSettings"
    | "saveSettings"
    | "setColorScheme"
    | "reloadSockets"
    | "getSocketInfo"
    | "connectSocket"
    | "disconnectSocket"
    | "getGithubVersion"
    | "sendEventResult"
    | "getPortId";
  settings?: Settings;
  colorScheme?: "light" | "dark";
  port?: number;
  gh?: string;
  useDesktopPlayers?: boolean;
  eventId?: string;
  eventResult?: EventResult;
  eventSocketPort?: number;
};

const ghCache = new Map<string, string>();
export const onMessage = async (request: ServiceWorkerMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  switch (request.event) {
    case "resetOutdated":
      chrome.action.setBadgeText({ text: "" });
      chrome.action.setTitle({ title: "" });
      break;
    case "getSettings":
      sendResponse(await readSettings());
      break;
    case "saveSettings":
      if (!request.settings) return;
      saveSettings(request.settings);
      updateSettings();
      break;
    case "setColorScheme":
      if (!request.colorScheme) return;
      chrome.action.setIcon({
        path:
          request.colorScheme === "light"
            ? {
                128: "icons/icon-lightmode-128.png",
                256: "icons/icon-lightmode-256.png",
              }
            : {
                128: "icons/icon-darkmode-128.png",
                256: "icons/icon-darkmode-256.png",
              },
      });
      break;
    case "reloadSockets":
      await reloadSockets();
      break;
    case "getSocketInfo": {
      const socketInfo = getSocketInfo();
      const jsonString = JSON.stringify({
        ...socketInfo,
        states: Array.from(socketInfo.states.entries()),
      });
      sendResponse(jsonString);
      break;
    }
    case "connectSocket":
      await connectSocket(request.port ?? 0);
      break;
    case "disconnectSocket":
      disconnectSocket(request.port ?? 0);
      break;
    case "getGithubVersion": {
      if (ghCache.has(request.gh ?? "")) {
        return sendResponse(ghCache.get(request.gh ?? ""));
      }

      const version = await getVersionFromGithub(request.gh ?? "");
      if (version) {
        ghCache.set(request.gh ?? "", version);
        sendResponse(version);
      } else {
        sendResponse("Error");
      }
      break;
    }
    case "sendEventResult":
      sendEventResult(request.eventSocketPort as number, request.eventId as string, request.eventResult as EventResult);
      break;
    case "getPortId": {
      const tabId = sender.tab?.id;
      if (tabId) {
        // Random number after portId (tabId) to prevent iframes within the same site to share the portId
        const portId = parseInt(`${tabId}${Math.floor(Math.random() * 9999)}`);
        sendResponse(portId);
      } else {
        sendResponse(null);
      }
      break;
    }
  }
};
