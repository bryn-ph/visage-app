// src/components/Titlebar/Titlebar.tsx
import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { FaWindowMinimize, FaWindowMaximize, FaTimes } from 'react-icons/fa';

const Titlebar: React.FC = () => {
    console.log('Rendering Titlebar component');
    const handleClose = async () => {
        const window = getCurrentWindow();
        console.log('Closing window?', window);
        await window.close();
    };

    const handleMinimize = async () => {
        const window = getCurrentWindow();
        await window.minimize();
    };

    const handleMaximize = async () => {
        const window = getCurrentWindow();
        const maximized = await window.isMaximized();
        if (maximized) {
            await window.unmaximize();
        } else {
            await window.maximize();
        }
    };

    return (
        <div className="absolute top-0 left-0 w-full h-10 z-50 flex justify-end items-center bg-black/60 backdrop-blur-md">
            {/* Drag region */}
            <div
                className="absolute left-0 top-0 h-full w-[calc(100%-120px)] cursor-grab"
                data-tauri-drag-region
            />

            {/* Buttons */}
            <div className="flex gap-2 px-3 z-10">
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
