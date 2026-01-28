import "./App.css";
import Titlebar from "./components/Titlebar";
import VisualiserCanvas from "./visualiser/VisualiserCanvas";

function App() {
  return (
    <main className="w-screen h-screen flex flex-co">
      <Titlebar />
      <div className="relative flex-1 overflow-hidden">
        <VisualiserCanvas />
      </div>
    </main>
  );
}


export default App;
