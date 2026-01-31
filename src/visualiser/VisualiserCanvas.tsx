import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { listen } from "@tauri-apps/api/event";

const STORAGE_KEY = "visage.visualiser.config.v1";


type VisualiserConfig = {
    smoothingFactor: number;
    barWidth: number;
    barSpacing: number;
    barHeight: number;
    trailAlpha: number;
    floor: number;
    gamma: number;
    topPadding: number;

    bassBinPct: number;
    bassThreshold: number;
    bassRange: number;
    bassBoost: number;
};

const DEFAULTS: VisualiserConfig = {
    smoothingFactor: 0.2,
    barWidth: 4,
    barSpacing: 10,
    barHeight: 0.3,
    trailAlpha: 0.15,
    floor: 0.04,
    gamma: 1.3,
    topPadding: 12,

    bassBinPct: 0.08,
    bassThreshold: 25,
    bassRange: 140,
    bassBoost: 0.9,
};

const PRESETS: Record<string, VisualiserConfig> = {
    Default: DEFAULTS,
    Crisp: {
        ...DEFAULTS,
        smoothingFactor: 0.12,
        trailAlpha: 0.10,
        gamma: 1.5,
        floor: 0.05,
        barHeight: 0.35,
    },
    Smooth: {
        ...DEFAULTS,
        smoothingFactor: 0.28,
        trailAlpha: 0.22,
        gamma: 1.2,
        floor: 0.03,
        barHeight: 0.32,
    },
    "Bass Boost": {
        ...DEFAULTS,
        bassBoost: 1.4,
        bassBinPct: 0.12,
        bassThreshold: 18,
        bassRange: 110,
        barHeight: 0.34,
        gamma: 1.25,
    },
};


