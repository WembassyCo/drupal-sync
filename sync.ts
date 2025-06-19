import { requestUrl } from "obsidian";
import type { DrupalSyncSettings } from "./settings";

export interface SyncResult {
  success: boolean;
  message?: string;
  nodeId?: string;
  nodeUrl?: string;
}

function getBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return "Basic " + Buffer.from(credentials).toString("base64");
}

export async function syncNoteToDrupal(
  settings: DrupalSyncSettings,
  title: string,
  body: string,
  published: boolean,
  existingNodeId?: string
): Promise<SyncResult> {
  const nodeData = {
      type: settings.nodeType,
      title: [{ value: title }],
      body: [
        {
          value: body,
          format: settings.bodyFormat,
        },
      ],
      status: [{ value: published ? 1 : 0 }],
    };

  const url = existingNodeId
    ? `${settings.siteUrl}/node/${existingNodeId}?_format=json`
    : `${settings.siteUrl}/node?_format=json`;

  const method = existingNodeId ? "PATCH" : "POST";

  const response = await requestUrl({
    url,
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      Authorization: getBasicAuthHeader(settings.username, settings.password),
    },
    body: JSON.stringify(nodeData),
    throw: false,
  });

  if (response.status !== 200 && response.status !== 201) {
    console.log("Error calling url " + url);
    return {
      success: false,
      message: `Sync failed: ${url} ${response.status} ${response.text}`,
    };
  }

  const responseData = response.json;
  return {
    success: true,
    nodeId: responseData.nid?.[0]?.value,
    nodeUrl: `${settings.siteUrl}/node/${responseData.nid?.[0]?.value}`,
  };
}
