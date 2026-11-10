import { AudioLines, FileAudio, Mic, Scissors } from 'lucide-react';

export default [
  { id: 'audio-convert', name: "Convert Audio", tagline: "MP3, WAV, OGG, FLAC, M4A — with bitrate and sample-rate control.", description: "Real transcoding on your device, including an MP3 encoder bundled for offline use.", group: 'audio', icon: AudioLines, keywords: ["mp3", "wav", "ogg", "flac", "m4a", "format"], popular: true, needs: ['webcodecs'], load: () => import('../../tools/media/AudioConvert.jsx') },
  { id: 'audio-extract', name: "Extract Audio from Video", tagline: "Pull the sound out of any video as MP3, WAV, OGG or M4A.", description: "Rips the audio track locally and encodes it in the format you choose.", group: 'audio', icon: FileAudio, keywords: ["mp4 to mp3", "video to audio", "rip"], popular: true, needs: ['webcodecs'], load: () => import('../../tools/media/AudioExtract.jsx') },
  { id: 'audio-trim', name: "Trim Audio", tagline: "Cut an audio file to the section you want.", description: "Set start and end in seconds and export WAV, MP3 or OGG.", group: 'audio', icon: Scissors, keywords: ["cut", "clip", "ringtone"], needs: ['webcodecs'], load: () => import('../../tools/media/AudioTrim.jsx') },
  { id: 'audio-voice-recorder', name: "Voice Recorder", tagline: "Record from your microphone and save as WAV or MP3.", description: "Live waveform, playback, and conversion — nothing leaves your device.", group: 'audio', icon: Mic, keywords: ["record", "microphone", "dictaphone", "memo"], needs: ['mediaRecorder'], load: () => import('../../tools/media/VoiceRecorder.jsx') },
];
