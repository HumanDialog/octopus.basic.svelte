<script lang="ts">
    import { tick } from 'svelte';
    import Header from './header.svelte'

    async function pop()
    {
        await tick();
        window.history.back();
    }
</script>

<Header transparent light main/>
<div>
    <section class="">
        <div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32">
            <h1
                class="text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center">
                Page not found</h1>
            <p class="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto ">Oops, looks like you've reached beyond the edges of our website. </p>
            <div class="mt-6 sm:mt-10 flex justify-center space-x-6 text-sm">
                <button class="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400"
                    on:click={() => {pop()}}>Back</button></div>
        </div>

    </section>
</div>