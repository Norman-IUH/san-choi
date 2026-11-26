"use client";
import { useEffect, useEffectEvent, useRef } from "react";
import Phaser from "phaser";
import { arcadeWorlds } from "@/lib/games/arcade-templates";
import { arenaHeight, arenaWidth, hits, maze, mazePoint, mazeTile, type ArcadeSimulation } from "@/lib/games/arcade-runtime";

export default function ArcadeCanvas({ simulation, assets, onOutcome, onClock }: {
  simulation: ArcadeSimulation;
  assets: Record<string, string>;
  onOutcome: (choice: number | null) => void;
  onClock: (seconds: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const notifyOutcome = useEffectEvent(onOutcome);
  const notifyClock = useEffectEvent(onClock);

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
    let pieces: Phaser.GameObjects.Container[] = [];
    let character: Phaser.GameObjects.Image;
    let obstacle: Phaser.GameObjects.Image | undefined;
    let done = false;
    let disposed = false;
    delete host.dataset.ready;
    let seconds = simulation.duration;
    const game = new Phaser.Game({
      type: Phaser.CANVAS, parent: mount, width: arenaWidth, height: arenaHeight,
      scale: { mode: Phaser.Scale.NONE },
      backgroundColor: skin.colors[0], audio: { noAudio: true }, banner: false,
      scene: {
        preload(this: Phaser.Scene) {
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
          this.add.image(arenaWidth / 2, arenaHeight / 2, "world").setDisplaySize(arenaWidth, arenaHeight);
          this.add.rectangle(arenaWidth / 2, arenaHeight / 2, arenaWidth, arenaHeight, 0x11142e, mapped ? .44 : .24);
          if (mapped) {
            maze.forEach((row, y) => Array.from(row).forEach((wall, x) => {
              const pos = mazePoint(x, y);
              const tile = this.add.rectangle(pos.x, pos.y, mazeTile - 3, mazeTile - 3,
                wall === "#" ? 0x1d5345 : 0xa7e4ae, wall === "#" ? .97 : .73);
              if (wall === "#") tile.setStrokeStyle(3, 0x72bea6, .7);
            }));
            if (simulation.difficult) obstacle = this.add.image(0, 0, "obstacle").setDisplaySize(44, 44).setTint(0xff7373).setDepth(3);
          }
          if (lane) {
            item.options.forEach((_, i) => this.add.rectangle(480, simulation.lane(i), 908, 2, 0xffffff, .3));
            this.add.rectangle(143, 240, 4, 366, 0xb8f4ff, .65);
          }
          this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (lane) simulation.steer(pointer.y);
            else if (!mapped) {
              const target = simulation.targets().find(target => target.visible &&
                hits(pointer, { x: target.x, y: target.y - 33 }, 85, 67));
              if (target) simulation.pick(target.index);
            }
          });
          pieces = simulation.targets().map(({ x, y, index }) => {
            const width = mapped ? 112 : lane ? 132 : 166;
            const group = this.add.container(x, y);
            const backdrop = this.add.rectangle(0, 0, width, lane ? 35 : mapped ? 36 : 45, Phaser.Display.Color.HexStringToColor(skin.colors[0]).color)
              .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(skin.colors[1]).color);
            const imageKey = "option-" + index;
            if (this.textures.exists(imageKey)) {
              group.add(this.add.image(0, lane || mapped ? -28 : -52, imageKey).setDisplaySize(lane || mapped ? 36 : 72, lane || mapped ? 36 : 72));
            } else if (!mapped) {
              group.add(this.add.image(0, lane ? -3 : -57, lane ? "token" : "avatar")
                .setDisplaySize(lane ? 38 : 102, lane ? 38 : 102).setAlpha(lane ? .36 : 1));
            }
            const text = this.add.text(0, 0, item.options[index], {
              fontFamily: "system-ui, sans-serif", fontSize: lane || mapped ? "16px" : "21px", fontStyle: "bold",
              color: "#ffffff", align: "center", wordWrap: { width: width - 12, useAdvancedWrap: true }, maxLines: 2,
            }).setOrigin(.5);
            group.add([backdrop, text]);
            return group;
          });
          if (mapped || lane) character = this.add.image(0, 0, "avatar").setDisplaySize(mapped ? 49 : 105, mapped ? 49 : 70).setDepth(4);
          this.scale.refresh();
          host.dataset.ready = "true";
        },
        update(this: Phaser.Scene, _time: number, delta: number) {
          if (disposed) return;
          simulation.tick(delta);
          for (const target of simulation.targets()) pieces[target.index]?.setPosition(target.x, target.y).setVisible(target.visible);
          if (mapped) {
            const cell = mazePoint(simulation.cell.x, simulation.cell.y);
            character?.setPosition(cell.x, cell.y);
            const danger = simulation.obstacle();
            if (danger) obstacle?.setPosition(danger.x, danger.y);
          } else if (lane) character?.setPosition(simulation.pilot.x, simulation.pilot.y);
          const remaining = Math.max(0, Math.ceil(simulation.duration - simulation.elapsed));
          if (seconds !== remaining) { seconds = remaining; notifyClock(seconds); }
          if (done || (simulation.choice === null && !simulation.expired)) return;
          done = true;
          if (simulation.choice !== null) {
            const selected = pieces[simulation.choice];
            selected?.setDepth(6);
            if (selected && !simulation.reduced) {
              for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const speck = this.add.circle(selected.x, selected.y, 6, 0xffe48b).setDepth(8);
                this.tweens.add({ targets: speck, x: selected.x + Math.cos(angle) * 74, y: selected.y + Math.sin(angle) * 74,
                  scale: .2, alpha: 0, duration: 380, onComplete: () => speck.destroy() });
              }
            }
          }
          notifyOutcome(simulation.choice);
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
  }, [simulation, assets]);

  return <div className="arcade-canvas" ref={root} aria-hidden="true"/>;
}
