
// class to handle audio input and analysis
export class AudioEngine {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    dataArray: Uint8Array<ArrayBuffer>;

    // initialise audio context and analyser
    constructor() {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
    }

    // connect to microphone input
    async connectMicrophone() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
    }

    // get frequency data for visualisation
    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}
