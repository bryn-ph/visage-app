
// class to handle audio input and analysis
export class AudioEngine {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    dataArray: Uint8Array<ArrayBuffer>;
    displayMediaOptions = {
        video: {
            displaySurface: "browser",
        },
        audio: true,
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        systemAudio: "include",
        surfaceSwitching: "include",
        monitorTypeSurfaces: "include",
    };

    // initialise audio context and analyser
    constructor() {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
    }

    // ask for displayMedia access and connect system audio
    async connectSystemAudio() {
        async function startCapture(displayMediaOptions: DisplayMediaStreamOptions) {
            let captureStream: MediaStream;
            try {
                captureStream = await (navigator.mediaDevices as any).getDisplayMedia(displayMediaOptions);
                return captureStream;
            } catch (err) {
                console.error("Error: " + err);
                throw err;
            }
        }
        const stream = await startCapture(this.displayMediaOptions);
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
    }

    // get frequency data for visualisation
    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}
