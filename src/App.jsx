import { useAppPath } from "./lib/routing";
import NeuroChat from "./neurochat";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";

function App() {
  const path = useAppPath();

  if (path === "/privacy") {
    return <Privacy />;
  }

  if (path === "/app" || path.startsWith("/app/")) {
    return <NeuroChat />;
  }

  return <Landing />;
}

export default App;
