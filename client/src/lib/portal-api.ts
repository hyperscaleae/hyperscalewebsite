export type Auth = {
  user: import("../../../shared/portal").PortalUser;
  csrf: string;
};
let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
export async function api<T = { ok: boolean }>(
  url: string,
  method = "GET",
  data?: unknown
): Promise<T> {
  const response = await fetch(`/api/portal${url}`, {
    method,
    credentials: "same-origin",
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The shared workspace server is not connected to this website."
    );
  }
  if (!response.ok)
    throw new Error(result.error || "This action could not be completed.");
  return result;
}
export async function upload(clientId: string, file: File, shared: boolean) {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Files must be 20 MB or smaller.");
  const response = await fetch(`/api/portal/clients/${clientId}/files`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-CSRF-Token": csrf,
      "X-File-Name": encodeURIComponent(file.name),
      "X-Shared": String(shared),
    },
    body: file,
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Upload failed.");
  }
}
