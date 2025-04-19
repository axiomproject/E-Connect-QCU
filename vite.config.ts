import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import mixPlugin, { type Adapter } from 'vite-plugin-mix'
import commonjs from '@rollup/plugin-commonjs';

// Fix mix plugin to work with ESM and typescript [[
interface MixConfig {
  handler: string
  adapter?: Adapter | undefined
}
type MixPlugin = (config: MixConfig) => Plugin
interface Mix {
  default: MixPlugin
}
const mix = (mixPlugin as unknown as Mix).default
// ]]

export default defineConfig({
  resolve: {
    alias: {
      lib: path.resolve(process.cwd(), './lib')
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/assets/main.scss";`
      }
    }
  },

  plugins: [vue(), ]
  
})
