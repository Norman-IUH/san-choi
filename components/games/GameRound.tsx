"use client";
import dynamic from "next/dynamic";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";
import { LegacyRound, type RoundProps } from "./LegacyRound";

const WordRound = dynamic(() => import("./WordRound"));
const BoardRound = dynamic(() => import("./BoardRound"));
const PuzzleRound = dynamic(() => import("./PuzzleRound"));
const ArcadeRound = dynamic(() => import("./ArcadeRound"), { ssr: false });

export function GameRound(props: RoundProps) {
  if (isArcadeTemplate(props.template)) return <ArcadeRound {...props}/>;
  if (isPuzzleTemplate(props.template)) return <PuzzleRound {...props}/>;
  if (props.template === "crossword" || props.template === "matching-pairs") return <BoardRound {...props}/>;
  return isWordTemplate(props.template) ? <WordRound {...props}/> : <LegacyRound {...props}/>;
}
