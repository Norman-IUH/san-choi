import { sampleAudioPath, sampleImagePath, type Item, type Media } from "./game";

export const mediaBucket = "teaching-media";
export const mediaSize = 3 * 1024 * 1024;

export function itemMediaPaths(items: Item[]) {
  const paths: string[] = [];
  function add(media?: Media) {
    if (media?.image) paths.push(media.image);
    if (media?.audio) paths.push(media.audio);
  }
  for (const item of items) {
    add(item.media);
    item.optionMedia?.forEach(add);
    if (item.english?.uk) paths.push(item.english.uk);
    if (item.english?.us) paths.push(item.english.us);
  }
  return [...new Set(paths)].filter(path => !sampleAudioPath.safeParse(path).success && !sampleImagePath.safeParse(path).success);
}

export function builtInMediaUrls(items: Item[]) {
  return Object.fromEntries(items.flatMap(item => [item.english?.uk, item.english?.us, item.media?.image, ...(item.optionMedia?.map(media => media.image) ?? [])]
    .filter((path): path is string => sampleAudioPath.safeParse(path).success || sampleImagePath.safeParse(path).success).map(path => [path, path])));
}
