import InterviewRoom from "./pages/InterviewRoom";
import VideoPanel from "./components/VideoPanel";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="App">
      {/* <VideoPanel stream={localStream} /> */}
      <InterviewRoom />
    </div>
  );
}

export default App;