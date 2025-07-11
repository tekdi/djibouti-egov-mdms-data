import { apiClient } from "./apiClient";

export interface TreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
}

export interface RecentFile {
  name: string;
  path: string;
}

export async function fetchDataTree(): Promise<TreeNode[]> {
  const response = await apiClient.get<TreeNode[]>("/api-local/data-tree");
  return response.data;
}

export async function fetchRecentConfigs(): Promise<RecentFile[]> {
  try {
    const response = await apiClient.get<RecentFile[]>(
      "/api-local/recently-changed-configs"
    );
    return response.data;
  } catch {
    // Gracefully fail if recent configs are not available
    return [];
  }
}

export async function fetchFileContent(path: string): Promise<string> {
  const response = await apiClient.get<string>(path);
  const text = response.data;
  // Try to pretty-print JSON
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export async function saveFileContent(
  path: string,
  content: string
): Promise<void> {
  await apiClient.post<void>("/api-local/save-file", { path, content });
}
