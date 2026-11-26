import "server-only";
import { privilegedDatabase } from "./supabase";
import { itemMediaPaths, mediaBucket } from "./media";
import type { Item } from "./game";

export async function mediaUrls(items: Item[], ownerId: string) {
  const paths = itemMediaPaths(items).filter(path => path.startsWith(ownerId + "/"));
  if (!paths.length) return {};
  const { data, error } = await privilegedDatabase().storage.from(mediaBucket).createSignedUrls(paths, 3600);
  if (error) console.error(JSON.stringify({ operation: "sign_teaching_media", status: error.status }));
  return Object.fromEntries((data ?? []).flatMap(({ path, signedUrl }) => path && signedUrl ? [[path, signedUrl]] : []));
}
