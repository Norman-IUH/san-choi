import { defaultArcade, type ArcadeTemplate } from "./arcade-templates";
import type { PlayItem } from "./model";

export const arenaWidth = 960;
export const arenaHeight = 480;
export type Direction = "up" | "down" | "left" | "right";
export type Point = { x: number; y: number };
export type Target = Point & { index: number; visible: boolean };
const step = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] } as const;
export const maze = [
  "...........",
  ".##.#.#.##.",
  "....#.#....",
  ".##.....##.",
  "...#...#...",
  ".#..#.#..#.",
  "...........",
];
export const mazeDestinations: [number, number][] = [[10,0],[10,3],[10,6],[4,0],[4,6],[7,0],[7,6],[0,0]];
const startCell = { x: 0, y: 3 };
export const mazeTile = 54;
export function mazePoint(x: number, y: number): Point {
  return { x: 210 + x * mazeTile, y: 78 + y * mazeTile };
}
export function stepMaze(from: Point, direction: Direction) {
  const [dx,dy] = step[direction];
  const x = from.x + dx, y = from.y + dy;
  return maze[y]?.[x] === "." ? {x,y} : from;
}
export const hits = (a: Point, b: Point, horizontal: number, vertical: number) =>
  Math.abs(a.x - b.x) <= horizontal && Math.abs(a.y - b.y) <= vertical;

export class ArcadeSimulation {
  elapsed = 0;
  choice: number | null = null;
  expired = false;
  paused = false;
  cell = { ...startCell };
  pilot = { x: 143, y: 245 };
  aim = 245;
  flying = false;
  readonly speed;
  readonly duration;
  readonly difficult;

  constructor(readonly mode: ArcadeTemplate, readonly item: PlayItem, readonly reduced: boolean) {
    const settings = item.arcade ?? defaultArcade;
    this.difficult = settings.difficulty === "challenge";
    this.speed = settings.difficulty === "gentle" ? .65 : this.difficult ? 1.35 : 1;
    this.duration = settings.timed ? (settings.difficulty === "gentle" ? 50 : 35) : 0;
  }

  setPaused(paused: boolean) { this.paused = paused; }

  targets(): Target[] {
    const planned = this.item.options.length;
    return this.item.options.map((_, index) => {
      if (this.mode === "maze-chase") return { index, visible: true, ...mazePoint(...mazeDestinations[index]) };
      if (this.mode === "airplane") return { index, visible: true, y: this.lane(index),
        x: 76 + ((550 + index * 139 - this.elapsed * 124 * this.speed) % 845 + 845) % 845 };
      const phase = this.elapsed * this.speed + index * 1.2;
      return { index, visible: true, x: 145 + (index % 4) * 222 + Math.sin(phase) * (this.reduced ? 12 : 38),
        y: (planned > 4 ? 155 + Math.floor(index / 4) * 172 : 230) + Math.cos(phase * 1.2) * (this.reduced ? 10 : 63) };
    });
  }

  lane(index: number) {
    return 60 + (index + .5) * (360 / this.item.options.length);
  }

  obstacle() {
    return this.mode === "maze-chase" && this.difficult ?
      mazePoint(Math.floor(this.elapsed * 1.8) % 9 + 1, 0) : null;
  }

  steer(y: number) {
    if (!this.paused && this.choice === null && !this.expired) {
      this.flying = true;
      this.aim = Math.max(57, Math.min(423, y));
    }
  }

  move(direction: Direction) {
    if (this.paused || this.choice !== null || this.expired) return;
    if (this.mode === "maze-chase") {
      this.cell = stepMaze(this.cell, direction);
      this.contact();
    } else if (this.mode === "airplane") {
      const index = this.item.options.reduce((closest, _, lane) =>
        Math.abs(this.lane(lane) - this.aim) < Math.abs(this.lane(closest) - this.aim) ? lane : closest, 0);
      if (direction === "up" || direction === "down") {
        this.steer(this.lane(Math.min(this.item.options.length - 1, Math.max(0, index + step[direction][1]))));
      }
    }
  }

  pick(index: number) {
    if (this.paused || this.choice !== null || this.expired || !this.targets().some(target => target.index === index && target.visible)) return;
    this.choice = index;
  }

  contact() {
    if (this.mode !== "maze-chase" && this.mode !== "airplane") return;
    if (this.mode === "airplane" && (!this.flying || Math.abs(this.pilot.y - this.aim) > 7)) return;
    const player = this.mode === "maze-chase" ? mazePoint(this.cell.x, this.cell.y) : this.pilot;
    const danger = this.obstacle();
    if (danger && hits(player, danger, 18, 18)) {
      this.cell = { ...startCell };
      return;
    }
    const target = this.targets().find(target => hits(player, target, this.mode === "airplane" ? 39 : 18, 18));
    if (target) this.pick(target.index);
  }

  tick(milliseconds: number) {
    if (this.paused || this.choice !== null || this.expired) return;
    const dt = Math.max(0, Math.min(milliseconds, 50)) / 1000;
    this.elapsed += dt;
    if (this.duration && this.elapsed >= this.duration) { this.expired = true; return; }
    if (this.mode === "airplane") {
      const difference = this.aim - this.pilot.y;
      this.pilot.y += Math.sign(difference) * Math.min(Math.abs(difference), dt * 325);
    }
    this.contact();
  }
}
