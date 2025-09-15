<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert, i18n,
                breadcrumbAdd, Breadcrumb} from '@humandialog/forms.svelte'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegComments, FaRegClipboard, FaPen, FaArchive, FaEllipsisH, FaCopy, FaCut} from 'svelte-icons/fa'

    export let params = {}

    let group = null;
    let listComponent;

    let prevBreadcrumbPath = ''
    let breadcrumbPath = ''
    const title = '_; Common folders; Carpetas comunes; Wspólne foldery'


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            group = null;
            return;
        }

        const params = new URLSearchParams($querystring);
        if(params.has("path"))
            prevBreadcrumbPath = params.get("path") ?? ''
        else
            prevBreadcrumbPath = ''

        breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, title, $location)

        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/group/query`,
                                {
                                    Id: 1,
                                    Name: "collector",
                                    ExpandLevel: 3,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            Expressions:['Id','Name', '$ref'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'Folders',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref', 'icon'],
                                                    Sort: "Order",
                                                }
                                            ]
                                        }
                                    ]
                                },
                                onErrorShowAlert);
        if(res)
            group = res.Group;
        else
            group = null
    }

    async function reloadFolders(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(group, selectRecommendation);
    }


    let deleteModal;
    let folderToDelete;
    function askToDelete(folder)
    {
        folderToDelete = folder;
        deleteModal.show()
    }


    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.post(`${folderToDelete.$ref}/DeletePermanently`, { }, onErrorShowAlert);
        deleteModal.hide();


        await reloadFolders(listComponent.SELECT_NEXT)
    }


    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post("/group/Folders/new", newFolderAttribs, onErrorShowAlert);
        if(!res)
            return null;

        let newFolder = res.Folder[0];
        await reloadFolders(newFolder.Id)
    }

    let pageOperations = {
        opver: 2,
        fab: 'M00',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        caption: '_; New folder; Nueva carpeta; Nowy folder',
                        icon: FaRegFolder,
                        action: (focused) => { listComponent.addRowAfter(null) },
                        tbr: 'A',
                        fab: 'M03'
                    }
                ]
            }
        ]
    }

    function getEditOperations(folder)
    {
        return [

        ];
    }

    let folderOperations = (folder) => {
        let editOperations = getEditOperations(folder)
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [ 
                        {
                            caption: '_; New folder; Nueva carpeta; Nowy folder',
                            icon: FaRegFolder,
                            action: (focused) => { listComponent.addRowAfter(folder) },
                            tbr: 'A',
                            fab: 'M03'
                        }
                    ]
                },
                {
                    caption: '_; Folder; Carpeta; Folder',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            icon: FaPen,
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                                {
                                    caption: '_; Edit Title; Editar título; Edytuj tytuł',
                                    action: (f) =>  { listComponent.edit(folder, 'Title') },
                                },
                                {
                                    caption: '_; Edit summary; Editar resumen; Edytuj podsumowanie',
                                    action: (f) =>  { listComponent.edit(folder, 'Summary') }
                                }
                            ]

                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(folder),
                            fab:'M05',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(folder),
                            fab:'M04',
                            tbr:'A' 
                        },
                    
                       {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(folder),
                            //fab:'M30',
                            //tbr:'B'
                        }
                        
                    ]
                }
            ]
        }
    }

    /*
    async function copyFolderToBasket(folder)
    {
        await reef.post(`${folder.$ref}/CopyToBasket`, { }, onErrorShowAlert)
        // not needed
        //await reloadFolders(listComponent.SELECT_NEXT)
    }

    async function cutFolderToBasket(folder)
    {
        const res = await reef.post(`${user.$ref}/MoveFolderToBasket`, {folder: folder.$ref}, onErrorShowAlert)
        if(res)
            await reloadFolders(listComponent.SELECT_NEXT)
    }
    */

    
    function getFolderIcon(folder)
    {
        if(folder.icon)
        {
            switch(folder.icon)
            {
            case 'Folder':
                return FaRegFolder;
            case 'Clipboard':
                return FaRegClipboard;
            case 'Discussion':
                return FaRegComments;
            default:
                return FaRegFolder
            }
        }
        else
            return FaRegFolder
    }

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if group}

    <Page   self={group}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title={title}>
            <section class="w-full place-self-center max-w-3xl">

        {#if breadcrumbPath}
                <Breadcrumb class="hidden sm:block mb-5" path={breadcrumbPath} />
            {/if}


            <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {title}
            </p>

        <List   self={group}
                a='Folders'
                toolbarOperations={folderOperations}
                orderAttrib='Order'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(folder) => `${folder.href}?path=${breadcrumbPath}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addFolder} icon/>

            <span slot="left" let:element>
                <Icon component={getFolderIcon(element)}
                    class="h-5 w-5  text-stone-500 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
            </span>

        </List>
    </section>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected folder?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />
