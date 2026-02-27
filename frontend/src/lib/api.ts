import type { ImageEntry, OpenDatasetResponse, TagStats } from "../types/models";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function openDataset(rootPath: string): Promise<OpenDatasetResponse> {
  return request<OpenDatasetResponse>("/api/dataset/open", {
    method: "POST",
    body: JSON.stringify({ rootPath }),
  });
}

export async function listImages(params: {
  category?: string;
  hasTag?: string[];
  notTag?: string[];
  page?: number;
  pageSize?: number;
}) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  for (const tag of params.hasTag ?? []) q.append("hasTag", tag);
  for (const tag of params.notTag ?? []) q.append("notTag", tag);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 200));
  return request<{ items: ImageEntry[]; total: number; page: number; pageSize: number }>(`/api/images?${q.toString()}`);
}

export async function getImage(imageId: string) {
  return request<{ item: ImageEntry; prevId: string | null; nextId: string | null }>(
    `/api/images/${encodeURIComponent(imageId)}`,
  );
}

export async function updateTags(imageId: string, tags: string[], revision: number) {
  return request<{ item: ImageEntry }>(`/api/images/${encodeURIComponent(imageId)}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags, revision }),
  });
}

export async function batchAddTags(imageIds: string[], tags: string[]) {
  return request<{ updated: number }>("/api/images/batch/tags:add", {
    method: "POST",
    body: JSON.stringify({ imageIds, tags }),
  });
}

export async function batchRemoveTags(imageIds: string[], tags: string[]) {
  return request<{ updated: number }>("/api/images/batch/tags:remove", {
    method: "POST",
    body: JSON.stringify({ imageIds, tags }),
  });
}

export async function fetchTagStats() {
  return request<{ items: TagStats[] }>("/api/tags/stats");
}
