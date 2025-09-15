<script>
    import {reef, session} from '@humandialog/auth.svelte'
	import  {
            Page,
            activateItem,
			onErrorShowAlert,
            reloadVisibleTags,
			getNiceStringDate,
            showFloatingToolbar,
            UI,
            registerKicksObserver,
            unregisterKicksObserver,
            forceKicksChecking,
            i18n, ext
            } from '@humandialog/forms.svelte'
	import { afterUpdate, tick, onMount } from 'svelte';
    import {location, link, querystring} from 'svelte-spa-router'

    import {FaPaste, FaArrowCircleRight, FaTimes, FaRegFile, FaRegCalendar, FaPaperPlane, FaRegStar, FaStar} from 'svelte-icons/fa/'
    import BasketPreview from './basket.preview.svelte'

    let channelRef = ''
    let channel = null;
    let allTags = '';
    let channelRefreshLabel = ''

    let pendingUploading = false;
    let isReadOnly = false;
    let unreadMessagesNo = 0
    let selectedMessageId = 0

    const heuristicIntevals = [5,10,20,40]
    let heuristicIntervalIdx = -1


    $: onParamsChanged($location, $querystring)

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'chat');
        if(foundIdx < 0)
            return;

        const channelId = parseInt(segments[segments.length-1])
        channelRef = `./MessageChannel/${channelId}`

        channelRefreshLabel = `MsgC_${channelId}`

        let scrollToPost = 0
        selectedMessageId = 0
        const params = new URLSearchParams($querystring);
        if(params.has("res"))
        {
            selectedMessageId = parseInt(params.get("res"))
            scrollToPost = -1
        }


        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags=res
            reloadVisibleTags()
        })

       await reloadData();

       if(!scrollToPost)
       {
            if(unreadMessagesNo > 0)
            {
                const allMessagesNo = channel.Messages.length
                if(allMessagesNo >= unreadMessagesNo)
                {
                    const firstUnreadMessage = channel.Messages[allMessagesNo - unreadMessagesNo]
                    if(firstUnreadMessage)
                    {
                        scrollToPost = -1
                        selectedMessageId = firstUnreadMessage.Id
                    }

                }
            }
       }

       await scrollWhereNeeded(scrollToPost)

       if(unreadMessagesNo > 0)
            setTimeout(async () => await markRead(), 2000)
    }

    onMount(() => {
        const observerId = registerKicksObserver(channelRefreshLabel, 60, onRemoteChanged)
        return () => {
            unregisterKicksObserver(observerId)
        }
    })

    async function onRemoteChanged(labels)
    {
        //console.log('onRemoteChanged')
        let restoreSelection = isDuringEditing()
        if(restoreSelection)
            storeEditableSelection()

        await reloadData();
        await tick();   // rerender
        scrollDown();

        // doesn't work. don't know why
        if(restoreSelection)
        {
            restoreEditableSelection()
        }

        await markRead()

        startHeuristicRefreshing()
    }

    async function scrollWhereNeeded(scrollToPost)
    {
        await tick()

        if(scrollToPost == 0)
            scrollDown()
        else if(scrollToPost < 0)
        {
            const indicator = document.getElementById(`__hd_unread_indicator`)
            if(indicator)
                indicator?.scrollIntoView(true)
        }
        else
        {
            const answer = document.getElementById(`__hd_channel_msg_${scrollToPost}`)
            if(answer)
                answer?.scrollIntoView(true)
        }

    }

    async function reloadData()
    {
        if(!channelRef)
            return;

        let res = await reef.post(`${channelRef}/query`,
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 3,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:[   'Id',
                                                    'Title',
                                                    'GetTitle',
                                                    'Summary',
                                                    'Status',
                                                    'Order',
                                                    'IsSubscribed',
                                                    'GetUnreadMessagesNo',
                                                    '$ref',
                                                    '$type',
                                                    '$acc'],
                                    SubTree:[
                                        {
                                            Id: 11,
                                            Association: 'Messages',
                                            Expressions:['$ref', "Id", "Text", "Tags", "Index", "Kind", "State", "Date", "Images"],
                                            Sort: "Id,Date",
                                            //Filter: last few days?
                                            SubTree: [
                                                {
                                                    Id:111,
                                                    Association: 'Author',
                                                    Expressions:['$ref', 'Name', 'href']
                                                },
                                                {
                                                    Id:112,
                                                    Association: 'Notes',
                                                    Expressions:['$ref', 'Title', 'href']
                                                },
                                                {
                                                    Id:113,
                                                    Association: 'Tasks',
                                                    Expressions:['$ref', 'Title', 'href']
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        onErrorShowAlert)

        channel = res.MessageChannel

        if(channel.GetTitle)
            channel.Title = ext(channel.GetTitle)

        unreadMessagesNo = channel.GetUnreadMessagesNo

        isReadOnly = (channel.$acc & 0x2) == 0
    }


    async function markRead()
    {
        unreadMessagesNo = 0
        await reef.post(`${channelRef}/MarkRead`, {}, onErrorShowAlert)
        if(UI.navigator)
            UI.navigator.refresh()
    }

    function getPageOperations()
    {

        let toggleSubscribe;
        if(channel.IsSubscribed > 0)
        {
            toggleSubscribe = {
                caption: '_; Unfollow; Dejar de seguir; Przestań obserwować',
                icon: FaStar,
                action: (f) => unsubscribeChannel(),
                tbr: 'C'
            }
        }
        else
        {
            toggleSubscribe = {
                caption: '_; Follow; Seguir; Obserwuj',
                icon: FaRegStar,
                action: (f) => subscribeChannel(),
                tbr: 'C'
            }
        }

        return {
            opver: 2,
            fab: 'T01',
            operations: [
                {
                    caption: '_; Channel; Canal; Kanał',
                    operations: [
                        ... channel.Status == 1 ? [toggleSubscribe] : []
                    ]
                }
            ]
        }
    }

    async function subscribeChannel()
    {
        await reef.post(`${channelRef}/Subscribe`, { }, onErrorShowAlert)
        channel.IsSubscribed = 1
        activateItem('data', channel, getPageOperations());
        //if(UI.navigator)
        //    UI.navigator.refresh()
    }

    async function unsubscribeChannel()
    {
        await reef.post(`${channelRef}/Unsubscribe`, { }, onErrorShowAlert)
        channel.IsSubscribed = 0
        activateItem('data', channel, getPageOperations());
        //if(UI.navigator)
        //    UI.navigator.refresh()
    }

    const dateTimeFormat2 = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    function printTime(dt)
    {
        return dateTimeFormat2.format(dt)
    }

    let newMessage = {
        text: ''
    }
    let newMessageElement;
    let newMessageContent = ''


    function scrollDown()
    {
        newMessageElement?.scrollIntoView(
                {
                    block: "end"
                });

    }

    let messageElements = [];
    async function onSubmit(messageText)
    {
        const res = await reef.post(`${channelRef}/AddMessage`, {
            text: messageText,
            attachements: newMessageAttachements
        }, onErrorShowAlert)

        if(res)
        {
            await reloadData();
            await tick();   // rerender
            scrollDown();
            editableElement?.focus()

            startHeuristicRefreshing();
        }
    }

    function onKeyDown(e)
    {
        if(e && e.key == 'Enter' && (!e.ctrlKey) && (!e.shiftKey))
        {
            if(newMessageContent)
            {
                onSubmit(newMessageContent)
                newMessageContent = ''
                newMessageAttachements = []
            }
            e.stopPropagation()
            e.preventDefault()
        }
    }

    let editableElement;
    async function onPaste(e)
    {
        e.preventDefault();
        
        const sel = window.getSelection()
        //const selNo = sel?.focusOffset
        //const selNode = sel?.focusNode

        //console.log('sel', selNo, selNode)
        
        const txt = e.clipboardData.getData('text/plain')
        
        //const left = newMessageContent.substring(0, selNo)
        //const right = newMessageContent.substring(selNo+1)
        //newMessageContent = left + txt + right
        newMessageContent = txt
        
        await tick()

        sel?.setPosition(editableElement.childNodes[0], txt.length)
    }

    function onSubmitClick(e)
    {
        if(newMessageContent)
        {
            onSubmit(newMessageContent)
            newMessageContent = ''
            newMessageAttachements = []
        }
    }

    function byteLengthUTF8(str)
    {
        let s = str.length;
        for (let i=str.length-1; i>=0; i--)
        {
            const code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) s++;
            else if (code > 0x7ff && code <= 0xffff) s+=2;
            if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
        }
        return s;
    }

    function additionalBytesSize(str)
    {
        let no = 0;
        for (let i=str.length-1; i>=0; i--)
        {
            const code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) no++;
            else if (code > 0x7ff && code <= 0xffff) no+=2;
            if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
        }
        return no;
    }

    function showBasket(e)
    {
        let owner = e.target;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        const margin = 15;
        rect.x -= margin;
        rect.y -= margin;
        rect.width += 2*margin;
        rect.height += 2*margin;

        showFloatingToolbar(rect, BasketPreview, {
                        onAttach: onAttachBasket,
                        onAttachAndClear: onAttachAndClearBasket

                    });
    }

    // tmp
    let newMessageAttachements = []
    /*{
        "Type": "Folder",
        "Id": 42
    },
    {
        "Type": "Note",
        "Id": 29
    },
    {
        "Type": "Task",
        "Id": 56
    }
]*/
    async function onAttachBasket(basketItem)
    {
        if(!basketItem)
            return;

       const res = await reef.post(`${basketItem.$ref}/GetBasketContents`, {}, onErrorShowAlert)
       if(res)
       {
            newMessageAttachements = [...res]
       }
    }

    async function onAttachAndClearBasket(basketItem)
    {
        if(!basketItem)
            return;

       const res = await reef.post(`${basketItem.$ref}/GetBasketContentsAndClear`, {}, onErrorShowAlert)
       if(res)
       {
            newMessageAttachements = [...res]
       }
    }

    function clearAttachements(e)
    {
        newMessageAttachements = []
    }


    function isDuringEditing()
    {
        if(document.activeElement == editableElement)
            return true;
        else
            return false;
    }

    let fNode;
    let aNode;
    let fOffset;
    let aOffset;
    function storeEditableSelection()
    {
        const sel = window.getSelection()
        fNode = sel?.focusNode
        fOffset = sel?.focusOffset
        aNode = sel?.anchorNode
        aOffset = sel?.anchorOffset
    }

    function restoreEditableSelection()
    {
        if(!fNode)
            return;

        editableElement.focus()
        const sel = window.getSelection()
        let range = document.createRange();
        range.setStart(aNode, aOffset)
        range.setEnd(fNode, fOffset)
        sel?.removeAllRanges()
        sel?.addRange(range)

        fNode = null
        aNode = null
    }

    let heuristicTimerId = 0
    function startHeuristicRefreshing()
    {
        heuristicIntervalIdx = 0;

        if(heuristicTimerId > 0)
            clearTimeout(heuristicTimerId)

        heuristicTimerId = setTimeout(onHeuristicRefresh, heuristicIntevals[heuristicIntervalIdx]*1000)
    }

    function onHeuristicRefresh()
    {
        forceKicksChecking()

        heuristicIntervalIdx++;
        if(heuristicIntervalIdx >= heuristicIntevals.length)
        {
            heuristicIntervalIdx = -1
            heuristicTimerId = 0
        }
        else
            heuristicTimerId = setTimeout(onHeuristicRefresh, heuristicIntevals[heuristicIntervalIdx]*1000)
    }

</script>

<svelte:head>
    {#if channel && channel.Title}
        <title>{channel.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if channel}
{#key channel}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={channel}
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={channel.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl ">
            <!--section class="w-full flex flex-row justify-between">
                    <p class="">
                        {channel.Index}
                    </p>
                    <div>
                        {#if creationDate}
                            <p>
                                {getNiceStringDate(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section-->

            <h1>
                {channel.Title}
            </h1>

            {#if channel.Summary}
                <p  class="lead">
                    {channel.Summary}
                </p>
           {/if}

            {#if channel.Messages && channel.Messages.length > 0}
                {#each channel.Messages as message, idx}
                    {@const dt = new Date(message.Date)}
                    {@const notesNo = message.Notes ? message.Notes.length : 0}
                    {@const tasksNo = message.Tasks ? message.Tasks.length : 0}
                    {@const messageElementId = `__hd_channel_msg_${message.Id}`}
                        {#if message.Id == selectedMessageId}
                            <p  id="__hd_unread_indicator"
                                class="  separator
                                        before:border before:dark:border-red-800 before:border-red-200
                                        after:border after:dark:border-red-800 after:border-red-200
                                        text-red-400 dark:text-red-600">
                                        _; Unread messages; Mensajes no leídos; Nieprzeczytane wiadomości
                            </p>
                        {/if}
                        <!--    border-bottom: 1px solid #000; -->
                        <h4 id={messageElementId}>
                            <a href={message.Author.href} use:link>
                                {message.Author.Name}
                            </a>
                            <span class="ml-2 text-xs font-normal opacity-70">
                                {printTime(dt)},   {getNiceStringDate(dt)}
                            </span>
                        </h4>

                        <p class="break-words">
                            {@html message.Text}
                            {#if notesNo>0 || tasksNo>0}
                            <br>
                            <span class="text-xs whitespace-normal">


                                        {#if notesNo>0}
                                            {#each message.Notes as att}
                                                <a      class="mr-2 font-normal whitespace-nowrap"
                                                        href={att.href}
                                                        use:link
                                                        >
                                                    <span class="inline-block w-3 h-3">
                                                        <FaRegFile/>
                                                    </span>
                                                    {att.Title}
                                                </a>
                                            {/each}
                                        {/if}

                                        {#if tasksNo > 0}
                                            {#each message.Tasks as att}
                                                <a      class="mr-2  font-normal whitespace-nowrap"
                                                        href={att.href}
                                                        use:link
                                                        >
                                                    <span class="inline-block w-3 h-3">
                                                        <FaRegCalendar/>
                                                    </span>
                                                    {att.Title}
                                                </a>
                                            {/each}
                                        {/if}



                            </span>

                            {/if}
                        </p>

                    <!---/section-->
                {/each}
            {:else}
                <p class="">_; No messages here; No hay mensajes aquí; Brak wiadomości</p>
            {/if}
            <!--p class="h-20"></p-->


            <section class="not-prose
                            mt-4
                            min-h-20 w-full
                            border border-stone-300 dark:border-stone-600 rounded-lg p-2
                            bg-stone-50 dark:bg-stone-800"
                            bind:this={newMessageElement}>

                <p   class="w-full min-h-40 bg-stone-50 dark:bg-stone-800 outline-none
                            overflow-x-clip text-wrap break-words"
                            bind:innerHTML={newMessageContent}
                            contenteditable="true"
                            bind:this={editableElement}

                            placeholder="Type new message"
                            on:keydown={onKeyDown}
                            on:paste={onPaste}>
                    </p> <!--maxlength={196-additionalBytesSize(newMessageContent)} -->




                {#if newMessageAttachements.length > 0}
                    <section class="flex flex-row gap-2 flex-wrap mb-2">
                        {#each newMessageAttachements as att}
                            <p class="px-2  text-nowrap
                                        border rounded border-stone-300 dark:border-stone-600
                                        text-xs">
                                {#if att.Title}
                                    {att.Title}
                                {:else}
                                    {att.Type}/{att.Id}
                                {/if}
                            </p>
                        {/each}
                        <button class="w-3 h-3 mt-0.5" on:click={clearAttachements}>
                            <FaTimes/>
                        </button>
                    </section>
                {/if}


                <div class="w-full flex flex-row gap-2">
                    <button type="button"
                            class="
                            py-2.5 px-4
                            text-sm font-thin text-stone-700 dark:text-stone-300 dark:hover:text-white
                            hover:bg-stone-200 dark:hover:bg-stone-900 active:bg-stone-200 dark:active:bg-stone-600
                            focus:outline-none dark:border-stone-600
                            flex items-center rounded"
                            on:click={showBasket}>
                        <div class="w-5 h-5 mr-1"><FaPaste/></div>
                        <span class="ml-2">_; Paste...; Pegar...; Wklej...</span>
                    </button>

                    <p class="flex-none ml-auto py-2.5 mr-1 text-xs m-0">
                        {byteLengthUTF8(newMessageContent)}/196
                    </p>

                    <button type="button"
                            class="
                            py-2.5 px-4
                            text-sm font-thin text-stone-700 dark:text-stone-300 dark:hover:text-white
                            hover:bg-stone-200 dark:hover:bg-stone-900 active:bg-stone-200 dark:active:bg-stone-600
                            focus:outline-none dark:border-stone-600
                            flex items-center rounded"
                            on:click={onSubmitClick}>
                        <div class="w-5 h-5 mr-1"><FaPaperPlane/></div>
                        <span class="ml-2">_; Send; Enviar; Wyślij</span>

                    </button>

                </div>



            </section>

        </article>



    </section>



    <!--input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/--> <!-- capture="environment" -->
</Page>
{/key}
{/if}




<style>
    .separator {
        display: flex;
        align-items: center;
        text-align: center;
    }

    .separator::before,
    .separator::after {
        content: '';
        flex: 1;

    }

    .separator:not(:empty)::before {
        margin-right: 1rem;
    }

    .separator:not(:empty)::after {
        margin-left: 1rem;
    }
</style>