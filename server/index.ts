/// <reference types="node" />

import { config } from "dotenv";
import { createApp } from "./app";

config({ path: ".env.local" });
config();

const port = Number(process.env.PORT || 8787);
const app = createApp();

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