function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export default function VisualiserCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>("Default");

    const applyPreset = (name: string) => {
        const preset = PRESETS[name];
        if (!preset) return;
        setConfig(preset);
    };


    // UI state
    const [open, setOpen] = useState(false);
    const [config, setConfig] = useState<VisualiserConfig>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULTS;
            const parsed = JSON.parse(raw) as Partial<VisualiserConfig>;
            return { ...DEFAULTS, ...parsed };
        } catch {
            return DEFAULTS;
        }
    });



    // persist config changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch {
            // ignore
        }
    }, [config]);


    // render-loop reads from ref
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    const setNum = (key: keyof VisualiserConfig, value: number) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    // settings schema for rendering number inputs
    const fields = useMemo(
        () =>
            [
                { key: "smoothingFactor", label: "Smoothing", min: 0, max: 1, step: 0.01 },
                { key: "barWidth", label: "Bar width", min: 1, max: 40, step: 1 },
                { key: "barSpacing", label: "Bar spacing", min: 0, max: 30, step: 1 },
                { key: "barHeight", label: "Bar height", min: 0.05, max: 2, step: 0.01 },
                { key: "trailAlpha", label: "Trail alpha", min: 0, max: 0.5, step: 0.01 },
                { key: "floor", label: "Noise floor", min: 0, max: 0.3, step: 0.01 },
                { key: "gamma", label: "Gamma", min: 0.5, max: 3, step: 0.05 },
                { key: "topPadding", label: "Top padding", min: 0, max: 200, step: 1 },

                { key: "bassBinPct", label: "Bass bin %", min: 0.01, max: 0.25, step: 0.01 },
                { key: "bassThreshold", label: "Bass threshold", min: 0, max: 255, step: 1 },
                { key: "bassRange", label: "Bass range", min: 1, max: 255, step: 1 },
                { key: "bassBoost", label: "Bass boost", min: 0, max: 2, step: 0.05 },
            ] as const,
        []
    );

    // main render loop
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const audio = new AudioEngine();

        const resize = () => {
            const parent = canvas.parentElement!;
            const dpr = window.devicePixelRatio || 1;
            const cssW = parent.clientWidth;
            const cssH = parent.clientHeight;
            canvas.width = Math.floor(cssW * dpr);
            canvas.height = Math.floor(cssH * dpr);
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
        };

        const applyDprTransform = () => {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        applyDprTransform();

        window.addEventListener("resize", resize);

        const unlistenPromise = listen<number[]>("audio-data", (event) => {
            audio.pushSamples(new Float32Array(event.payload));
        });

        const smoothedData = new Float32Array(audio.analyser.frequencyBinCount);

        const createGradient = (h: number) => {
            const g = ctx.createLinearGradient(0, h, 0, 0);
            g.addColorStop(0, "rgba(15,23,42,0.8)");
            g.addColorStop(0.5, "rgba(56,189,248,0.6)");
            g.addColorStop(1, "rgba(255,255,255,0.5)");
            return g;
        };

        const render = () => {
            requestAnimationFrame(render);
            applyDprTransform();

            const cssWidth = canvas.clientWidth;
            const cssHeight = canvas.clientHeight;

            const {
                smoothingFactor,
                barWidth,
                barSpacing,
                barHeight,
                trailAlpha,
                floor,
                gamma,
                topPadding,
                bassBinPct,
                bassThreshold,
                bassRange,
                bassBoost,
            } = configRef.current;

            const data = audio.getFrequencyData();

            // smoothing
            for (let i = 0; i < data.length; i++) {
                smoothedData[i] =
                    smoothingFactor * data[i] + (1 - smoothingFactor) * smoothedData[i];
            }

            // trail with transparency
            ctx.save();
            if (trailAlpha > 0) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
                ctx.fillRect(0, 0, cssWidth, cssHeight);
            } else {
                ctx.clearRect(0, 0, cssWidth, cssHeight);
            }
            ctx.restore();

            const available = Math.max(1, cssHeight - topPadding);

            const gradientFill = createGradient(cssHeight);
            ctx.fillStyle = gradientFill;

            const step = barWidth + barSpacing;
            const maxBars = Math.max(1, Math.floor(cssWidth / step));
            const bars = Math.min(smoothedData.length, maxBars);

            // bass energy from low bins
            const bassBins = Math.max(8, Math.floor(smoothedData.length * bassBinPct));
            let bassSum = 0;
            for (let i = 0; i < bassBins; i++) bassSum += smoothedData[i];
            const bassAvg = bassSum / bassBins;

            const bassNorm = clamp((bassAvg - bassThreshold) / bassRange, 0, 1);
            const bassLift = 1 + bassNorm * bassBoost;

            for (let i = 0; i < bars; i++) {
                const value = smoothedData[i];

                let normalized = value / 255;

                // noise floor gate
                normalized = Math.max(0, (normalized - floor) / (1 - floor));

                const contrasted = Math.pow(normalized, gamma);

                // weight lows higher
                const t = i / Math.max(1, bars - 1);
                const lowWeight = 1.6 - t * 0.9;

                let h = contrasted * available * barHeight * lowWeight * bassLift;
                h = Math.min(h, available);

                const x = i * step;
                ctx.fillRect(x, cssHeight - h, barWidth, h);
            }
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* Settings button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="
          absolute top-12 right-4 z-60
          rounded-lg bg-white/20 px-3 py-2
          text-sm font-medium text-white
          backdrop-blur-md hover:bg-white/30
          transition
        "
            >
                {open ? "Close Settings" : "Settings"}
            </button>

            {/* Panel */}
            {open && (
                <div
                    className="
            absolute top-24 right-4 z-60 w-[320px]
            rounded-xl bg-black/40 backdrop-blur-md
            border border-white/10
            p-4 text-white
            shadow-lg
          "
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">Visualiser Settings</div>
                        <button
                            onClick={() => setConfig(DEFAULTS)}
                            className="text-xs text-white/70 hover:text-white transition"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="mb-3 space-y-2">
                        <div className="text-xs text-white/70">Presets</div>
                        <div className="flex gap-2">
                            <select
                                value={selectedPreset}
                                onChange={(e) => setSelectedPreset(e.target.value)}
                                className="
        flex-1 rounded-md bg-white/10
        border border-white/10
        px-2 py-2 text-sm text-white
        outline-none focus:border-white/25
      "
                            >
                                {Object.keys(PRESETS).map((name) => (
                                    <option key={name} value={name} className="bg-slate-900">
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => applyPreset(selectedPreset)}
                                className="
        rounded-md bg-white/20 px-3 py-2
        text-sm font-medium text-white
        hover:bg-white/30 transition
      "
                            >
                                Apply
                            </button>
                        </div>
                    </div>


                    <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
                        {fields.map((f) => {
                            const key = f.key as keyof VisualiserConfig;
                            const value = config[key] as number;

                            return (
                                <label key={String(f.key)} className="block">
                                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                        <span>{f.label}</span>
                                        <span className="tabular-nums">{value}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={value}
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                        onChange={(e) => {
                                            const raw = Number(e.target.value);
                                            if (Number.isNaN(raw)) return;
                                            setNum(key, clamp(raw, f.min, f.max));
                                        }}
                                        className="
                      w-full rounded-md bg-white/10
                      border border-white/10
                      px-2 py-1 text-sm
                      outline-none
                      focus:border-white/25
                    "
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
