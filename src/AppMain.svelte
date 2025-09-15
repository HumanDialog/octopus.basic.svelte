<script>
	import {    isDeviceSmallerThan, 
                Spinner, 
                Page,
                navKey, 
                navGetMode, NAV_MODE_SIDEBAR,
                i18n
    } from '@humandialog/forms.svelte'
    import {push, location } from "svelte-spa-router";
    import Navigator from "./navigator.svelte";
    import NavigatorFolders from "./navigator.group.folders.svelte";
    import NavigatorMessages from './navigator.messages.svelte'
    
    import {FaPlus} from 'svelte-icons/fa/'
    import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import Landing from './landing/landing.svelte'
    import {onMount} from 'svelte'
	

    export let defaultPath = ''

    const UNKNOWN = 0;
    const REDIRECT = 1;
    const NAVIGATOR = 2;

    let whatToShow = UNKNOWN;

    let navComponent;
    let navOperations = []

    $: update($navKey, $session)
        
    function update(...args)
    {
        if($session.isActive || $session.isUnauthorizedGuest)
        {
            const navMode = navGetMode()
            if(navMode == NAV_MODE_SIDEBAR)
            {
                whatToShow = REDIRECT;

                if($session.isUnauthorizedGuest)
                    push(__APP_DEFAULT_GUEST_PAGE__);
                else
                    push(__APP_DEFAULT_PAGE__);
            }
            else
            {
                whatToShow = NAVIGATOR
                navComponent = getNavigator($navKey)
                navOperations = getOperations($navKey)
            }
        }
        else
            whatToShow = UNKNOWN;
    }


    let navigator;
    const addOperation = {
        opver: 1,
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        icon: FaPlus,
                        action: (f) => navigator?.requestAdd(),
                        fab: 'M00'
                    }
                ]
            }
        ]
    }
    

    function getNavigator(name)
    {
        switch(name)
        {
        case 'Folders':
            return NavigatorFolders;

        case 'Messages':
            return NavigatorMessages;

        default:
            return Navigator;
        }
    }

    function getOperations(name)
    {
        switch(name)
        {
        case 'Folders':
            return [];

        case 'Messages':
            return [];

        
        default:
            return [];
        }
    }

    const currentNav = {}

</script>

<Authorized>
    {#if whatToShow == NAVIGATOR}
        <!-- {#key $main_sidebar_visible_store} -->
            <Page   toolbarOperations={ navOperations }
                    clearsContext='props sel'
                    self={currentNav} 
                    title={__APP_TITLE__}>

                <svelte:component this={navComponent} sidebar={false} bind:this={navigator} />
            </Page>
        <!-- {/key} -->


    {:else}
        <Spinner delay={3000}/>
    {/if}
</Authorized>



