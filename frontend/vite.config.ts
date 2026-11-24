import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// HTTPS local si les certs mkcert existent
const certsDir = path.resolve(__dirname, "../certs");
const hasCerts = fs.existsSync(path.join(certsDir, "localhost-key.pem"));

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        https: hasCerts ? {
            key: fs.readFileSync(path.join(certsDir, "localhost-key.pem")),
            cert: fs.readFileSync(path.join(certsDir, "localhost.pem")),
        } : undefined,
        proxy: {
            "/api": {
                target: hasCerts ? "https://localhost:3001" : "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
            "/socket.io": {
                target: hasCerts ? "https://localhost:3001" : "http://localhost:3001",
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            "/uploads": {
                target: hasCerts ? "https://localhost:3001" : "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
