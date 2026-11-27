import { CambridgePaper, type PaperPageProps } from "../../cambridge-paper";

export const metadata = { title: "Làm bài Movers" };

export default function MoversPaper(props: PaperPageProps) {
  return <CambridgePaper {...props} level="movers"/>;
}
