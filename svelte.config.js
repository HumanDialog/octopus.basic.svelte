import sveltePreprocess from "svelte-preprocess";
import {i18nPreprocess} from './i18n-preprocess.js';

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    i18nPreprocess({ dryRun: false }),
    sveltePreprocess({
      postcss: true,
    }),
  ],
};
