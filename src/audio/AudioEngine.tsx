export class AudioEngine {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    dataArray: Uint8Array<ArrayBuffer>;

    constructor() {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.dataArray = new Uint8Array(
            new ArrayBuffer(this.analyser.frequencyBinCount)
        );
    }

    pushSamples(samples: Float32Array) {
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }

        // 🔑 Normalize here
        const normalized = new Float32Array(
            new ArrayBuffer(samples.byteLength)
        );
        normalized.set(samples);

        const buffer = this.audioContext.createBuffer(
            1,
            normalized.length,
            this.audioContext.sampleRate
        );

        buffer.copyToChannel(normalized, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.analyser);
        source.start();
    }

    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}
