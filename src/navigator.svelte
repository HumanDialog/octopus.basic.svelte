<script>
    import {    Spinner, 
                startEditing, 
                SidebarGroup, 
                SidebarList, 
                SidebarItem, 
                reloadMainView, 
                Modal} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive} from 'svelte-icons/fa'
    import {location} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount } from 'svelte';

    export let sidebar = true;

    let taskLists = [];
    let user = {};
    let navLists;

    let justHaveCompletedLists = false;

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
        {
            taskLists = res.TaskList;
            justHaveCompletedLists = true;
        }
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

    async function finishAllOnList(list)
    {
        await reef.get(`/app/Lists/${list.Id}/FinishAll`)
        
        if(isRoutingTo(`#/tasklist/${list.Id}`, currentPath))
        {
            reloadMainView();
        }
    }

    async function finishAllMyTasks()
    {       
        await reef.get(`/user/FinishTasks`)
        
        if(isRoutingTo('#/mytasks', currentPath))
        {
            reloadMainView();
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
    
    function getUserListOperations(dom_node, data_item)
    {
        let menu_operations = [];
        if(data_item == user)
            menu_operations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllMyTasks()
            });

        return menu_operations;
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

        await reef.get(`/app/Lists/${listToArchive.Id}/Archive`)
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

    function getTaskListOperations(dom_node, data_item)
    {
        let menu_operations = [];
        menu_operations = [
            {
                caption: 'Rename',
                action: (f) => startEditing(dom_node)
            },
            {
                caption: 'Finish all',
                action: (f) => finishAllOnList(data_item)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navLists.moveUp(data_item)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navLists.moveDown(data_item)

            },
            {
                separator: true
            },
            {
                caption: 'Archive',
                action: (f) => askToArchive(data_item)
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(data_item)
            }
        ]
        return menu_operations
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
                <svelte:fragment let:item>
                    {@const href = `#/tasklist/${item.Id}`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    active={isRoutingTo(href, currentPath)}
                                    operations={(node) => getTaskListOperations(node, item)}
                                    selectable={item}
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
                            item={user}>
                My Tasks
            </SidebarItem>
        </SidebarGroup>

        <SidebarGroup border>
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item>
                    {@const href = `#/tasklist/${item.Id}`}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    operations={(node) => getTaskListOperations(node, item)}
                                    {item}
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