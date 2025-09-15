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
                randomString, UI, i18n, ext, isDeviceSmallerThan} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus} from 'svelte-icons/fa'
    import {location, push, link} from 'svelte-spa-router'
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
        let res = await reef.post('group/query', {
            Id: 1,
            Name: "collector",
            ExpandLevel: 1,
            Limit: isDeviceSmallerThan("sm") ? 7 : 12,
            Tree: [
                {
                    Id: 2,
                    Association: 'Lists',
                    Sort: "Order",
                    Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref', '$type']
                }
            ]
        }, onErrorShowAlert)

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
                caption: '_; Finish all; Completa todos; Ukończ wszystkie',
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
                caption: '_; Rename; Editar nombre; Edytuj nazwę',
                action: (f) => startEditing(domNode)
            },
            {
                caption: '_; Edit summary; Editar resumen; Edytuj podsumowanie',
                action: (f) => navItem.editSummary()
            },
            {
                caption: '_; Finish all; Completa todos; Ukończ wszystkie',
                action: (f) => finishAllOnList(dataItem)
            },
            {
                caption: '_; Move on top; Mover a la parte superior; Przesuń na szczyt',
                action: (f) => navLists.moveTop(dataItem)
            },
            {
                caption: '_; Move up; Desplazar hacia arriba; Przesuń w górę',
                icon: FaCaretUp,
                action: (f) => navLists.moveUp(dataItem)
            },
            {
                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                icon: FaCaretDown,
                action: (f) => navLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: '_; Archive; Archivar; Zarchiwizuj',
                action: (f) => askToArchive(dataItem)
            },
            {
                caption: '_; Delete; Eliminar; Usuń',
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
                caption: '_; Add group; Añadir grupo; Dodaj grupę',
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
                                summary={i18n(["All active tasks assigned to me.", "Tareas activas asignadas a mí.", "Aktywne zadania przypisane do mnie."])}
                                selectable={user}>
                    _; My Tasks; Mis tareas; Moje zadania
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup   title={i18n({en: 'Task lists', es: 'Listas de tareas', pl: 'Listy zadań'})}
                        moreHref="/alllists">
           
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    active={isRoutingTo(href, currentPath)}
                                    summary={ext(item.Summary)}>
                        {ext(item.Name)}
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
                                summary={i18n(["All active tasks assigned to me.", "Tareas activas asignadas a mí.", "Aktywne zadania przypisane do mnie."])}
                                item={user}>
                    _; My Tasks; Mis tareas; Moje zadania
                </SidebarItem>
            </SidebarGroup>
        {/if}
        
        <SidebarGroup title={i18n({en: 'Task lists', es: 'Listas de tareas', pl: 'Listy zadań'})}
                        moreHref="/alllists">
                        
            <SidebarList    objects={taskLists} 
                            orderAttrib='Order'
                            bind:this={navLists}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    bind:this={navItems[idx]}
                                    
                                    {item}
                                    summary={ext(item.Summary)}>
                        {ext(item.Name)}
                    </SidebarItem>
                </svelte:fragment>
            </SidebarList> 
        </SidebarGroup>

    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}
{/key}

<!--Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected list?", '¿Está seguro de que desea eliminar la lista seleccionada?', 'Czy na pewno chcesz usunąć wybraną listę?'])}
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected list?", '¿Está seguro de que desea archivar la lista seleccionada?', 'Czy na pewno chcesz zarchiwizować wybraną listę?'])}
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        />

<Modal  bind:open={newGroupModalVisible}
        title={i18n(['Create group', 'Crear grupo', 'Utwórz grupę'])}
        okCaption={i18n(['Create', 'Crear', 'Utwórz'])}
        onOkCallback={onNewGroupOK}
        onCancelCallback={onNewGroupCancel}
        icon={FaUsers}
>
    <Input  label={i18n(['Group name', 'Nombre del grupo', 'Nazwa grupy'])} 
            placeholder='' 
            self={newGroupParams} 
            a="name"
            required/>
</Modal-->