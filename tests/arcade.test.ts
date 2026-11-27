import { expect, test } from "vitest";
import { ArcadeSimulation, mazeDestinations, stepMaze } from "../lib/games/arcade-runtime";
import { demoContent } from "../lib/demo";
import { grade } from "../lib/game";
import { riskMarker } from "../lib/games/arcade-templates";

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
  for (let i = 0; i < 60; i++) flight.tick(200);
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

test("balloons register only the touched target and moles cannot be collected while hidden", () => {
  const balloon = new ArcadeSimulation("balloon-pop", item, false);
  const target = balloon.targets()[1];
  balloon.hitTarget({ x: target.x, y: target.y - 40 });
  expect(balloon.choice).toBe(1);
  const mole = new ArcadeSimulation("whack-a-mole", item, false);
  for (let frame = 0; frame < 60 && mole.targets()[1].visible; frame++) mole.tick(50);
  expect(mole.targets()[1].visible).toBe(false);
  mole.pick(1);
  expect(mole.choice).toBeNull();
});

test("Win or Lose computes the bet on the server and accepts it at most once", () => {
  const quiz = demoContent("win-or-lose-quiz");
  expect(grade("win-or-lose-quiz", quiz, [["Above", riskMarker], ["Read"]])).toMatchObject({ score: 0, total: 3 });
  expect(grade("win-or-lose-quiz", quiz, [["Below", riskMarker], ["Read", riskMarker]])).toMatchObject({ score: 2, total: 3 });
  expect(grade("win-or-lose-quiz", quiz, [["9000", riskMarker], ["Read"]])).toMatchObject({ score: 1, total: 2 });
});
