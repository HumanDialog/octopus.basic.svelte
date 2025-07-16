import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig( ({command, mode}) => {

  let finalApp = "octopus" 
	let buildConfig = {}

  let prod = mode == 'production' ? true : false

	switch(finalApp)
	{
	case 'octopus':
		buildConfig = {
			__APP_MODE__:               prod ? '\'remote\''             : '\'local\'',
			__OBJECTREEF_IO__:          prod ? '\'objectreef.io\''      : '\'localhost:1996\'',
			__APP_ID__:                 prod ? '\'octopus_mfrjeljs\''   : '\'octopus\'',
			__TENANT_ID__:              prod ? '\'octopusbasi_kyka\''   : '\'octopus\'',
			__SERVICE_PROTOCOL__:       prod ? '\'https\''              : '\'http\'',
			__CLIENT_ID__:              prod ? '\'octopusobje_gymz\''   :'\'SampleClientId\'',
			__CLIENT_SECRET__:          prod ?  '\'vQX4b3e7wJXUgPdoe18ivP8DDu92U0I3\'' : '\'SampleClientSecret\'',
			__WEBSITE__:                prod ? '\'https://octopus.objectreef.dev\'' : '\'http://localhost:5174\'',
			__GA_IDENTIFIER__:          prod ? '\'G-KXK4NMF608\''       :  '\'\'',
			
			__OCTOPUS_MODULES__:'\'tasklists,folders,messages\'',
			__APP_TITLE__: '\'Octopus Basic\'',
			__APP_ICON__:'\'/ico/objectreeficon.png\'',
			__APP_DEFAULT_PAGE__: '\'/mytasks\'',
			__APP_DEFAULT_GUEST_PAGE__: '\'/listboard\'',
			__USERS_SET__: '\'octopus\'',
			__LANDING__: '\'octopus\'',
			__PRIVACY_PAGE__: '\'/privacy-policy\'',
			__TERMS_PAGE__:'\'/terms-and-conditions\''
		}
		break;
  	}

  return {
    plugins: [svelte()],
    define: buildConfig
  }
  
})
