import { registerRootComponent } from "expo";

import App from "./App";
import { API_BASE_URL } from "./services/api/config";
import { registerBackgroundHandler } from "./services/notifications";
import { logStartupDiagnostics } from "./utils/diagnostics";

// Printed before anything else so a misconfigured build is obvious in the logs.
logStartupDiagnostics(API_BASE_URL);

// Firebase requires the background/quit-state message handler to be registered
// at module scope, before React mounts — not inside a component.
registerBackgroundHandler();

registerRootComponent(App);
