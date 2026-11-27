"use client";
import dynamic from "next/dynamic";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";
import { isAudioPractice } from "@/lib/games/practice";
import { isProductive } from "@/lib/games/productive";
import { LegacyRound, type RoundProps } from "./LegacyRound";

const WordRound = dynamic(() => import("./WordRound"));
const BoardRound = dynamic(() => import("./BoardRound"));
const PuzzleRound = dynamic(() => import("./PuzzleRound"));
const ArcadeRound = dynamic(() => import("./ArcadeRound"), { ssr: false });
const PracticeRound = dynamic(() => import("./PracticeRound"));
const ProductiveRound = dynamic(() => import("./ProductiveRound"));

export function GameRound(props: RoundProps) {
  const practice = props.items[props.index]?.practice;
  if (practice && isAudioPractice(practice.mode)) return <PracticeRound {...props}/>;
  if (practice?.production && isProductive(practice.mode)) return <ProductiveRound {...props}/>;
  if (isArcadeTemplate(props.template)) return <ArcadeRound {...props}/>;
  if (isPuzzleTemplate(props.template)) return <PuzzleRound {...props}/>;
  if (props.template === "crossword" || props.template === "matching-pairs") return <BoardRound {...props}/>;
  return isWordTemplate(props.template) ? <WordRound {...props}/> : <LegacyRound {...props}/>;
}
