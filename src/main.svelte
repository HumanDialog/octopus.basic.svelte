<script>
	import {    isDeviceSmallerThan, 
                Spinner, 
                Page
    } from '@humandialog/forms.svelte'
    import {push } from "svelte-spa-router";
    import Navigator from "./navigator.svelte";
    import {FaPlus} from 'svelte-icons/fa/'

    export let defaultPath = '/mytasks'

    const UNKNOWN = 0;
    const REDIRECT = 1;
    const NAVIGATOR = 2;

    let whatToShow = UNKNOWN;

    $: {
            if(isDeviceSmallerThan("sm"))
            {
                whatToShow = NAVIGATOR;
            }
            else 
            {
                whatToShow = REDIRECT;
                push(defaultPath);
            }
    }

    let navigator;
    function getPageOperations()
    {
        return [
            {
                icon: FaPlus,
                action: (f) => navigator?.requestAddList()
            }
        ]
    }

    const currentNav = {}

</script>


{#if whatToShow == NAVIGATOR}
    <Page   toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            self={currentNav} 
            title="Octopus Basic">
                
        <Navigator  sidebar={false}
                    bind:this={navigator}/>
    </Page>


{:else}
    <Spinner delay={3000}/>
{/if}

