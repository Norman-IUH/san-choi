import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { paperOptions } from "@/lib/worksheet";
import { printable, type PrintParams } from "@/lib/worksheet-server";
import { renderWorksheet, type PrintImage } from "@/lib/worksheet-pdf";
import { mediaBucket } from "@/lib/media";
import { privilegedDatabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<PrintParams> }) {
  const raw = await request.text();
  if (raw.length > 8192) return new Response(null, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  const options = paperOptions.safeParse(input);
  if (!options.success) return new Response(null, { status: 400 });
  const source = await printable(await params, new URL(request.url).searchParams);
  const { version, colour } = options.data;
  if (!source || (version === "key" && !source.keys) || (version === "transcript" && !source.transcript)) return new Response(null, { status: 404 });
  const document = source.make(version);
  const paths = [...new Set(document.blocks.flatMap(block => block.figures?.map(figure => figure.path) ?? []))];
  const images = new Map<string, PrintImage>();
  for (let i = 0; i < paths.length; i += 6) {
    await Promise.all(paths.slice(i, i + 6).map(async path => {
      try {
        let input: Buffer | undefined;
        if (/^\/illustrations\/(?:starters|movers|flyers|practice|puzzles)\/[a-z0-9-]+\.(webp|png)$/.test(path)) {
          input = await readFile(join(process.cwd(), "public", path));
        } else if (path.startsWith(source.owner + "/") && /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(webp|png|jpg)$/.test(path)) {
          const { data } = await privilegedDatabase().storage.from(mediaBucket).download(path);
          if (data) input = Buffer.from(await data.arrayBuffer());
        }
        if (!input) return;
        const image = sharp(input, { limitInputPixels: 18_000_000 }).rotate().resize({ width: 1000, height: 640, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" });
        const { data, info } = await (colour ? image : image.grayscale()).jpeg({ quality: 78 }).toBuffer({ resolveWithObject: true });
        images.set(path, { bytes: data, width: info.width, height: info.height });
      } catch { /* The PDF marks which images were unavailable. */ }
    }));
  }
  const bytes = await renderWorksheet(document, options.data, images);
  const filename = version === "key" ? "dap-an.pdf" : version === "transcript" ? "transcript.pdf" : "bai-tap-san-choi.pdf";
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "private, no-store",
    "Cross-Origin-Resource-Policy": "same-origin" } });
}
