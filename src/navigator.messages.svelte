<script>
    import {    Spinner, 
                startEditing, 
                SidebarGroup, 
                SidebarList, 
                SidebarItem, 
                reloadMainContentPage, 
                Modal,
                reloadWholeApp,
                Input, 
                onErrorShowAlert,
                randomString, UI,
                Icon,
            showMenu} from '@humandialog/forms.svelte'
    import {FaHashtag, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaRegComment, FaUsers, FaPlus} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { afterUpdate, onMount, tick } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let generalChannels = [];
    let directChannels = [];

    let navGeneralLists;
    let navGeneralItems = [];

    let navDirectLists;
    let navDirectItems = [];
    
    $: currentPath = $location;

    const navRefresher = {
        refresh: () => {
                initNavigator();
            }
    }

    onMount( () =>
    {
        initNavigator();
        UI.navigator = navRefresher
        
        return () => {
            if(UI.navigator == navRefresher)
                UI.navigator = null
        }      
    })

    
    async function initNavigator()
    {
        const generalKey = `navigatorGeneralChannels`
        const generalValue = cache.get(generalKey)
        if(generalValue)
        {
            generalChannels = generalValue;
            navGeneralLists?.reload(generalChannels)
        }

        fetchGeneralChannels().then(() => 
        {
            navGeneralLists?.reload(generalChannels)
            cache.set(generalKey, generalChannels);
        })


        const directKey = `navigatorDirectChannels`
        const directValue = cache.get(directKey)
        if(directValue)
        {
            directChannels = directValue;
            navDirectLists?.reload(directChannels)
        }

        fetchDirectChannels().then(() => 
        {
            navDirectLists?.reload(directChannels)
            cache.set(directKey, directChannels);
        })

    }

    function fetchGeneralChannels()
    {
        return reef.get("/group/MessageChannels?sort=Order&fields=$ref,Id,Title,Order,href,$type,GetUnreadMessagesNo", onErrorShowAlert).then((res) =>
        {
            if(res != null)
                generalChannels = res.MessageChannel;
            else
                generalChannels = [];
        })
    }

    function fetchDirectChannels()
    {
        return reef.get("/user/MessageChannels?sort=Order&fields=$ref,Id,Title,Order,href,$type,UnreadMessagesNo", onErrorShowAlert).then((res) =>
        {
            if(res != null)
                directChannels = res.MessageChannelUser;
            else
                directChannels = [];
        })
    }

    async function reloadGeneralChannels()
    {
        await fetchGeneralChannels();
        navGeneralLists.reload(generalChannels)
    }

    async function reloadDirectChannels()
    {
        await fetchDirectChannels();
        navDirectLists.reload(directChannels)
    }

    async function addChannel(channelName, order)
    {
        await reef.post('/group/AddGeneralMessageChannel', 
                        { 
                            title: channelName,
                            order: order
                        },
                        onErrorShowAlert);
        reloadGeneralChannels();
    }

    async function changeName(channel, title)
    {
        let res = await reef.post(`${channel.$ref}/set`, 
                                {
                                    Title: title
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(channel, summary)
    {

        let res = await reef.post(`${channel.$ref}/set`, 
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    /*async function finishAllOnList(list)
    {
        await reef.post(`/group/Lists/${list.Id}/FinishAll`, {}, onErrorShowAlert)
        
        if( isRoutingTo(`/listboard/${list.Id}`, currentPath) || 
            isRoutingTo(`/tasklist/${list.Id}`, currentPath))
        {
            reloadMainContentPage();
        }
    }

    async function finishAllMyTasks()
    {       
        await reef.post(`/user/FinishTasks`, {}, onErrorShowAlert)
        
        if(isRoutingTo('/mytasks', currentPath))
        {
            reloadMainContentPage();
        }

    }
    */

    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        if(linkPath.startsWith('#'))
            linkPath = linkPath.substring(1)

        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }

    
    
    
    let deleteModal;
    let channelToDelete;
    function askToDelete(channel)
    {
        channelToDelete = channel;
        deleteModal.show()
    }

    async function deleteChannel()
    {
        if(!channelToDelete)
            return;

        await reef.delete(`/group/MessageChannels/${channelToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();

        reloadGeneralChannels();
    }

    function getChannelOperations(domNode, dataItem, navItem)
    {
        let menuOperations = [];
        menuOperations = [
        /*    {
                caption: 'Mark all as read',
                action: (f) => markAllAsRead(dataItem)
            },
            {
                separator: true
            },
        */    {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navGeneralLists.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navGeneralLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem)
            }
        ]
        return menuOperations
    }
    
    function getDirectChannelOperations(domNode, dataItem, navItem)
    {
        let menuOperations = [];
        menuOperations = [
           /* {
                caption: 'Mark all as read',
                action: (f) => markAllAsRead(dataItem)
            },
            {
                separator: true
            },
          */  {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navDirectLists.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navDirectLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem)
            }
        ]
        return menuOperations
    }


    export function requestAdd()
    {
        navGeneralLists.add(async (channelName, order) => {
            await addChannel(channelName, order)
        })
    }

    async function addDirectChannel(toWhom)
    {
        const res = await reef.post(`user/AddDirectMesssageChannel`, {
            toWhom: toWhom
        }, onErrorShowAlert)

        await reloadDirectChannels()
    }

    async function onNewDMChannel(e)
    {
        const res = await reef.post('group/GetPossibleDirectChannelUsers', { 
            excludeExisting: true
        }, onErrorShowAlert)
        if(!res)
            return;

        let options = []
        res.forEach(e => {
            options.push({
                caption: e.Name,
                action: async (f) => {await addDirectChannel(e.ref)}
            })
        })

        if(!options.length)
            return;

        let owner = e.target;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()
        showMenu(rect, options);
    }

    
</script>

{#key currentPath}
{#if sidebar}
    {@const hasContent = (generalChannels ) || (directChannels )}
    {#if hasContent}
        
            <SidebarGroup >
            
                <SidebarList    objects={generalChannels} 
                                orderAttrib='Order'
                                inserter={addChannel} 
                                inserterPlaceholder='New channel'
                                bind:this={navGeneralLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={FaHashtag}
                                        bind:this={navGeneralItems[idx]}
                                        active={isRoutingTo(href, currentPath)}
                                        operations={(node) => getChannelOperations(node, item, navGeneralItems[idx])}
                                        selectable={item}
                                        summary={{
                                            editable: (text) => {changeSummary(item, text)},
                                            content: item.Summary}}
                                        editable={(text) => {changeName(item, text)}}>
                            <span class="relative">
                                 {#if item.GetUnreadMessagesNo}
                                    <div class="absolute 
                                            inline-flex items-center justify-center 
                                            w-5 h-5 
                                            text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-5 dark:border-gray-900">
                                        {item.GetUnreadMessagesNo}
                                    </div>
                                {/if}
                                {item.Title}
                            </span>
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList> 
            </SidebarGroup>
        

        
            <SidebarGroup border>
            
                <SidebarList    objects={directChannels} 
                                orderAttrib='Order'
                                bind:this={navDirectLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={FaRegComment}
                                        bind:this={navDirectItems[idx]}
                                        active={isRoutingTo(href, currentPath)}
                                        operations={(node) => getDirectChannelOperations(node, item, navDirectItems[idx])}
                                        selectable={item}
                                        summary={{
                                            editable: (text) => {changeSummary(item, text)},
                                            content: item.Summary}}
                                        editable={(text) => {changeName(item, text)}}
                                        >
                            <span class="relative">
                                {item.Title}
                                {#if item.UnreadMessagesNo}
                                    <div class="absolute 
                                            inline-flex items-center justify-center 
                                            w-5 h-5 
                                            text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-5 dark:border-gray-900">
                                        {item.UnreadMessagesNo}
                                    </div>
                                {/if}
                            </span>
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList> 

                <button   class=" mb-2 ml-2 mr-3 w-full
                    text-base font-normal 
                    text-stone-500 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-400
                    flex items-center" 
                    on:click={onNewDMChannel}
                    >
                    <Icon component={FaPlus} class="inline-block w-4 h-4 mt-0.5 ml-2.5 pr-0.5 mr-4"/>
                    <p>New direct channel</p>
                </button>

            </SidebarGroup>
        

    {:else}
        <Spinner delay={3000}/>
    {/if}

{:else} <!-- !sidebar -->

    {@const hasContent = (generalChannels) || (directChannels)}
    {#if hasContent}
            <SidebarGroup >
                <SidebarList    objects={generalChannels} 
                                orderAttrib='Order'
                                bind:this={navGeneralLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={FaHashtag}
                                        bind:this={navGeneralItems[idx]}
                                        operations={(node) => getChannelOperations(node, item, navGeneralItems[idx])}
                                        {item}
                                        summary={{
                                            editable: (text) => {changeSummary(item, text)},
                                            content: item.Summary}}
                                        editable={(text) => {changeName(item, text)}}>
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList> 
            </SidebarGroup>
        
            <SidebarGroup border>
                <SidebarList    objects={directChannels} 
                                orderAttrib='Order'
                                bind:this={navDirectLists}>
                    <svelte:fragment let:item let:idx>
                        {@const href = item.href}
                        <SidebarItem   {href}
                                        icon={FaRegComment}
                                        bind:this={navDirectItems[idx]}
                                        operations={(node) => getDirectChannelOperations(node, item, navGeneralItems[idx])}
                                        {item}
                                        summary={{
                                            editable: (text) => {changeSummary(item, text)},
                                            content: item.Summary}}
                                        editable={(text) => {changeName(item, text)}}>
                            {item.Title}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList> 

                <button   class=" mb-2 ml-2 mr-3 w-full
                    text-base font-normal 
                    text-stone-500 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-400
                    flex items-center" 
                    on:click={onNewDMChannel}
                    >
                    <Icon component={FaPlus} class="inline-block w-4 h-4 mt-0.5 ml-2.5 pr-0.5 mr-4"/>
                    <p>New direct channel</p>
                </button>
                
            </SidebarGroup>
        
    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}
{/key}

<Modal  title="Delete"
        content="Are you sure you want to delete selected channel?"
        icon={FaTrash}
        onOkCallback={deleteChannel}
        bind:this={deleteModal}
        />
