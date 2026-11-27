import { sampleAudioPath, sampleImagePath, type Item, type Media } from "./game";
import { samplePracticeAudio } from "./games/practice";
import { starterAudio, starterImage } from "./games/starters";

const builtIn = (path: unknown) => sampleAudioPath.safeParse(path).success ||
  sampleImagePath.safeParse(path).success || samplePracticeAudio.safeParse(path).success || starterImage.safeParse(path).success || starterAudio.safeParse(path).success;

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
    if (item.practice?.stimulusImage) paths.push(item.practice.stimulusImage);
    item.optionMedia?.forEach(add);
    if (item.english?.uk) paths.push(item.english.uk);
    if (item.english?.us) paths.push(item.english.us);
  }
  return [...new Set(paths)].filter(path => !builtIn(path));
}

export function builtInMediaUrls(items: Item[]) {
  return Object.fromEntries(items.flatMap(item => [item.english?.uk, item.english?.us, item.media?.image, item.media?.audio, item.practice?.stimulusImage,
    item.practice?.starters?.scene, item.practice?.starters?.lead?.image, ...(item.practice?.starters?.visuals ?? []),
    ...(item.practice?.starters?.groups?.flat() ?? []), ...(item.practice?.starters?.cards?.map(card => card.image) ?? []),
    ...(item.practice?.starters?.targets?.map(target => target.mask) ?? []),
    ...(item.optionMedia?.flatMap(media => [media.image, media.audio]) ?? [])]
    .filter((path): path is string => typeof path === "string" && builtIn(path)).map(path => [path, path])));
}
