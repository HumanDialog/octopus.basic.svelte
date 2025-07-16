<script>
    import {FaAngleUp, FaAngleDown, FaAngleDoubleUp, FaAngleDoubleDown} from 'svelte-icons/fa'
    import {KanbanColumnTop, KanbanColumnBottom} from '@humandialog/forms.svelte'
    
    export let taskStates;
    export let item;
    export let afterActionOperation = undefined;
    export let onMoveUp = undefined;
    export let onMoveDown = undefined;
    export let onReplace;

    function replaceMenu()
    {
        if(afterActionOperation)
            setTimeout(() => { afterActionOperation(item) }, 0)
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<menu class="hidden sm:flex flex-row gap-3">
    {#if onMoveUp && onMoveDown}
        <section class="flex flex-col gap-1">
            <p class="text-xs h-4 w-[100px] truncate"></p>
            <button class=" h-8 w-full
                            text-xs font-medium text-stone-900 dark:text-stone-400 dark:hover:text-white
                            bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600
                            border rounded border-stone-200 dark:border-stone-600 focus:outline-none
                            inline-flex items-center justify-center"
                            on:click={(e) => { onMoveUp(item); replaceMenu()}}>
                <div class="w-3 h-3"><FaAngleUp/></div>
            </button>

            <button class=" h-8 w-full
                            text-xs font-medium text-stone-900 dark:text-stone-400 dark:hover:text-white
                            bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600
                            border rounded border-stone-200 dark:border-stone-600 focus:outline-none
                            inline-flex items-center justify-center"
                            on:click={(e) => { onMoveDown(item); replaceMenu()}}>
                <div class="w-3 h-3"><FaAngleDown/></div>
            </button>
        </section>
    {/if}

    {#if taskStates && taskStates.length > 0}
    {#each taskStates as taskState, idx}
        <section class="flex flex-col gap-1">
            <p class="text-xs h-4 w-[100px] ml-1 truncate  text-stone-900 dark:text-stone-400">{taskState.name}</p>
            <button class=" h-8 w-full
                            text-base font-medium text-stone-900 dark:text-stone-400 dark:hover:text-white
                            bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600
                            border rounded border-stone-200 dark:border-stone-600 focus:outline-none
                            inline-flex items-center justify-center"
                            on:click={(e) => { onReplace(item, idx, KanbanColumnTop); replaceMenu()}}>
                <div class="w-3 h-3"><FaAngleDoubleUp/></div>
            </button>

            <button class=" h-8 w-full
                            text-base font-medium text-stone-900 dark:text-stone-400 dark:hover:text-white
                            bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600
                            border rounded border-stone-200 dark:border-stone-600 focus:outline-none
                            inline-flex items-center justify-center"
                            on:click={(e) => { onReplace(item, idx, KanbanColumnBottom); replaceMenu()}}>
                <div class="w-3 h-3"><FaAngleDoubleDown/></div>
            </button>
        </section>
    {/each}
    {/if}
</menu>

<menu class="flex sm:hidden flex-col gap-3">
    {#if onMoveUp && onMoveDown}
        <section class="flex flex-row">
            <p class="text-base truncate "></p>
            <div class="flex flex-row ml-auto gap-3">
                <button class=" bg-transparent
                                w-[55px] h-[55px] 
                                m-0
                                flex items-center justify-center
                                disable-dbl-tap-zoom"
                                on:click={(e) => { onMoveUp(item); replaceMenu()}}>
                    <div class="    w-10 h-10
                                    text-white bg-zinc-500 hover:bg-zinc-500 
                                    font-medium rounded-full text-sm text-center shadow-md
                                    dark:bg-zinc-500 dark:hover:bg-zinc-500
                                    flex items-center justify-center">
                        <div class="w-5 h-5">
                            <FaAngleUp/>
                        </div>
                    </div>
                </button>

                <button class=" bg-transparent
                                w-[55px] h-[55px] 
                                m-0
                                flex items-center justify-center
                                disable-dbl-tap-zoom"
                                on:click={(e) => { onMoveDown(item); replaceMenu()}}>
                    <div class="    w-10 h-10
                                    text-white bg-zinc-500 hover:bg-zinc-500 
                                    font-medium rounded-full text-sm text-center shadow-md
                                    dark:bg-zinc-500 dark:hover:bg-zinc-500
                                    flex items-center justify-center">
                        <div class="w-5 h-5">
                            <FaAngleDown/>
                        </div>
                    </div>
                </button>
            </div>
        </section>
    {/if}

    {#if taskStates && taskStates.length > 0}
    {#each taskStates as taskState, idx}
        <section class="flex flex-row">
            <p class="text-base mt-4 truncate w-[120px]  text-stone-900 dark:text-stone-400">{taskState.name}</p>
            <div class="flex flex-row ml-auto mr-10 gap-3">
                <button class=" bg-transparent
                                w-[55px] h-[55px] 
                                m-0
                                flex items-center justify-center
                                disable-dbl-tap-zoom"
                                on:click={(e) => { onReplace(item, idx, KanbanColumnTop); replaceMenu()}}>
                    <div class="    w-10 h-10
                                    text-white bg-zinc-500 hover:bg-zinc-500 
                                    font-medium rounded-full text-sm text-center shadow-md
                                    dark:bg-zinc-500 dark:hover:bg-zinc-500
                                    flex items-center justify-center">
                        <div class="w-5 h-5">
                            <FaAngleDoubleUp/>
                        </div>
                    </div>
                </button>

                <button class=" bg-transparent
                                w-[55px] h-[55px] 
                                m-0
                                flex items-center justify-center
                                disable-dbl-tap-zoom"
                                on:click={(e) => { onReplace(item, idx, KanbanColumnBottom); replaceMenu()}}>
                    <div class="    w-10 h-10
                                    text-white bg-zinc-500 hover:bg-zinc-500 
                                    font-medium rounded-full text-sm text-center shadow-md
                                    dark:bg-zinc-500 dark:hover:bg-zinc-500
                                    flex items-center justify-center">
                        <div class="w-5 h-5">
                            <FaAngleDoubleDown/>
                        </div>
                    </div>
                </button>
            </div>
        </section>
    {/each}
    {/if}
</menu>
