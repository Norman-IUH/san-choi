"use client";
import dynamic from "next/dynamic";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { LegacyRound, type RoundProps } from "./LegacyRound";

const WordRound = dynamic(() => import("./WordRound"));
const BoardRound = dynamic(() => import("./BoardRound"));
const PuzzleRound = dynamic(() => import("./PuzzleRound"));

export function GameRound(props: RoundProps) {
  if (isPuzzleTemplate(props.template)) return <PuzzleRound {...props}/>;
  if (props.template === "crossword" || props.template === "matching-pairs") return <BoardRound {...props}/>;
  return isWordTemplate(props.template) ? <WordRound {...props}/> : <LegacyRound {...props}/>;
}
