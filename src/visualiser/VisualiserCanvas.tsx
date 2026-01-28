import { useEffect, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";

// canvas component for audio visualisation
export default function VisualiserCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<AudioEngine | null>(null);

    // setup canvas and audio on mount
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // initialise audio engine
        // can replace with audio file or other source later
        const audio = new AudioEngine();
        audioRef.current = audio;

        // connect to microphone
        audio.connectMicrophone();

        // render loop
        const render = () => {
            requestAnimationFrame(render);
            const data = audio.getFrequencyData();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / data.length;
            data.forEach((value, i) => {
                const height = value * 2;
                ctx.fillStyle = "CanvasGradient";
                ctx.fillRect(
                    i * barWidth,
                    canvas.height - height,
                    barWidth,
                    height
                );
            });
        };

        render();
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0" />;
}
