import { CambridgePaper, type PaperPageProps } from "../../cambridge-paper";

export const metadata = { title: "Làm bài Flyers" };
export default function FlyersPaper(props: PaperPageProps) { return <CambridgePaper {...props} level="flyers"/>; }
