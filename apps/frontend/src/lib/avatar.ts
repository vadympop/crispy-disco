// The API sends picture paths relative to its own host
// ("/api/v1/users/<id>/avatar?v=..."), the app may run on another origin
export function avatarSrc(path: string | null | undefined): string | null {
  return path ? new URL(path, import.meta.env.API_URL).href : null;
}
