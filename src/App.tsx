import "./App.css";
import Titlebar from "./components/titlebar";

function App() {

  // Music visualizer will go here
  return (
    <main className="w-full h-full relative">
      <Titlebar />
      <div className="h-full w-full flex items-center justify-center pt-10">
        <h1 className="text-black text-3xl">Visage App</h1>
      </div>

    </main>

  );
}

export default App;
