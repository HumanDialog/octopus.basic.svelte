
<script lang="ts">
    import AppIcon from '../appicon.svelte'
    import { link } from 'svelte-spa-router';
    import {Authorized, NotAuthorized, signInHRef, signOutHRef, signUpHRef } from '@humandialog/auth.svelte'

    export let main = false;
    export let light = false;
    export let transparent = false

    const bg = setupBG()
    
    function setupBG()
    {
        if(!transparent)
        {
            if(light)
                return 'bg-slate-200'
            else
                return 'bg-slate-900'
        }
        else
            return ''
    }
    
    const brand_color = light ? 'text-slate-700' : 'text-slate-200'
    const hero_color = light ? 'text-slate-500' : 'text-slate-400'
    const text_color = light ? 'text-slate-700 hover:text-slate-900' : 'text-slate-200 hover:text-slate-500'

   
    
</script>

<nav class= "{bg} font-semibold text-xs sm:text-sm leading-6">
    <div class="max-w-screen-xl flex flex-col sm:flex-row items-center justify-between mx-auto p-4">
      <a href="/" class="" use:link aria-label="Home page">
            <div class="flex flex-row">
                <AppIcon class="block w-6 h-6 sm:w-10 sm:h-10"/>
                <span class="ml-2 sm:ml-4 sm:mt-1">
                    <span class="font-semibold text-base sm:text-2xl {brand_color}">Octopus</span>
                    <span class=" text-xs sm:text-xl font-normal {hero_color}"> | A minimalist workspace for tasks and notes </span>
                </span>
            </div>
      </a>
       <div class="px-4 w-full block sm:w-auto">
            <ul class="flex flex-row pt-3  items-center justify-between mx-auto space-x-2 sm:space-x-12 mt-0 border-0 border-gray-700">
                {#if main}
                    <NotAuthorized>
                        <li><a class="block rounded md:bg-transparent p-0 {text_color}" use:link href='/blog'>Blog</a></li>
                    </NotAuthorized>
                    <NotAuthorized>
                        <li><a class="block rounded md:bg-transparent p-0 {text_color}" href='https://github.com/HumanDialog/octopus.basic.reef'>Source code</a></li>
                    </NotAuthorized>
                    <NotAuthorized>
                        <li><a class="block rounded md:bg-transparent p-0 {text_color}" use:link href={$signUpHRef}>Get started</a></li>
                    </NotAuthorized>
                    <NotAuthorized>
                        <li><a class="block  rounded md:bg-transparent p-0 {text_color}" use:link href={$signInHRef}>Sign In</a></li>
                    </NotAuthorized>
                    
                {:else}
                    <Authorized>
                        <li><a class="block  rounded md:bg-transparent p-0 {text_color}" use:link href='/'>App</a></li>
                    </Authorized>
                {/if}
            </ul>
        </div>
    
    </div>
  </nav>
