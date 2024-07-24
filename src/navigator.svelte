<script>
    import {    Spinner, 
                startEditing, 
                SidebarGroup, 
                SidebarList, 
                SidebarItem, 
                reloadMainContentPage, 
                Modal} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive} from 'svelte-icons/fa'
    import {location} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount } from 'svelte';

    export let sidebar = true;

    let taskLists = [];
    let user = {};
    let navLists;
    let navItems = [];

    $: currentPath = $location;

    onMount( async () =>
    {
        await initNavigator();
        return () => {}        
    })

    async function initNavigator()
    {
        if(!$session.isActive)
            return;
        
        let res = await reef.get("/user");
        if(res != null)
            user = res.User;


        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.get("/app/Lists?sort=Order&fields=Id,Name,Order,$type");
        if(res != null)
            taskLists = res.TaskList;
        else
            taskLists = [];
    }

    async function reload()
    {
        await fetchData();
        navLists.reload(taskLists)
    }

    async function addList(listName, order)
    {
        await reef.post("/app/Lists/new", 
                            { 
                                Name: listName,
                                Order: order
                            });
        reload();
    }

    async function changeName(list, name)
    {
        let res = await reef.post(`/app/Lists/${list.Id}/set`, 
                                {
                                    Name: name
                                });
        return (res != null);
    }

    async function changeSummary(list, summary)
    {

        let res = await reef.post(`/app/Lists/${list.Id}/set`, 
                                {
                                    Summary: summary
                                });
        return (res != null);
    }

    async function finishAllOnList(list)
    {
        await reef.post(`/app/Lists/${list.Id}/FinishAll`, {})
        
        if( isRoutingTo(`#/listboard/${list.Id}`, currentPath) || 
            isRoutingTo(`#/tasklist/${list.Id}`, currentPath))
        {
            reloadMainContentPage();
        }
    }

    async function finishAllMyTasks()
    {       
        await reef.post(`/user/FinishTasks`, {})
        
        if(isRoutingTo('#/mytasks', currentPath))
        {
            reloadMainContentPage();
        }

    }

    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        linkPath.startsWith('#')
            linkPath = linkPath.substring(1)

        

        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }

    
    function getUserListOperations(domNode, dataItem)
    {
        let menuOperations = [];
        if(dataItem == user)
            menuOperations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllMyTasks()
            });

        return menuOperations;
    }

    
    let deleteModal;
    let listToDelete;
    function askToDelete(list)
    {
        listToDelete = list;
        deleteModal.show()
    }

    let archiveModal;
    let listToArchive;
    function askToArchive(list)
    {
        listToArchive = list;
        archiveModal.show();
    }

    async function archiveList()
    {
        if(!listToArchive)
            return;

        await reef.post(`/app/Lists/${listToArchive.Id}/Archive`, {})
        archiveModal.hide();

        reload();
    }

    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/app/Lists/${listToDelete.Id}`)
        deleteModal.hide();

        reload();
    }

    function getTaskListOperations(domNode, dataItem, navItem)
    {
        let menuOperations = [];
        menuOperations = [
            {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },
            {
                caption: 'Finish all',
                action: (f) => finishAllOnList(dataItem)
            },
            {
                caption: 'Move on top',
                action: (f) => navLists.moveTop(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navLists.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Archive',
                action: (f) => askToArchive(dataItem)
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem)
            }
        ]
        return menuOperations
    }

    let archivedLists = []
    let navArchivedLists;
    async function onExpandArchived()
    {
        let res = await reef.get("/app/ArchivedLists?sort=-Id&fields=Id,Name,$type");
        if(res != null)
        {
            archivedLists = res.TaskList;
            navArchivedLists.reload(archivedLists)

        }
        else
            archivedLists = [];
    }

    export function requestAddList()
    {
        navLists.add(async (listName, order) => {
            await reef.post("/app/Lists/new", 
                            { 
                                Name: listName,
                                Order: order
                            });
            reload();
        })
    }

</script>

{#if sidebar}
    {#if taskLists && taskLists.length > 0}
        <SidebarGroup>
            <SidebarItem   href="#/mytasks"
                            icon={FaList}
                            active={isRoutingTo("#/mytasks", currentPath)}
                            operations={(node) => getUserListOperations(node, user)}
                            summary="All active tasks assigned to me."
                            selectable={user}>
                My Tasks
            </SidebarItem>
        </SidebarGroup>

        <SidebarGroup border>
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            inserter={addList} 
                            inserterPlaceholder='New list'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = `#/listboard/${item.Id}`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    active={isRoutingTo(`#/tasklist/${item.Id}`, currentPath) || isRoutingTo(`#/listboard/${item.Id}`, currentPath)}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
                                    selectable={item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text)},
                                        content: item.Summary}}
                                    editable={(text) => {changeName(item, text)}}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

        <SidebarGroup border title='Archived' collapsable onExpand={onExpandArchived}>
            <SidebarList    objects={archivedLists}
                            bind:this={navArchivedLists}>
                <svelte:fragment let:item>
                    {@const href = `#/tasklist/${item.Id}?archivedList`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    summary={item.Summary}
                                    active={isRoutingTo(href, currentPath)}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
            
        </SidebarGroup>

        {:else}
            <Spinner delay={3000}/>
        {/if}

{:else} <!-- !sidebar -->

    {#if taskLists && taskLists.length > 0}
        <SidebarGroup>
            <SidebarItem    href="#/mytasks"
                            icon={FaList}
                            operations={(node) => getUserListOperations(node, user)}
                            summary="All active tasks assigned to me."
                            item={user}>
                My Tasks
            </SidebarItem>
        </SidebarGroup>

        <SidebarGroup border>
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = `#/listboard/${item.Id}`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
                                    {item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text)},
                                        content: item.Summary}}
                                    editable={(text) => {changeName(item, text)}}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

        <SidebarGroup border title='Archived' collapsable onExpand={onExpandArchived}>
            <SidebarList    objects={archivedLists}
                            bind:this={navArchivedLists}>
                <svelte:fragment let:item>
                    {@const href = `#/tasklist/${item.Id}?archivedList`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    summary={item.Summary}
                                    {item}>
                        {item.Name}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList>
            
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}

<Modal  title="Delete"
        content="Are you sure you want to delete selected list?"
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected list?"
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        />