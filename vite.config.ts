import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [uni()],
    define: {
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME)
    }
  };
});