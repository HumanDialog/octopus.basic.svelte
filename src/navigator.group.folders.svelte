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
                onErrorShowAlert, UI} from '@humandialog/forms.svelte'
    import {FaRegFolder, FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash, FaArchive, FaUsers, FaPlus, FaRegStar, FaStar, FaPaste} from 'svelte-icons/fa'
    import {location, push} from 'svelte-spa-router'
    import {reef, session} from '@humandialog/auth.svelte'
	import { onMount, tick } from 'svelte';
    import { cache} from './cache.js'

    export let sidebar = true;

    let groupFolders = [];
    let user = {};
    let basket = {}
    let pinnedFolders = []
    let navGroupFolders;
    let navPinnedFolders;
    let navGroupItems = [];
    let navPinnedItems = [];

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

    function initNavigator()
    {
        if($session.isActive)
        {
            const cachedUser = cache.get('navFoldersUser')
            if(cachedUser)
            {
                user = cachedUser;
                basket = user.BasketFolder
                pinnedFolders = user.PinnedFolders['Folders/Folder']

                navPinnedFolders?.reload(pinnedFolders)
            }

            reef.post('user/query', {
                Id: 1,
                Name: '',
                Tree:[
                    {
                        Id: 1,
                        Association: '',
                        Expressions:['Id','$ref', 'Name'],
                        SubTree: [
                            {
                                Id: 11,
                                Association: 'BasketFolder',
                                Expressions:['Id','$ref', 'Title', 'href', 'Summary'],
                            },
                            {
                                Id: 12,
                                Association: 'PinnedFolders',
                                Expressions:['Id','$ref', 'Title'],
                                SubTree:[
                                    {
                                        Id: 121,
                                        Association: 'Folders/Folder',
                                        Sort: 'Order',
                                        Expressions:['Id','$ref', 'Title', 'href', 'Summary', 'Order'],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, onErrorShowAlert).then( (res) => {
                if(res)
                {
                    user = res.User
                    basket = user.BasketFolder
                    pinnedFolders = user.PinnedFolders['Folders/Folder']

                    navPinnedFolders?.reload(pinnedFolders)
                    cache.set('navFoldersUser', user)
                }
            })
        }

        const cachedFolders = cache.get('navFolderFolders')
        if(cachedFolders)
        {
            groupFolders = cachedFolders;
            navGroupFolders?.reload(groupFolders)
        }

        fetchGroupFolders().then(() => {
            navGroupFolders?.reload(groupFolders)
            cache.set('navFolderFolders', groupFolders)
        })



    }

    async function fetchGroupFolders()
    {
        let res = await reef.get("/group/Folders?sort=Order&fields=Id,Title,Summary,Order,href,$type,$ref", onErrorShowAlert);
        if(res != null)
            groupFolders = res.Folder;
        else
            groupFolders = [];
    }

    async function reloadGroupFolders()
    {
        await fetchGroupFolders();
        navGroupFolders.reload(groupFolders)
    }

    async function reloadPinnedFolders()
    {
        await initNavigator();
    }


    async function addFolder(folderName, order)
    {
        await reef.post("/group/Folders/new",
                            {
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
        reloadGroupFolders();
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



    export function requestAdd()
    {
        navGroupFolders.add(async (folderName, order) => {
            await reef.post("/group/Folders/new",
                            {
                                Title: folderName,
                                Order: order
                            },
                            onErrorShowAlert);
            reloadGroupFolders();
        })
    }



    function getFolderOperations(domNode, dataItem, navItem)
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
                caption: 'Move on top',
                action: (f) => navGroupFolders.moveTop(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navGroupFolders.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navGroupFolders.moveDown(dataItem)

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

    function getPinnedFolderOperations(domNode, dataItem, navItem)
    {
        return [
            {
                caption: 'Unpin',
                icon: FaRegStar,
                action: (f) => unpinFolder(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navPinnedFolders.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navPinnedFolders.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem, 'PinnedFolder')
            }
        ]
    }

    function getGroupFolderOperations(domNode, dataItem, navItem)
    {
        return [
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navGroupFolders.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navGroupFolders.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Edit summary',
                action: (f) => navItem.editSummary()
            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                action: (f) => askToDelete(dataItem, 'GroupFolder')
            }
        ]
    }

    function getMyFoldersOperations(domNode, dataItem)
    {
        return []
    }

    function getBasketOperations(domNode, dataItem)
    {
        return [
            {
                caption: 'Clear Clipboard',
                icon: FaTrash,
                action: (f) => clearFolder(dataItem)
            }];;
    }

    async function clearFolder(folder)
    {
        await reef.post(`${folder.$ref}/DettachAllContent`, {} , onErrorShowAlert)
    }

    async function unpinFolder(folder)
    {
        await reef.post(`${folder.$ref}/TogglePinned`, {}, onErrorShowAlert)
        reloadPinnedFolders();
    }


    let deleteModal;
    let folderToDelete;
    let deleteFolderKind=''
    function askToDelete(folder, kind)
    {
        folderToDelete = folder;
        deleteFolderKind = kind;
        deleteModal.show()
    }

    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.post(`${folderToDelete.$ref}/DeletePermanently`, { },  onErrorShowAlert)
        deleteModal.hide();

        switch(deleteFolderKind)
        {
        case 'GroupFolder':
            reloadGroupFolders();
            break;

        case 'PinnedFolder':
            reloadPinnedFolders();
        }

    }

    async function changeName(folder, name)
    {
        let res = await reef.post(`${folder.$ref}/set`,
                                {
                                    Title: name
                                },
                                onErrorShowAlert);
        return (res != null);
    }

    async function changeSummary(folder, summary)
    {

        let res = await reef.post(`${folder.$ref}/set`,
                                {
                                    Summary: summary
                                },
                                onErrorShowAlert);
        return (res != null);
    }

</script>

{#key currentPath}
{#if sidebar}
    {#if groupFolders && groupFolders.length > 0}
        {#if $session.isActive}
            {#if pinnedFolders && pinnedFolders.length > 0}
                <SidebarGroup >

                    <SidebarList    objects={pinnedFolders}
                                    orderAttrib='Order'
                                    bind:this={navPinnedFolders}>
                        <svelte:fragment let:item let:idx>
                            {@const href = item.href}
                            <SidebarItem   {href}
                                            icon={FaRegStar}
                                            bind:this={navPinnedItems[idx]}
                                            active={isRoutingTo(href, currentPath)}
                                            operations={(node) => getPinnedFolderOperations(node, item, navPinnedItems[idx])}
                                            selectable={item}
                                            summary={{
                                                editable: (text) => {changeSummary(item, text)},
                                                content: item.Summary}}
                                            editable={(text) => {changeName(item, text)}}>
                                {item.Title}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList>
                </SidebarGroup>
            {/if}

            <SidebarGroup border>
                <SidebarItem   href="/myfolders"
                                icon={FaRegFolder}
                                active={isRoutingTo("/myfolders", currentPath)}
                                operations={(node) => getMyFoldersOperations(node, user)}
                                summary="Personal folders"
                                selectable={user}>
                    My Folders
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup border>

            <SidebarList    objects={groupFolders}
                            orderAttrib='Order'
                            inserter={addFolder}
                            inserterPlaceholder='New folder'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navGroupItems[idx]}
                                    active={isRoutingTo(href, currentPath)}
                                    operations={(node) => getGroupFolderOperations(node, item, navGroupItems[idx])}
                                    selectable={item}
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
            {@const href = `/folder/${basket.Id}`}
            <SidebarItem   {href}
                            icon={FaPaste}
                            active={isRoutingTo(href, currentPath)}
                            operations={(node) => getBasketOperations(node, basket)}
                            summary="List of selected items for quick operations"
                            selectable={basket}>
                My Clipboard
            </SidebarItem>
        </SidebarGroup>


        {:else}
            <Spinner delay={3000}/>
        {/if}

{:else} <!-- !sidebar -->

    {#if groupFolders && groupFolders.length > 0}

        {#if $session.isActive}
            {#if pinnedFolders && pinnedFolders.length > 0}
                <SidebarGroup >
                    <SidebarList    objects={pinnedFolders}
                                    orderAttrib='Order'
                                    bind:this={navPinnedFolders}>
                        <svelte:fragment let:item let:idx>
                            {@const href = item.href}
                            <SidebarItem   {href}
                                            icon={FaRegStar}
                                            bind:this={navPinnedItems[idx]}
                                            operations={(node) => getPinnedFolderOperations(node, item, navPinnedItems[idx])}
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
            {/if}



            <SidebarGroup border>
                <SidebarItem    href="/myfolders"
                                icon={FaRegFolder}
                                operations={(node) => getMyFoldersOperations(node, user)}
                                summary="Personal folders"
                                item={user}>
                    My Folders
                </SidebarItem>
            </SidebarGroup>
        {/if}

        <SidebarGroup border>
            <SidebarList    objects={groupFolders}
                            orderAttrib='Order'
                            bind:this={navGroupFolders}>
                <svelte:fragment let:item let:idx>
                    {@const href = item.href}
                    <SidebarItem   {href}
                                    icon={FaRegFolder}
                                    bind:this={navGroupItems[idx]}
                                    operations={(node) => getGroupFolderOperations(node, item, navGroupItems[idx])}
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

        <!-- przeniesione do menu aplikacji (tam gdzie Sign out)-->
        <!--SidebarGroup border>
            {@const href = `/folder/${basket.Id}`}
            <SidebarItem    {href}
                            icon={FaPaste}
                            operations={(node) => getBasketOperations(node, basket)}
                            summary="List of selected items for quick operations"
                            item={basket}>
                My Clipboard
            </SidebarItem>
        </SidebarGroup-->


    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}
{/key}

<Modal  title="Delete"
        content="Are you sure you want to delete selected folder?"
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />
