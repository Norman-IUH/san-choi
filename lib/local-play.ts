import { makePlayItems, type Template, type Item } from "./game";

export function localPlay(template: Template, content: Item[], assets: Record<string, string> = {}) {
  return {
    template,
    initialItems: makePlayItems(template, content),
    localContent: content,
    assets,
    reveals: template === "flash-cards" ? content.map(item => item.answers[0]) :
      template === "open-box" ? content.map(item => item.prompt) : [],
  };
}
