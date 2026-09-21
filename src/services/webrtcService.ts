export class WebRTCService {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('yanar_webrtc_channel');
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  async getLocalMedia(video = true, audio = true): Promise<{ stream: MediaStream | null; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { stream: null, error: 'MediaDevices API not supported in this browser' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audio,
      });

      this.localStream = stream;
      this.setupAudioAnalysis(stream);
      return { stream };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Camera or Microphone permission denied';
      console.warn('WebRTC getUserMedia error:', errorMsg);
      return { stream: null, error: errorMsg };
    }
  }

  async startScreenShare(): Promise<{ stream: MediaStream | null; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return { stream: null, error: 'Screen sharing not supported in this browser' };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.screenStream = stream;
      return { stream };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Screen sharing cancelled';
      return { stream: null, error: errorMsg };
    }
  }

  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  stopAllTracks(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.stopScreenShare();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private setupAudioAnalysis(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
      }
    } catch (err) {
      console.warn('AudioContext setup error:', err);
    }
  }

  getAudioLevel(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(100, Math.round((avg / 255) * 100));
  }

  // Dual-tab signaling helper
  sendSignal(type: string, payload: unknown): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, payload });
    }
  }

  onSignal(callback: (event: MessageEvent) => void): () => void {
    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', callback);
      return () => this.broadcastChannel?.removeEventListener('message', callback);
    }
    return () => {};
  }
}

export const webrtcService = new WebRTCService();
