import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";
// import { readdyJsxRuntimeProxyPlugin } from "./vite.jsx-runtime-proxy";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;
//const proxyPlugins = isPreview ? [readdyJsxRuntimeProxyPlugin()] : [];
// https://vite.dev/config/
// Plugin: let /coas/*.pdf bypass the SPA history fallback
function serveCoasPlugin() {
  return {
    name: 'serve-coas',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && req.url.startsWith('/coas/')) {
          // Strip query string so Vite's static file middleware finds the file
          req.url = req.url.split('?')[0];
        }
        next();
      });
    },
  };
}

export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
    /*
     * Theme token — tree-shaken at build time.
     * Vintage build (vintagepeptides.com):
     *   VITE_THEME is unset or 'vintage'  →  no spa.css imported
     * Spa build (valkyriepeptides.com):
     *   Set VITE_THEME=spa in Vercel environment variables
     *   → src/themes/spa.css is dynamically imported in main.tsx
     *   → all CSS overrides activate, font-family, colors, components reskinned
     *
     * To test locally:
     *   VITE_THEME=spa npm run dev
     * Vercel:
     *   vintagepeptides.com project  → no VITE_THEME var  (or 'vintage')
     *   valkyriepeptides.com project → VITE_THEME = spa
     */
  },
  plugins: [
    // ...proxyPlugins,
    serveCoasPlugin(),
    react(),
    AutoImport({
      imports: [
        {
          react: [
            ["default", "React"],
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        // React i18n
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
