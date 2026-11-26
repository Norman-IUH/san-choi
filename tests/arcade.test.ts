import { expect, test } from "vitest";
import { ArcadeSimulation, mazeDestinations, stepMaze } from "../lib/games/arcade-runtime";

const item = { prompt: "Word", options: ["A","B","C"] };

test("maze enforces walls and ending on an answer target", () => {
  expect(stepMaze({ x: 0, y: 1 }, "right")).toEqual({ x: 0, y: 1 });
  const maze = new ArcadeSimulation("maze-chase", item, false);
  const [x, y] = mazeDestinations[0];
  maze.cell = { x: x - 1, y };
  maze.move("right");
  expect(maze.choice).toBe(0);
  maze.move("left");
  expect(maze.cell).toEqual({ x, y });
});

test("flight registers only actual target contact in the selected lane", () => {
  const flight = new ArcadeSimulation("airplane", item, false);
  flight.steer(flight.lane(0));
  for (let i = 0; i < 240; i++) flight.tick(50);
  expect(flight.choice).toBe(0);
});

test("fruit motion pauses, ignores invalid choices, and optional countdown ends cleanly", () => {
  const game = new ArcadeSimulation("flying-fruit", { ...item, arcade: { timed: true, difficulty: "challenge" } }, true);
  const first = game.targets()[0];
  game.setPaused(true);
  game.tick(50);
  game.pick(1);
  expect(game.targets()[0]).toEqual(first);
  expect(game.choice).toBeNull();
  game.setPaused(false);
  game.pick(-1);
  expect(game.choice).toBeNull();
  for (let i = 0; i < 750; i++) game.tick(50);
  expect(game.expired).toBe(true);
  game.pick(0);
  expect(game.choice).toBeNull();
});
