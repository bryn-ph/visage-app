import "./App.css";
import Titlebar from "./components/Titlebar";
import VisualiserCanvas from "./visualiser/VisualiserCanvas";

function App() {

  return (
    <main className="w-full h-full relative">
      <Titlebar />
      <VisualiserCanvas />

    </main>

  );
}

export default App;
