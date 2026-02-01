import React from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { FaWindowMinimize, FaWindowMaximize, FaTimes } from "react-icons/fa";

type Props = {
    locked: boolean;
    setLocked: (v: boolean | ((prev: boolean) => boolean)) => void;
};

const Titlebar: React.FC<Props> = ({ locked, setLocked }) => {
    const win = getCurrentWebviewWindow();

    const handleClose = async () => {
        await win.close();
    };

    const handleMinimize = async () => {
        await win.minimize();
    };

    const handleMaximize = async () => {
        const maximized = await win.isMaximized();
        if (maximized) await win.unmaximize();
        else await win.maximize();
    };

    return (
        <div className="absolute top-0 left-0 w-full h-10 z-50 flex justify-end items-center bg-black/60 backdrop-blur-md">
            <div
                className="absolute left-0 top-0 h-full w-[calc(100%-220px)] cursor-grab"
                data-tauri-drag-region
            />

            <div className="flex gap-2 px-3 z-10 items-center">
                <button
                    className="rounded px-3 py-1 text-xs text-white/90 bg-white/10 hover:bg-white/20 transition"
                    onClick={() => setLocked((v) => !v)}
                    title="Ctrl+Shift+L"
                >
                    {locked ? "Unlock (Ctrl+Shift+L or ESC)" : "Lock (Ctrl+Shift+L)"}
                </button>

                <button
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-yellow-400/20 transition"
                    onClick={handleMinimize}
                >
                    <FaWindowMinimize className="text-white text-sm" />
                </button>
                <button
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-green-400/20 transition"
                    onClick={handleMaximize}
                >
                    <FaWindowMaximize className="text-white text-sm" />
                </button>
                <button
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/40 transition"
                    onClick={handleClose}
                >
                    <FaTimes className="text-white text-sm" />
                </button>
            </div>
        </div>
    );
};

export default Titlebar;
