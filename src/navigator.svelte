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
                randomString, UI} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { afterUpdate, onMount, tick } from 'svelte';
    import {cache} from './cache.js'

    export let sidebar = true;

    let taskLists = [];
    let user = {};
    let navLists;
    let navItems = [];
    
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
        
        if($session.isActive)
        {
            reef.get("/user", onErrorShowAlert).then((res) => {
                if(res != null)
                    user = res.User;
            })
           
        }

        initGroupSelector();

        const cacheKey = `listsNavigator`
        const cachedValue = cache.get(cacheKey)
        if(cachedValue)
        {
            taskLists = cachedValue;
            navLists?.reload(taskLists)
        }

        await fetchData()
        navLists?.reload(taskLists)
        cache.set(cacheKey, taskLists);
    }

    async function fetchData()
    {
        let res = await reef.get("/group/Lists?sort=Order&fields=Id,Name,Summary,Order,href,$type", onErrorShowAlert);
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
        await reef.post('/group/CreateList', 
                        { 
                            Name: listName,
                            Order: order
                        },
                        onErrorShowAlert);
        reload();
    }

    async function changeName(list, name)
    {
        let res = await reef.post(`/group/Lists/${list.Id}/set`, 
                                {
                                    Name: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(list, summary, navItem)
    {
        list.Summary = summary
        navItem.updateSummary(summary)
        let res = await reef.post(`/group/Lists/${list.Id}/set`, 
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function finishAllOnList(list)
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

        await reef.post(`/group/Lists/${listToArchive.Id}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        reload();
    }

    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/group/Lists/${listToDelete.Id}`, onErrorShowAlert)
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
        let res = await reef.get("/group/AllLists?sort=-Id&fields=Id,Name,$type&Status=TLS_GROUP_ARCHVIVED_LIST", onErrorShowAlert);
        if(res != null)
        {
            archivedLists = res.TaskList;
            navArchivedLists.reload(archivedLists)

        }
        else
            archivedLists = [];
    }

    export function requestAdd()
    {
        navLists.add(async (listName, order) => {
            await addList(listName, order)
        })
    }

    let showGroupsSwitchMenu = false;
    let canAddNewGroup = false;
    let currentGroup = {}

    function initGroupSelector()
    {
        showGroupsSwitchMenu = $session.tenants.length > 1
        if($session.configuration.tenant)
        {
            reef.getAppInstanceInfo().then( (instanceInfo =>{
                if(instanceInfo?.is_public)
                {
                    showGroupsSwitchMenu = true;
                    canAddNewGroup = true;
                }
            }))
        }
        
        currentGroup = $session.tenants.find(t => t.id == $session.tid)
        
    }

    function getGroupsMenu()
    {
        if(!showGroupsSwitchMenu)
            return []
        
        let options = []
        $session.tenants.forEach(tInfo =>
            options.push({
                caption: tInfo.name,
                icon: FaUsers,
                disabled: tInfo.id == $session.tid,
                action: async (f) => {
                    $session.setCurrentTenantAPI(tInfo.url, tInfo.id)
                    push('/')
                    
                    await tick()
                    reloadWholeApp();
                }
            })
        )

        if(canAddNewGroup)
        {
            options.push({
                separator: true
            })
            options.push({
                caption: 'Add group',
                icon: FaPlus,
                action: (f) => launchNewGroupWizzard()
            })
        }
        
        return options;
    }

    let newGroupParams = {
        name: ''
    }

    let newGroupModalVisible = false;
    let newGroupIdempotencyToken = ''
    function launchNewGroupWizzard()
    {
        newGroupParams.name = '';
        newGroupModalVisible = true;
        newGroupIdempotencyToken = randomString(8);
    }

    async function onNewGroupOK()
    {
        const appId = $session.appId
        if(!appId)
        {
            return onNewGroupCancel()
        }
        
        const appInstanceId = $session.configuration.tenant
        if(!appInstanceId)
        {
            return onNewGroupCancel()
        }

            const body = {
                app_id: $session.appId,
                tenant: $session.configuration.tenant,
                org_name: newGroupParams.name,
                idempotency_token: newGroupIdempotencyToken
            }

            const res = await reef.fetch(  "/dev/create-group-for-me",
                                {
                                    method: 'post',
                                    body : JSON.stringify(body)
                                });

            if(res.ok)
            {
                await reef.refreshTokens()
                //reloadWholeApp()
            }
            else
            {
                const result = await res.json();  
                console.error(result.error);
                onErrorShowAlert(result.error)
            }

        newGroupParams.name = '';
        newGroupModalVisible = false;
    }

    function onNewGroupCancel()
    {
        newGroupParams.name = '';
        newGroupModalVisible = false;
    }

</script>

{#key currentPath}
{#if sidebar}
    {#if taskLists && taskLists.length > 0}
        {#if showGroupsSwitchMenu}
            <SidebarGroup>
                <SidebarItem    href=""    
                                icon={FaUsers}
                                operations={(n) => getGroupsMenu()}
                                selectable={currentGroup}>
                    {currentGroup?.name}
                </SidebarItem>
            </SidebarGroup>
        {/if}
        
        {#if $session.isActive}
            {@const border=showGroupsSwitchMenu}
            <SidebarGroup border>
                <SidebarItem   href="/mytasks"
                                icon={FaList}
                                active={isRoutingTo("/mytasks", currentPath)}
                                operations={(node) => getUserListOperations(node, user)}
                                summary="All active tasks assigned to me."
                                selectable={user}>
                    My Tasks
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup border>
           
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            inserter={addList} 
                            inserterPlaceholder='New list'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    active={isRoutingTo(href, currentPath)}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
                                    selectable={item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text, navItems[idx])},
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
                    {@const href = `/tasklist/${item.Id}?archivedList`}
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

    {#if showGroupsSwitchMenu}
        <SidebarGroup>
            <SidebarItem    href=""    
                            icon={FaUsers}
                            operations={(n) => getGroupsMenu()}
                            item={currentGroup}>
                {currentGroup?.name}
            </SidebarItem>
        </SidebarGroup>
    {/if}
        
        {#if $session.isActive}
            {@const border=showGroupsSwitchMenu}
            <SidebarGroup border>
                <SidebarItem    href="/mytasks"
                                icon={FaList}
                                operations={(node) => getUserListOperations(node, user)}
                                summary="All active tasks assigned to me."
                                item={user}>
                    My Tasks
                </SidebarItem>
            </SidebarGroup>
        {/if}
        
        <SidebarGroup border>
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    operations={(node) => getTaskListOperations(node, item, navItems[idx])}
                                    {item}
                                    summary={{
                                        editable: (text) => {changeSummary(item, text, navItems[idx])},
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
                    {@const href = `/tasklist/${item.Id}?archivedList`}
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
{/key}

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

<Modal  bind:open={newGroupModalVisible}
        title='Create group'
        okCaption='Create'
        onOkCallback={onNewGroupOK}
        onCancelCallback={onNewGroupCancel}
        icon={FaUsers}
>
    <Input  label='Group name' 
            placeholder='' 
            self={newGroupParams} 
            a="name"
            required/>
</Modal>