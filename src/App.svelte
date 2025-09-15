<script>
    import {reef,  AuthorizedView} from '@humandialog/auth.svelte'
	
    import Router from 'svelte-spa-router'
    import {wrap} from 'svelte-spa-router/wrap'
    
    import Cookies from './cookies.svelte';
    import Main from './main.svelte'
    import NotFound from './landing/not.found.svelte'
    import AppView from './AppView.svelte';
	import {appUsers} from './users.js'
    import {dark_mode_store,  setLanguages} from '@humandialog/forms.svelte'

    import { GoogleAnalytics } from '@beyonk/svelte-google-analytics'
    import {cookies_allow_analytics} from './landing/cookie.preferences'
    
    
	const mode = __APP_MODE__
    const objectreef_io = __OBJECTREEF_IO__
    const appId = __APP_ID__
    const tenantId = __TENANT_ID__
    const proto = __SERVICE_PROTOCOL__
    const clientID = __CLIENT_ID__
    const clientSecret = __CLIENT_SECRET__
    const website = __WEBSITE__
    const octopus_modules = __OCTOPUS_MODULES__
    const privacy = __PRIVACY_PAGE__
    const terms = __TERMS_PAGE__

   reef.configure( {
                    mode: mode,
                    remote: {
                        iss: `${proto}://${objectreef_io}`,
                        clientID: clientID,
                        clientSecret: clientSecret,
                        scope: `openid profile email ${appId}`,
                        apiVersion: 'v001',
                        tenant: `${tenantId}`,
                        groupsOnly: true,
                        termsAndConditionsHRef: `${website}/#/${terms}`,
                        privacyPolicyHRef: `${website}/#/${privacy}`
                    },
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        //api:    "http://192.168.0.103:1996/",
                        users: appUsers,
                        apiVersion: "v001"}
                   });

    let google_analytics;
    const google_analytics_identifier = __GA_IDENTIFIER__
    let enable_google_analytics = false;

    $:{
        let prev_enable_google_analytics = enable_google_analytics;

        if($cookies_allow_analytics === 'true')
            enable_google_analytics = true;
        else
            enable_google_analytics = false;

        if(!prev_enable_google_analytics && prev_enable_google_analytics != enable_google_analytics && google_analytics)
            google_analytics.init();
    }

    const r = /^\/listboard|tdownload|tcontact|tasklist|task|note|folder|mytasks|alllists|myfolders|group-folders|general-channels|private-channels|members|chat|thread|newthread|forum|thome|profile|doc|request-license-file|nav\/(.*)\/?$/i

    const routes = new Map()
    routes.set('/',                     Main)
    routes.set('/contact',              wrap({ asyncComponent: () => import('./landing/contact.svelte')}))
    routes.set('/privacy-policy',       wrap({ asyncComponent: () => import('./landing/privacy.policy.svelte')})) 
    routes.set('/terms-and-conditions', wrap({ asyncComponent: () => import('./landing/terms.and.conditions.svelte')}))
    routes.set('/doc/*',                wrap({ asyncComponent: () => import('./tilos/static.doc.svelte')}))
    routes.set('/blog',                 wrap({ asyncComponent: () => import('./landing/blog/blog.svelte')}))
    routes.set('/blog/*',               wrap({ asyncComponent: () => import('./landing/blog/article.svelte')}))
    routes.set(r, AppView)
    routes.set('*', NotFound)

    setLanguages([
        {
            key: "en",
            name: 'English',
            flag: '/landing/lang/GB_64.png',
            default: true
        },
        {
            key: 'es',
            name: "Español",
            flag: '/landing/lang/ES_64.png'
        },
        {
            key: 'pl',
            name: 'Polski',
            flag: '/landing/lang/PL_64.png'
        }
    ])

    const authTemporaryPageClass = 'bg-white dark:bg-stone-900 dark:text-white sm:overflow-y-clip absolute top-0 left-0 w-screen h-screen'
    const authButtonClass = `py-2.5 px-4 my-1
                                text-sm
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                bg-stone-200 dark:bg-stone-700
                                hover:bg-stone-300 dark:hover:bg-stone-800
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded`
    const authNormalClass = 'ml-5 mt-5 text-sm'
    const authErrorClass = ' ml-5 mt-5 text-sm text-red-500 dark:text-red-700'

</script>

<svelte:head>
    <link rel="icon" type="image/png" href={__APP_ICON__} />
</svelte:head>

<GoogleAnalytics 
    bind:this={google_analytics}
    properties={[ google_analytics_identifier ]}
    enabled={enable_google_analytics}/>

<AuthorizedView optionalGuestMode automaticallyRefreshTokens={true}
        layoutTheme={$dark_mode_store}
        layoutClass={authTemporaryPageClass}
        buttonClass={authButtonClass}
        normalTextClass={authNormalClass}
        errorTextClass={authErrorClass}>
    <Router {routes} />
    <Cookies/>
</AuthorizedView>

