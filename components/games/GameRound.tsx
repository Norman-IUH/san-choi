"use client";
import dynamic from "next/dynamic";
import { isWordTemplate } from "@/lib/games/word-templates";
import { LegacyRound, type RoundProps } from "./LegacyRound";

const WordRound = dynamic(() => import("./WordRound"));
const BoardRound = dynamic(() => import("./BoardRound"));

export function GameRound(props: RoundProps) {
  if (props.template === "crossword" || props.template === "matching-pairs") return <BoardRound {...props}/>;
  return isWordTemplate(props.template) ? <WordRound {...props}/> : <LegacyRound {...props}/>;
}
