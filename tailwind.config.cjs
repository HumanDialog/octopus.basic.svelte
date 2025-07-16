const disabledCss = {
	'code::before': false,
	'code::after': false,
}

const round = (num) =>
  num
    .toFixed(7)
    .replace(/(\.[0-9]+?)0+$/, '$1')
    .replace(/\.0$/, '')
const rem = (px) => `${round(px / 16)}rem`
const em = (px, base) => `${round(px / base)}em`


const config = {
  content: [  "./src/**/*.{html,js,svelte,ts}", 
              './node_modules/@humandialog/auth.svelte/**/*.{html,js,svelte,ts}',
              './node_modules/@humandialog/forms.svelte/**/*.{html,js,svelte,ts}'],

  

  plugins: [
    require('@tailwindcss/typography'),  
  ],
  darkMode: 'class',
};

module.exports = config;



