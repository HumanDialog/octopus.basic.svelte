<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner
    }   from '@humandialog/forms.svelte'
    import {FaRegFolder, FaRegFile, FaRegCalendarCheck, FaRegCalendar} from 'svelte-icons/fa'
	import { afterUpdate, onMount } from "svelte";
	import { push } from "svelte-spa-router";

    export let destinationContainer = ''
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined
    export let onAttach = undefined
    export let onAttachAndClear = undefined

    let basketItem;
    let basketEntriesNo = 0

    const STATE_FINISHED = 7000;

    let reloadTicket = -1
    let lastReloadTicket = 0

    $: initData()

    async function initData(...args)
    {
        if(lastReloadTicket == reloadTicket)
            return;

        lastReloadTicket = reloadTicket

        let res = await reef.post(`/user/BasketFolder/query`,
                            {
                                Id: 1,
                                Name: '',
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id', '$ref','Title','Summary', 'href'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                Sort: 'Order',
                                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'IsPinned']

                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Tasks',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'href']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
        if(res)
        {
            basketItem = res.Folder;
            basketEntriesNo = 0;

            if(basketItem.Folders && basketItem.Folders.length > 0)
                basketEntriesNo += basketItem.Folders.length;

            if(basketItem.Notes && basketItem.Notes.length > 0)
                basketEntriesNo += basketItem.Notes.length;

            if(basketItem.Tasks && basketItem.Tasks.length > 0)
                basketEntriesNo += basketItem.Tasks.length;

        }
        else
        {
            basketItem = null
            basketEntriesNo = 0
        }
    }

    let foldersElement;
    let notesElement;
    let tasksElement;
    export async function reload()
    {
        reloadTicket++;
        await initData()

        foldersElement.reload(basketItem);
        notesElement.reload(basketItem);
        tasksElement.reload(basketItem);
    }

    let rootElement;
    let prevHeight = 0
    afterUpdate( () =>
    {
        if(rootElement)
        {
            const myRect = rootElement.getBoundingClientRect()
            if(myRect.height != prevHeight)
            {
                prevHeight = myRect.height
                if(onSizeChanged)
                    onSizeChanged();
            }
        }
    })

    async function editBasket()
    {
        if(onHide)
            onHide();

        if(basketItem && basketItem.href)
            push(basketItem.href)
    }

    async function attachTo()
    {
        if(onHide)
            onHide();

        if(!destinationContainer)
        {
            if(onAttach)
                onAttach(basketItem)
        }
        else
        {
            const res = await reef.post(`${destinationContainer}/AttachBasketContent`, { }, onErrorShowAlert)
            if(res)
            {
                if(onRefreshView)
                    onRefreshView(res);
            }
        }

    }

    async function attachToAndClear()
    {
        if(onHide)
            onHide();

        if(!destinationContainer)
        {
            if(onAttachAndClear)
                onAttachAndClear(basketItem)
        }
        else
        {
            const res = await reef.post(`${destinationContainer}/AttachAndClearBasketContent`, { }, onErrorShowAlert)
            if(res)
            {
                if(onRefreshView)
                    onRefreshView(res);
            }
        }
    }

</script>

<menu class="" bind:this={rootElement}>
    {#if basketItem}
        <div class="w-full h-64 sm:h-80 sm:max-w-sm overflow-y-auto overflow-x-clip
                text-stone-600 dark:text-stone-400">

            {#if basketEntriesNo==0}
                <div class="h-full flex items-center justify-center">
                    <p>Clipboard is empty</p>
                </div>
            {/if}

            <List   self={basketItem}
                    a='Folders'
                    orderAttrib='Order'
                    bind:this={foldersElement}>
                <ListTitle a='Title'/>
                <ListSummary a='Summary'/>

                <span slot="left" let:element>
                    <Icon component={FaRegFolder}
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                </span>
            </List>

            <List   self={basketItem}
                    a='Notes'
                    orderAttrib='Order'
                    bind:this={notesElement}>
                <ListTitle a='Title'/>
                <ListSummary a='Summary'/>

                <span slot="left" let:element>
                    <Icon component={FaRegFile}
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                </span>
            </List>

            <List   self={basketItem}
                    a='Tasks'
                    orderAttrib='Order'
                    bind:this={tasksElement}>
                <ListTitle a='Title'/>
                <ListSummary a='Summary'/>

                <span slot="left" let:element>
                    {#if element.State == STATE_FINISHED}
                        <Icon component={FaRegCalendarCheck}
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>

                    {:else}
                        <Icon component={FaRegCalendar}
                            class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>

                    {/if}
                </span>
            </List>

        </div>

        <!-- Footer -->

            <div class="mt-2 flex flex-row justify-stretch gap-2">
                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!basketItem}
                                on:click={() => editBasket()}>

                    Edit
                </button>

                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!basketEntriesNo}
                                on:click={() => attachTo()}>

                    Attach
                </button>

                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!basketEntriesNo}
                                on:click={() => attachToAndClear()}>

                    Attach and clear
                </button>
            </div>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</menu>