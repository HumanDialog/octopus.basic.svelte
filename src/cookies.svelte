<script lang="ts">
    import {Toggle} from 'flowbite-svelte';
    import {cookies_saved_at, cookies_valid_until, cookies_allow_essential, cookies_allow_preferences, cookies_allow_analytics, cookies_allow_marketing} from './landing/cookie.preferences'
    import {link} from 'svelte-spa-router'

    let show: boolean = false;
    
    let essential :boolean = true;
    let preferences :boolean = false;
    let analytics :boolean = false;
    let marketing :boolean = false;

    let customize :boolean = false;

    const privacy = __PRIVACY_PAGE__
    const terms = __TERMS_PAGE__

    $: init($cookies_valid_until);

    function init(...args)
    {
        let now = new Date(Date.now());
        let valid_until = new Date($cookies_valid_until);

        if(valid_until && valid_until > now)
            show = false;
        else
        {
            show = true;
            essential = $cookies_allow_essential === 'true';
            preferences = $cookies_allow_preferences === 'true';
            analytics = $cookies_allow_analytics === 'true';
            marketing = $cookies_allow_marketing === 'true';
        }
    }

    function save_preferences()
    {
        $cookies_allow_essential = essential.toString();
        $cookies_allow_preferences = preferences.toString();
        $cookies_allow_analytics = analytics.toString();
        $cookies_allow_marketing = marketing.toString();
        
        $cookies_saved_at = new Date(Date.now());
        
        $cookies_valid_until = new Date($cookies_saved_at);
        $cookies_valid_until.setMonth($cookies_valid_until.getMonth() + 12)
        $cookies_valid_until = $cookies_valid_until;
        
        show = false;
    }

    function on_customize()
    {
        customize = !customize;
    }

    function on_deny()
    {
        customize = false;
        preferences = false;
        analytics = false;
        marketing = false;
        save_preferences();
    }

    function on_allow_all()
    {
        customize = false;
        preferences = true;
        analytics = true;
        marketing = true;
        save_preferences();
    }

    function on_save()
    {
        customize = false;
        save_preferences();
    }

    

</script>

{#if show}
<div class="hidden text-white text-center items-center py-2 px-4 mx-auto sm:flex flex-col bottom-1 fixed
            w-full sm:left-2 sm:w-[calc(100vw-2rem)]
            bg-stone-800
            shadow shadow-lg shadow-stone-200 dark:shadow-black
            border border-stone-200 rounded-lg dark:border-stone-700
            z-30 m-1">
    <div class="flex flex-row h-10 ">
        <div class="">
            <p class="text-xs my-1 mx-4 text-ellipsis"><span class="font-semibold">This website uses cookies </span>for user session maintenance, analytics and remarketing. Read our 
                <a href={privacy} use:link class="whitespace-nowrap underline">Privacy Policy</a> 
                to learn more.</p>
        </div>
        <div class="ml-auto text-right shrink-0 mx-4">
            <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-zinc-100  hover:bg-zinc-300 dark:bg-zinc-700 hover:dark:bg-zinc-600 rounded-md text-slate-900 dark:text-slate-100" on:click={on_deny}>Deny</button>
            <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-zinc-100 hover:bg-zinc-300 dark:bg-zinc-700 hover:dark:bg-zinc-600 rounded-md text-slate-900 dark:text-slate-100" on:click={on_customize}>Customize</button>
            <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-blue-700 hover:bg-indigo-400 dark:bg-indigo-500 hover:dark:bg-indigo-400 rounded-md text-slate-100 mr-2" on:click={on_allow_all}>Allow all</button>
        </div>
    </div>
    {#if customize}
    <section>
        <p class="text-xs m-1 text-ellipsis">Select which types of cookies you agree to:</p>
        <div class="flex flex-row ">
            <Toggle bind:checked={essential} disabled size="small" class="ml-2 mr-4" color="zinc"><span class="mr-4 text-zinc-500">Essential</span></Toggle>
            <Toggle bind:checked={preferences} size="small" color="zinc"><span class="mr-4 text-zinc-100">Preferences</span></Toggle>
            <Toggle bind:checked={analytics} size="small" color="zinc"><span class="mr-4 text-zinc-100">Analytics</span></Toggle>
            <Toggle bind:checked={marketing} size="small" color="zinc"><span class="mr-4 text-zinc-100">Marketing</span></Toggle>
            <div class="ml-auto text-right shrink-0">
                <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-blue-700 hover:bg-blue-900 dark:bg-indigo-600 hover:dark:bg-indigo-400 rounded-md text-slate-100 mr-2" on:click={on_save}>Save</button>
            </div>
        </div>
    </section>
    {/if}
</div>
<div class="flex flex-col sm:hidden  text-white text-center items-center py-2 px-4 mx-auto bottom-0 fixed 
        left-2 w-[calc(100vw-1rem)] 
        bg-stone-800 
        shadow shadow-lg shadow-stone-200 dark:shadow-black
        border border-stone-200 rounded-lg dark:border-stone-700
        z-30 m-1">
<!--div class="flex flex-col sm:hidden bottom-0 fixed h-30 w-full bg-slate-900 dark:bg-slate-200 text-zinc-100 dark:text-zinc-900 z-30 m-1"-->
    <div>
        <p class="text-xs m-1 text-ellipsis"><span class="font-semibold">This website uses cookies </span>for user session maintenance, analytics and remarketing. Read our 
            <a href={privacy} use:link class="whitespace-nowrap underline">Privacy Policy</a> 
        to learn more.</p>
    </div>
    <div class="flex flex-row justify-around">
        <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-zinc-100  hover:bg-zinc-300 dark:bg-zinc-700 hover:dark:bg-zinc-600 rounded-md text-slate-900 dark:text-slate-100" on:click={on_deny}>Deny</button>
        <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-zinc-100 hover:bg-zinc-300  dark:bg-zinc-700 hover:dark:bg-zinc-600 rounded-md text-slate-900 dark:text-slate-100" on:click={on_customize}>Customize</button>
        <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-blue-700 hover:bg-indigo-400 dark:bg-indigo-500 hover:dark:bg-indigo-400 rounded-md text-slate-100 mr-2" on:click={on_allow_all}>Allow all</button>
    </div>
    {#if customize}
    <section>
        <p class="text-xs m-1 mt-5 text-ellipsis">Select which types of cookies you agree to:</p>
        <div class="">
            <Toggle bind:checked={essential} disabled size="small" class="m-2" color="zinc"><span class="text-zinc-500">Essential</span></Toggle>
            <Toggle bind:checked={preferences}  size="small" class="m-2" color="zinc"><span class="text-zinc-100">Preferences</span></Toggle>
            <Toggle bind:checked={analytics} size="small" class="m-2" color="zinc"><span class="text-zinc-100">Analytics</span></Toggle>
            <Toggle bind:checked={marketing} size="small" class="m-2" color="zinc"><span class=" text-zinc-100">Marketing</span></Toggle>
            <button class="font-semibold pt-1 pb-2 mb-0 mx-1 w-20 text-sm px-1 bg-blue-700 hover:bg-blue-900 dark:bg-indigo-600 hover:dark:bg-indigo-400 rounded-md text-slate-100 mr-2" on:click={on_save}>Save</button>
        </div>
    </section>
    {/if}
    
</div>
{/if}