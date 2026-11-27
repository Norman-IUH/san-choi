import { CambridgePaper, type PaperPageProps } from "../../cambridge-paper";

export const metadata = { title: "Làm bài Starters" };

export default function StarterPaper(props: PaperPageProps) {
  return <CambridgePaper {...props} level="starters"/>;
}
