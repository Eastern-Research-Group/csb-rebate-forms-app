import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const { VITE_SERVER_BASE_PATH } = process.env;

  // allows the app to be accessed from a sub directory of a server (e.g. /csb)
  const serverBasePath =
    mode === "development" ? "" : VITE_SERVER_BASE_PATH || "";

  return defineConfig({
    base: serverBasePath,
    build: {
      outDir: "build",
      sourcemap: true,
      rollupOptions: {
        output: {
          entryFileNames: "static/js/[name]-[hash].js",
          chunkFileNames: "static/js/[name]-[hash].js",
          assetFileNames: ({ name }) => {
            const css = /\.(css)$/.test(name ?? "");
            const font = /\.(woff|woff2|eot|ttf|otf)$/.test(name ?? "");
            const media = /\.(png|jpe?g|gif|svg|webp|webm|mp3)$/.test(name ?? ""); // prettier-ignore
            const type = css ? "css/" : font ? "fonts/" : media ? "media/" : "";
            return `static/${type}[name]-[hash][extname]`;
          },
        },
      },
    },
    define: {
      "process.env": {},
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      open: true,
      port: 3000,
      proxy: {
        "/api": "http://localhost:3001",
        "/login": "http://localhost:3001",
        "/logout": "http://localhost:3001",
      },
    },
  });
};
