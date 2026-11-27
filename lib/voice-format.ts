import { fileTypeFromBuffer } from "file-type";
import { parseBuffer } from "music-metadata";

export const maxVoiceBytes = 2 * 1024 * 1024;
export const maxVoiceSeconds = 90;
const formats = {
  "audio/webm": { ext: "webm", detected: ["video/webm", "audio/webm"], codec: /OPUS|VORBIS/i },
  "audio/mp4": { ext: "m4a", detected: ["video/mp4", "audio/mp4", "audio/x-m4a"], codec: /AAC|MP4A|OPUS/i },
  "audio/ogg": { ext: "ogg", detected: ["audio/ogg", "audio/opus"], codec: /OPUS|VORBIS/i },
  "audio/wav": { ext: "wav", detected: ["audio/wav", "audio/vnd.wave"], codec: /PCM/i },
} as const;

export async function inspectVoice(bytes: Uint8Array, declared: string, limit: number) {
  if (!bytes.length || bytes.length > maxVoiceBytes) return null;
  const mime = declared.split(";")[0].trim().toLowerCase();
  if (!Object.hasOwn(formats, mime)) return null;
  const format = formats[mime as keyof typeof formats];
  try {
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !format.detected.some(type => detected.mime === type)) return null;
    const { format: info } = await parseBuffer(bytes, { mimeType: mime, size: bytes.length }, { duration: true, skipCovers: true });
    const seconds = info.duration;
    const voices = [info.codec, ...info.trackInfo.flatMap(track => [track.codecName, track.codecId])];
    if (!seconds || !Number.isFinite(seconds) || seconds < .1 || seconds > limit + .45 ||
      !voices.some(codec => codec && format.codec.test(codec)) || !info.sampleRate || !info.numberOfChannels ||
      info.trackInfo.some(track => track.video || track.type === 1)) return null;
    return { mime, ext: format.ext, seconds: Math.ceil(seconds) };
  } catch { return null; }
}
