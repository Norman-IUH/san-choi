import { makePlayItems, type Template, type Item } from "./game";
import { builtInMediaUrls } from "./media";
import { starterProjection } from "./games/starters";

export function localPlay(template: Template, content: Item[], assets: Record<string, string> = {}) {
  return {
    template,
    initialItems: makePlayItems(template, content),
    localContent: content.map(item => {
      const practice = item.practice;
      return practice?.starters ? { ...item, practice: {
        ...practice, production: undefined, starters: starterProjection(practice.starters),
      } } : item;
    }),
    assets: { ...builtInMediaUrls(content), ...assets },
    reveals: template === "flash-cards" ? content.map(item => item.answers[0]) :
      template === "open-box" ? content.map(item => item.prompt) : [],
  };
}
