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
  const res = await fetch("/api-local/data-tree");
  if (!res.ok) {
    throw new Error("Failed to fetch data tree");
  }
  return res.json();
}

export async function fetchRecentConfigs(): Promise<RecentFile[]> {
  const res = await fetch("/api-local/recently-changed-configs");
  if (!res.ok) {
    // Gracefully fail if recent configs are not available
    return [];
  }
  return res.json();
}

export async function fetchFileContent(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load file: ${path}`);
  }
  const text = await res.text();
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
  const res = await fetch("/api-local/save-file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, content }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to save file: ${errorText}`);
  }
}
