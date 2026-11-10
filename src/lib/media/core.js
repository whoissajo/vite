import {
  Input, Output, BlobSource, ALL_FORMATS, Conversion, BufferTarget, CanvasSink,
  Mp4OutputFormat, WebMOutputFormat, MovOutputFormat, WavOutputFormat, Mp3OutputFormat, OggOutputFormat, FlacOutputFormat,
  QUALITY_VERY_LOW, QUALITY_LOW, QUALITY_MEDIUM, QUALITY_HIGH, QUALITY_VERY_HIGH, canEncodeAudio,
} from 'mediabunny';
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';

let mp3Done = false;
export async function ensureMp3() { if (!mp3Done) { if (!(await canEncodeAudio('mp3'))) registerMp3Encoder(); mp3Done = true; } }

export const QUALITY = { 'very-low': QUALITY_VERY_LOW, low: QUALITY_LOW, medium: QUALITY_MEDIUM, high: QUALITY_HIGH, 'very-high': QUALITY_VERY_HIGH };
export const VIDEO_ACCEPT = 'video/*,.mp4,.m4v,.mov,.webm,.mkv,.ogv';
export const AUDIO_ACCEPT = 'audio/*,video/mp4,video/webm,.mp3,.wav,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.mp4,.mov,.webm,.mkv';

export const FORMATS = {
  mp4: { label: 'MP4', ext: 'mp4', mime: 'video/mp4', make: () => new Mp4OutputFormat({ fastStart: 'in-memory' }), video: true },
  webm: { label: 'WebM', ext: 'webm', mime: 'video/webm', make: () => new WebMOutputFormat(), video: true },
  mov: { label: 'MOV', ext: 'mov', mime: 'video/quicktime', make: () => new MovOutputFormat({ fastStart: 'in-memory' }), video: true },
  m4a: { label: 'M4A (AAC)', ext: 'm4a', mime: 'audio/mp4', make: () => new Mp4OutputFormat({ fastStart: 'in-memory' }), audio: true },
  mp3: { label: 'MP3', ext: 'mp3', mime: 'audio/mpeg', make: () => new Mp3OutputFormat(), audio: true },
  wav: { label: 'WAV', ext: 'wav', mime: 'audio/wav', make: () => new WavOutputFormat(), audio: true },
  ogg: { label: 'OGG (Opus)', ext: 'ogg', mime: 'audio/ogg', make: () => new OggOutputFormat(), audio: true },
  flac: { label: 'FLAC', ext: 'flac', mime: 'audio/flac', make: () => new FlacOutputFormat(), audio: true },
};

export const openInput = (file) => new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

/** Probe a media file. Throws a readable error when the browser can't decode it. */
export async function probe(file) {
  const input = openInput(file);
  try {
    const [v, a, duration, fmt] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack(), input.computeDuration(), input.getFormat()]);
    if (!v && !a) throw new Error('No audio or video track found in this file.');
    const info = { duration, format: fmt.name, size: file.size, hasVideo: !!v, hasAudio: !!a };
    if (v) {
      Object.assign(info, { width: v.displayWidth, height: v.displayHeight, vcodec: v.codec, rotation: await v.getRotation() });
      try { const st = await v.computePacketStats(200); info.fps = Math.round(st.averagePacketRate * 100) / 100; info.vbitrate = Math.round(st.averageBitrate); } catch { /* optional */ }
      try { info.decodable = await v.canDecode(); } catch { info.decodable = true; }
    }
    if (a) { Object.assign(info, { acodec: a.codec, channels: a.numberOfChannels, sampleRate: a.sampleRate }); try { const st = await a.computePacketStats(200); info.abitrate = Math.round(st.averageBitrate); } catch { /* optional */ } }
    try { info.tags = await input.getMetadataTags(); } catch { /* optional */ }
    return info;
  } finally { input.dispose(); }
}

/**
 * Real transcode via WebCodecs. opts: { fmt, video: {…ConversionVideoOptions}|false, audio: {…}|false, trim:{start,end}, onProgress, signal }
 * Returns { blob, ext, mime }. Throws if nothing could be encoded.
 */
export async function transcode(file, { fmt, video, audio, trim, onProgress, signal } = {}) {
  const f = FORMATS[fmt]; if (!f) throw new Error('Unknown output format');
  if (fmt === 'mp3') await ensureMp3();
  const input = openInput(file); const target = new BufferTarget(); const output = new Output({ format: f.make(), target });
  try {
    const opt = { input, output, showWarnings: false };
    if (video === false || f.audio) opt.video = { discard: true }; else if (video) opt.video = video;
    if (audio === false) opt.audio = { discard: true }; else if (audio) opt.audio = audio;
    if (trim && (trim.start > 0 || trim.end > 0)) opt.trim = { start: trim.start || 0, ...(trim.end > 0 ? { end: trim.end } : {}) };
    const conv = await Conversion.init(opt);
    if (!conv.isValid) { const why = conv.discardedTracks.map((d) => d.reason).join(', '); throw new Error(`This browser can't produce ${f.label} from this file (${why || 'no encodable tracks'}).`); }
    conv.onProgress = (p) => onProgress?.(p);
    signal?.addEventListener('abort', () => conv.cancel(), { once: true });
    await conv.execute();
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    return { blob: new Blob([target.buffer], { type: f.mime }), ext: f.ext, mime: f.mime, discarded: conv.discardedTracks };
  } finally { input.dispose(); }
}

/** Yield canvases at given timestamps (seconds) from the primary video track. */
export async function* frameAt(file, times, { width, height, fit = 'contain' } = {}) {
  const input = openInput(file);
  try {
    const track = await input.getPrimaryVideoTrack(); if (!track) throw new Error('This file has no video track.');
    const sink = new CanvasSink(track, { width, height, fit, poolSize: 2 });
    for await (const w of sink.canvasesAtTimestamps(times)) yield w;
  } finally { input.dispose(); }
}
export const codecLabel = (c) => ({ avc: 'H.264', hevc: 'H.265', vp8: 'VP8', vp9: 'VP9', av1: 'AV1', aac: 'AAC', opus: 'Opus', mp3: 'MP3', vorbis: 'Vorbis', flac: 'FLAC', 'pcm-s16': 'PCM 16-bit', 'pcm-f32': 'PCM float' }[c] || c || '—');
