import { useEffect, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { listen } from "@tauri-apps/api/event";

export default function VisualiserCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // CONFIG
    const SMOOTHING_FACTOR = 0.2;
    const BAR_WIDTH = 8;
    const BAR_SPACING = 3;
    const BAR_HEIGHT = 0.3;
    const TRAIL_ALPHA = 0.18;
    const FLOOR = 0.04;
    const GAMMA = 1.3;
    const TOP_PADDING = 12;



    const createGradient = (ctx: CanvasRenderingContext2D, h: number) => {
        const g = ctx.createLinearGradient(0, h, 0, 0);
        g.addColorStop(0, "rgba(15,23,42,0.8)");
        g.addColorStop(0.5, "rgba(56,189,248,0.6)");
        g.addColorStop(1, "rgba(255,255,255,0.5)");
        return g;
    };

    const resize = (canvas: HTMLCanvasElement) => {
        const parent = canvas.parentElement!;
        const dpr = window.devicePixelRatio || 1;

        const cssW = parent.clientWidth;
        const cssH = parent.clientHeight;

        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);

        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const audio = new AudioEngine();

        resize(canvas);
        const onResize = () => resize(canvas);
        window.addEventListener("resize", onResize);

        const applyDprTransform = () => {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        applyDprTransform();

        const unlistenPromise = listen<number[]>("audio-data", (event) => {
            audio.pushSamples(new Float32Array(event.payload));
        });

        const smoothedData = new Float32Array(audio.analyser.frequencyBinCount);

        const render = () => {
            requestAnimationFrame(render);
            applyDprTransform();

            const cssWidth = canvas.clientWidth;
            const cssHeight = canvas.clientHeight;

            const data = audio.getFrequencyData();

            // smoothing
            for (let i = 0; i < data.length; i++) {
                smoothedData[i] =
                    SMOOTHING_FACTOR * data[i] + (1 - SMOOTHING_FACTOR) * smoothedData[i];
            }

            // TRAIL with transparency (no black background)
            ctx.save();
            if (TRAIL_ALPHA > 0) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
                ctx.fillRect(0, 0, cssWidth, cssHeight);
            } else {
                ctx.clearRect(0, 0, cssWidth, cssHeight);
            }
            ctx.restore();

            const available = cssHeight - TOP_PADDING;

            const gradient = createGradient(ctx, cssHeight);
            ctx.fillStyle = gradient;

            const step = BAR_WIDTH + BAR_SPACING;
            const maxBars = Math.floor(cssWidth / step);
            const bars = Math.min(smoothedData.length, maxBars);

            // Bass energy (first ~8% bins)
            const bassBins = Math.max(8, Math.floor(smoothedData.length * 0.08));
            let bassSum = 0;
            for (let i = 0; i < bassBins; i++) bassSum += smoothedData[i];
            const bassAvg = bassSum / bassBins;

            const bassNorm = Math.min(1, Math.max(0, (bassAvg - 25) / 140)); // tune
            const bassBoost = 1 + bassNorm * 0.9;

            for (let i = 0; i < bars; i++) {
                const value = smoothedData[i];

                let normalized = value / 255;

                // optional: small floor to reduce noise
                normalized = Math.max(0, (normalized - FLOOR) / (1 - FLOOR));


                const contrasted = Math.pow(normalized, GAMMA);

                // weight lows higher
                const t = i / Math.max(1, bars - 1);
                const lowWeight = 1.6 - t * 0.9;

                let height = contrasted * available * BAR_HEIGHT * lowWeight * bassBoost;
                height = Math.min(height, available);

                const x = i * step;
                ctx.fillRect(x, cssHeight - height, BAR_WIDTH, height);
            }

        };

        render();

        return () => {
            window.removeEventListener("resize", onResize);
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 block" />;
}
