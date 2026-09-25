/**
 * SyncField Web Audio Engine
 * Provides audio synthesis for UI feedback (verification chimes, checkpoint pulses, alerts)
 * and voice note recording / waveform synthesis.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /* --- UI Sound Effects --- */
  playBeep(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.05) {
    if (!this.soundEnabled) return;
    try {
      this._initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked by browser policy until interaction
    }
  }

  playCheckpointChime() {
    this.playBeep(880, 'sine', 0.05, 0.04);
    setTimeout(() => this.playBeep(1320, 'sine', 0.06, 0.04), 60);
  }

  playVerificationSuccess() {
    if (!this.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.25, 0.08), i * 90);
    });
  }

  playWarningBuzz() {
    this.playBeep(220, 'sawtooth', 0.15, 0.06);
    setTimeout(() => this.playBeep(180, 'sawtooth', 0.2, 0.07), 120);
  }

  playClick() {
    this.playBeep(1200, 'sine', 0.02, 0.03);
  }

  /* --- Voice Note Recording & Waveform --- */
  async startVoiceRecording(onDataAvailable) {
    try {
      this._initContext();
      this.audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;
        if (onDataAvailable) onDataAvailable(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start();
      return { success: true, mode: 'live' };
    } catch (err) {
      console.warn('Microphone access unavailable or denied. Using tactical audio synthesis.', err);
      this.isRecording = true;
      return { success: true, mode: 'synthetic' };
    }
  }

  stopVoiceRecording(onDataAvailable) {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    } else if (this.isRecording) {
      this.isRecording = false;
      const durationSeconds = 18;
      const syntheticAudio = {
        name: `voice_note_${Date.now()}.wav`,
        duration: `${durationSeconds}s`,
        sizeBytes: 288000,
        transcript: 'Technician report: Visual inspection confirms inverter B2 phase imbalance. Thermal hotspot detected on busbar connection 3. Recommend immediate torque check.',
        url: null
      };
      if (onDataAvailable) onDataAvailable(syntheticAudio);
    }
  }

  drawWaveform(canvas, isActive = false) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#060b13';
    ctx.fillRect(0, 0, width, height);

    const bars = 40;
    const barWidth = width / bars - 2;

    for (let i = 0; i < bars; i++) {
      let barHeight;
      if (isActive) {
        barHeight = Math.random() * (height - 8) + 4;
      } else {
        barHeight = Math.sin(i * 0.3) * (height / 3) + (height / 2.5);
      }
      const x = i * (barWidth + 2);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = isActive ? '#f43f5e' : '#06b6d4';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}

window.soundEngine = new AudioEngine();
