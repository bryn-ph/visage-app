import "./App.css";
import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import Titlebar from "./components/Titlebar";
import VisualiserCanvas from "./visualiser/VisualiserCanvas";

export default function App() {
  const win = getCurrentWebviewWindow();

  const [locked, setLocked] = useState(false);

  // Apply lock state to window
  useEffect(() => {
    const apply = async () => {
      await win.setIgnoreCursorEvents(locked);
      await win.setFocusable(!locked);
      await win.setAlwaysOnTop(locked);
    };

    apply().catch(console.error);
  }, [locked, win]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyL") {
        e.preventDefault();
        setLocked((v) => !v);
        return;
      }

      if (e.code === "F11") {
        e.preventDefault();
        try {
          const fs = await win.isFullscreen();
          await win.setSimpleFullscreen(!fs);

          setTimeout(() => {
            win.setIgnoreCursorEvents(locked).catch(console.error);
            win.setFocusable(!locked).catch(console.error);
          }, 50);
        } catch (err) {
          console.error(err);
        }
      }

      if (locked && e.code === "Escape") {
        e.preventDefault();
        setLocked(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, win]);

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      <Titlebar locked={locked} setLocked={setLocked} />
      <div className="relative w-full h-full">
        <VisualiserCanvas locked={locked} />
      </div>
    </main>
  );
}