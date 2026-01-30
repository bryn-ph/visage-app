import { useEffect, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { listen } from "@tauri-apps/api/event";

export default function VisualiserCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<AudioEngine | null>(null);

    // CONFIG
    const SMOOTHING_FACTOR = 0.15;
    const BAR_WIDTH = 4;
    const BAR_SPACING = 2;
    const BAR_HEIGHT = 0.9;

    const createGradient = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "rgba(15,23,42,0.8)");
        gradient.addColorStop(0.5, "rgba(56,189,248,0.6)");
        gradient.addColorStop(1, "rgba(255,255,255,0.5)");
        return gradient;
    };

    const resize = (canvas: HTMLCanvasElement) => {
        const parent = canvas.parentElement!;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const audio = new AudioEngine();

        audioRef.current = audio;

        resize(canvas);
        const onResize = () => resize(canvas);
        window.addEventListener("resize", onResize);

        // ✅ SINGLE listener, correct type
        const unlistenPromise = listen<number[]>("audio-data", (event) => {
            audio.pushSamples(new Float32Array(event.payload));
        });

        const smoothedData = new Float32Array(audio.analyser.frequencyBinCount);

        const render = () => {
            requestAnimationFrame(render);

            const data = audio.getFrequencyData();
            const gradient = createGradient(ctx, canvas);

            for (let i = 0; i < data.length; i++) {
                smoothedData[i] =
                    SMOOTHING_FACTOR * data[i] +
                    (1 - SMOOTHING_FACTOR) * smoothedData[i];
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            smoothedData.forEach((value, i) => {
                const normalized = value / 255;
                const height = Math.pow(normalized, 0.5) * canvas.height * BAR_HEIGHT;

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    i * (BAR_WIDTH + BAR_SPACING),
                    canvas.height - height,
                    BAR_WIDTH,
                    height
                );
            });
        };

        render();

        return () => {
            window.removeEventListener("resize", onResize);
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 block"
        />
    );
}
