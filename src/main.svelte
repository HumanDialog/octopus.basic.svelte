<script>
	import {session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
    import {Spinner} from '@humandialog/forms.svelte'
    import AppView from './AppView.svelte';
    
    $: update($session)
    function update(...args)
    {
        
    }

    let landingComponent = null
    switch(__LANDING__)
    {
    default:
        import('./landing/landing.svelte').then((module) => { 
                                                            landingComponent = module.default || module; 
                                                        })
        break;
    }

    

</script>

<Authorized>
    <AppView/>
</Authorized>

<NotAuthorized>
    {#if landingComponent}
        <svelte:component this={landingComponent} />
    {:else}
        <Spinner/> 
    {/if}
</NotAuthorized>


