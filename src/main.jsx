import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function Root() {
  useEffect(() => {
    const splash = document.getElementById("app-splash");
    if (splash) splash.remove();
  }, []);

  return <App />;
}

export default Root;

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);