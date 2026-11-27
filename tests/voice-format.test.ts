import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { inspectVoice, maxVoiceBytes } from "../lib/voice-format";

test("voice validation checks the declared MIME, media structure and both limits", async () => {
  const fixture = await readFile("public/audio/practice/aa1000000004.wav");
  expect(await inspectVoice(fixture, "audio/wav", 90)).toMatchObject({ ext: "wav", mime: "audio/wav" });
  expect(await inspectVoice(fixture, "audio/wav", 1)).toBeNull();
  expect(await inspectVoice(fixture, "audio/mp4", 90)).toBeNull();
  expect(await inspectVoice(Buffer.from("not an audio file"), "audio/wav", 90)).toBeNull();
  expect(await inspectVoice(new Uint8Array(maxVoiceBytes + 1), "audio/wav", 90)).toBeNull();
});

test("Chromium synthetic MediaRecorder clips validate as WebM and MP4 audio", async () => {
  const webm = await readFile("tests/fixtures/voice-webm-opus.webm");
  const aac = await readFile("tests/fixtures/voice-mp4-aac.m4a");
  const opus = await readFile("tests/fixtures/voice-mp4-opus.m4a");
  expect(await inspectVoice(webm, "audio/webm;codecs=opus", 2)).toMatchObject({ ext: "webm" });
  expect(await inspectVoice(aac, "audio/mp4;codecs=mp4a.40.2", 2)).toMatchObject({ ext: "m4a" });
  expect(await inspectVoice(opus, "audio/mp4;codecs=opus", 2)).toMatchObject({ ext: "m4a" });
});
