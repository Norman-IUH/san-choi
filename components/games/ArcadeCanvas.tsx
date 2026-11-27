"use client";
import { useContext, useEffect, useEffectEvent, useRef, useSyncExternalStore } from "react";
import Phaser from "phaser";
import { arcadeWorlds } from "@/lib/games/arcade-templates";
import { arenaHeight, arenaWidth, maze, mazePoint, mazeTile, type ArcadeSimulation } from "@/lib/games/arcade-runtime";
import { RefreshLessonMedia } from "./LessonMedia";

const compactQuery = "(max-width: 600px) and (orientation: portrait)";
const isCompact = () => window.matchMedia(compactQuery).matches;
function subscribeViewport(update: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export default function ArcadeCanvas({ simulation, assets, onOutcome, onClock }: {
  simulation: ArcadeSimulation;
  assets: Record<string, string>;
  onOutcome: (choice: number | null) => void;
  onClock: (seconds: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const notifyOutcome = useEffectEvent(onOutcome);
  const notifyClock = useEffectEvent(onClock);
  const refreshMedia = useContext(RefreshLessonMedia);
  const renewMedia = useEffectEvent((url: string) => refreshMedia?.(url));
  const compact = useSyncExternalStore(subscribeViewport, isCompact, () => false);
  const outcomeSent = useRef(false);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const { item, mode } = simulation;
    const mount = document.createElement("div");
    mount.className = "arcade-mount";
    host.appendChild(mount);
    const skin = arcadeWorlds[mode];
    const path = "/illustrations/arcade/";
    const lane = mode === "airplane";
    const mapped = mode === "maze-chase";
    const width = compact ? 720 : arenaWidth;
    const height = compact ? 540 : arenaHeight;
    const sx = (x: number) => x * width / arenaWidth;
    const sy = (y: number) => y * height / arenaHeight;
    let pieces: Phaser.GameObjects.Container[] = [];
    let character: Phaser.GameObjects.Image;
    let obstacle: Phaser.GameObjects.Image | undefined;
    let done = false;
    let disposed = false;
    delete host.dataset.ready;
    let seconds = simulation.duration;
    const game = new Phaser.Game({
      type: Phaser.CANVAS, parent: mount, width, height,
      scale: { mode: Phaser.Scale.NONE },
      fps: { smoothStep: false },
      input: { keyboard: false, mouse: false, touch: false },
      backgroundColor: skin.colors[0], audio: { noAudio: true }, banner: false,
      scene: {
        preload(this: Phaser.Scene) {
          this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
            if (file.key.startsWith("option-") && typeof file.url === "string") renewMedia(file.url);
          });
          this.load.image("world", path + mode + ".webp");
          this.load.image("avatar", path + mode + "-sprite.webp");
          if (mapped || lane) this.load.image("token", path + "seed-sprite.webp");
          if (mapped && simulation.difficult) this.load.image("obstacle", path + "seed-sprite.webp");
          item.options.forEach((option, index) => {
            const media = item.optionMedia?.find(entry => entry.option === option);
            if (media?.image && assets[media.image]) this.load.image("option-" + index, assets[media.image]);
          });
        },
        create(this: Phaser.Scene) {
          if (disposed) return;
          const world = this.add.image(width / 2, height / 2, "world");
          world.setScale(Math.max(width / world.width, height / world.height));
          this.add.rectangle(width / 2, height / 2, width, height, 0x11142e, mapped ? .49 : .35);
          if (mapped) {
            maze.forEach((row, y) => Array.from(row).forEach((wall, x) => {
              const pos = mazePoint(x, y);
              const tile = this.add.rectangle(sx(pos.x), sy(pos.y), sx(mazeTile) - 3, sy(mazeTile) - 3,
                wall === "#" ? 0x1d5345 : 0xa7e4ae, wall === "#" ? .97 : .73);
              if (wall === "#") tile.setStrokeStyle(3, 0x72bea6, .7);
            }));
            if (simulation.difficult) obstacle = this.add.image(0, 0, "obstacle").setDisplaySize(44, 44).setTint(0xff7373).setDepth(3);
          }
          if (lane) {
            item.options.forEach((_, i) => this.add.rectangle(width / 2, sy(simulation.lane(i)), sx(908), 2, 0xffffff, .48));
            this.add.rectangle(sx(143), height / 2, 4, sy(366), 0xb8f4ff, .8);
          }
          if (mode === "whack-a-mole") simulation.targets().forEach(target => {
            this.add.ellipse(sx(target.x), sy(target.y) + 10, sx(148), 51, 0x332219).setStrokeStyle(5, 0xa57755);
          });
          pieces = simulation.targets().map(({ x, y, index }) => {
            const labelWidth = sx(mapped ? 120 : lane ? 155 : 182);
            const group = this.add.container(sx(x), sy(y));
            const backdrop = this.add.rectangle(0, 0, labelWidth, compact ? 63 : 52, Phaser.Display.Color.HexStringToColor(skin.colors[0]).color)
              .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(skin.colors[1]).color);
            const imageKey = "option-" + index;
            if (this.textures.exists(imageKey)) {
              group.add(this.add.image(0, lane || mapped ? -28 : -52, imageKey).setDisplaySize(lane || mapped ? 36 : 72, lane || mapped ? 36 : 72));
            } else if (!mapped) {
              const sprite = this.add.image(0, lane ? -3 : -57, lane ? "token" : "avatar");
              const scale = (lane ? 38 : mode === "balloon-pop" ? 128 : 104) / Math.max(sprite.width, sprite.height);
              group.add(sprite.setScale(scale).setAlpha(lane ? .36 : 1));
            }
            const text = this.add.text(0, 0, item.options[index], {
              fontFamily: "system-ui, sans-serif", fontSize: compact ? "27px" : "26px", fontStyle: "bold",
              color: "#ffffff", align: "center", wordWrap: { width: labelWidth - 10, useAdvancedWrap: true }, maxLines: 2,
            }).setOrigin(.5);
            group.add([backdrop, text]);
            return group;
          });
          if (mapped || lane) character = this.add.image(0, 0, "avatar").setDisplaySize(mapped ? 52 : 112, mapped ? 52 : 74).setDepth(4);
          this.scale.refresh();
          host.dataset.ready = "true";
        },
        update(this: Phaser.Scene, _time: number, delta: number) {
          if (disposed) return;
          simulation.tick(delta);
          for (const target of simulation.targets()) pieces[target.index]?.setPosition(sx(target.x), sy(target.y)).setVisible(target.visible);
          if (mapped) {
            const cell = mazePoint(simulation.cell.x, simulation.cell.y);
            character?.setPosition(sx(cell.x), sy(cell.y));
            const danger = simulation.obstacle();
            if (danger) obstacle?.setPosition(sx(danger.x), sy(danger.y));
          } else if (lane) character?.setPosition(sx(simulation.pilot.x), sy(simulation.pilot.y));
          const remaining = Math.max(0, Math.ceil(simulation.duration - simulation.elapsed));
          if (seconds !== remaining) { seconds = remaining; notifyClock(seconds); }
          if (done || (simulation.choice === null && !simulation.expired)) return;
          done = true;
          if (simulation.choice !== null) {
            const selected = pieces[simulation.choice];
            selected?.setDepth(6);
            if (selected && !simulation.reduced) {
              if (mode === "balloon-pop") this.tweens.add({ targets: selected, scale: 1.22, alpha: 0, duration: 180 });
              for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const speck = this.add.circle(selected.x, selected.y, 6, 0xffe48b).setDepth(8);
                this.tweens.add({ targets: speck, x: selected.x + Math.cos(angle) * 74, y: selected.y + Math.sin(angle) * 74,
                  scale: .2, alpha: 0, duration: 380, onComplete: () => speck.destroy() });
              }
            }
          }
          if (!outcomeSent.current) { outcomeSent.current = true; notifyOutcome(simulation.choice); }
        },
      },
    });
    const resize = new ResizeObserver(() => { if (host.dataset.ready === "true") game.scale.refresh(); });
    resize.observe(host);
    return () => {
      disposed = true;
      resize.disconnect();
      delete host.dataset.ready;
      mount.remove();
      game.destroy(true);
    };
  }, [simulation, assets, compact]);

  return <div className="arcade-canvas" ref={root} aria-hidden="true" onPointerUp={event => {
    if (!event.isPrimary || event.button !== 0) return;
    if (simulation.mode === "maze-chase" || event.currentTarget.dataset.ready !== "true") return;
    const canvas = event.currentTarget.querySelector("canvas");
    const bounds = canvas?.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) * arenaWidth / bounds.width;
    const y = (event.clientY - bounds.top) * arenaHeight / bounds.height;
    if (x < 0 || x > arenaWidth || y < 0 || y > arenaHeight) return;
    if (simulation.mode === "airplane") {
      const lane = Math.min(simulation.item.options.length - 1, Math.max(0, Math.floor((y - 60) * simulation.item.options.length / 360)));
      simulation.steer(simulation.lane(lane));
    }
    else simulation.hitTarget({ x, y });
  }}/>;
}
