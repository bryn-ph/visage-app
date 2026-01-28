import { useEffect, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";

export default function VisualiserCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<AudioEngine | null>(null);

    // CONFIG variables
    const SMOOTHING_FACTOR = 0.15; // smoothing factor for exponential smoothing (0 to 1)
    const BAR_WIDTH = 4; // width of each frequency bar in pixels
    const BAR_SPACING = 2; // spacing between bars in pixels    
    const BAR_HEIGHT = 0.9; // multiplier for bar height scaling

    // handle user action to connect system audio
    const handleConnectAudio = () => {
        if (audioRef.current) {
            audioRef.current.connectSystemAudio();
        }
    };

    // create gradient for bars
    const createGradient = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "rgba(15,23,42,0.8)"); // dark blue
        gradient.addColorStop(0.5, "rgba(56,189,248,0.6)"); // light blue
        gradient.addColorStop(1, "rgba(255,255,255,0.5)"); // white
        return gradient;
    };

    // resize canvas to fill parent container
    const resize = (canvas: HTMLCanvasElement) => {
        const parent = canvas.parentElement!;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    };

    useEffect(() => {
        const canvas = canvasRef.current!; // get canvas element
        const ctx = canvas.getContext("2d")!; // get 2D rendering context
        const audio = new AudioEngine(); // create audio engine instance

        // initial resize
        resize(canvas);
        window.addEventListener("resize", () => resize(canvas));

        // store audio engine in ref
        audioRef.current = audio;
        const smoothedData = new Float32Array(audio.analyser.frequencyBinCount);

        const render = () => {
            requestAnimationFrame(render);

            const data = audio.getFrequencyData();
            const gradient = createGradient(ctx, canvas);

            // apply exponential smoothing
            for (let i = 0; i < data.length; i++) {
                smoothedData[i] =
                    SMOOTHING_FACTOR * data[i] + (1 - SMOOTHING_FACTOR) * smoothedData[i];
            }

            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // draw bars
            smoothedData.forEach((value, i) => {
                const normalized = value / 255;
                const height = Math.pow(normalized, 0.5) * canvas.height * BAR_HEIGHT;

                ctx.fillStyle = gradient;
                ctx.fillRect(i * (BAR_WIDTH + BAR_SPACING), canvas.height - height, BAR_WIDTH, height);
            });
        };

        render();

        return () => window.removeEventListener("resize", () => resize(canvas));
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block"
            />
            <button
                onClick={handleConnectAudio}
                className="
                absolute
                top-12
                right-4
                z-60
                rounded-lg
                bg-white/20
                px-4
                py-2
                text-sm
                font-medium
                text-white
                backdrop-blur-md
                hover:bg-white/30
                transition
                "
            >
                Share System Audio
            </button>
        </>
    );
}
