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
                onErrorShowAlert,
            i18n} from '@humandialog/forms.svelte'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaList, FaPen, FaArchive, FaChevronLeft, FaChevronRight} from 'svelte-icons/fa'
    import {querystring, pop, link} from 'svelte-spa-router'

    export let params = {}

    let group = null;
    let listComponent;
    let showArchived = false;

    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            group = null;
            return;
        }

        const params = new URLSearchParams($querystring);
        showArchived = params.has('archived')

        await fetchData()
    }

    async function fetchData()
    {
        if(!showArchived)
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
                                                Expressions:['Id','Name'],
                                                SubTree:
                                                [
                                                    {
                                                        Id: 2,
                                                        Association: 'Lists',
                                                        //Filter: 'State <> STATE_FINISHED',
                                                        Sort: "Order",
                                                        Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref']
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
        else
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
                                                Expressions:['Id','Name'],
                                                SubTree:
                                                [
                                                    {
                                                        Id: 2,
                                                        Association: 'AllLists',
                                                        Filter: 'Status=TLS_GROUP_ARCHVIVED_LIST',
                                                        Sort: "-Id",
                                                        Expressions: ['Id', 'Name', 'Summary', 'Order', 'href', '$ref']
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

    }

    async function reloadLists(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(group, selectRecommendation);
    }


    let deleteModal;
    let listToDelete;
    function askToDelete(list)
    {
        listToDelete = list;
        deleteModal.show()
    }


    async function deleteList()
    {
        if(!listToDelete)
            return;

        await reef.delete(`/group/Lists/${listToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();


        await reloadLists(listComponent.SELECT_NEXT)
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

        await reloadLists(listComponent.SELECT_NEXT)
    }
   

    async function addList(newListAttribs)
    {
        let res = await reef.post('/group/CreateList', 
                        { 
                            name: newListAttribs.Name,
                            order: newListAttribs.Order,
                            summary: newListAttribs.Summary
                        },
                        onErrorShowAlert);

        if(!res)
            return null;

        let newList = res.TaskList;
        await reloadLists(newList.Id)
    }


    let pageOperations = {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            icon: FaList,
                            caption: '_; New list; Nueva lista; Nowa lista',
                            action: (focused) => { listComponent.addRowAfter(null) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }

    let listOperations = (list) => {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                 {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; New list; Nueva lista; Nowa lista',
                            icon: FaList,
                            action: (focused) => { listComponent.addRowAfter(list) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                },
                {
                    caption: '_; List; Lista; Lista',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            fab: 'M20',
                            tbr: 'A',
                            grid: [
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { listComponent.edit(list, 'Name') }
                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { listComponent.edit(list, 'Summary') }
                                    }
                            ]

                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(list),
                            fab: 'M05',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(list),
                            fab: 'M04',
                            tbr: 'A'
                        },

                        {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            action: (f) => askToArchive(list)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: (f) => askToDelete(list)
                        }

                    ]
                }
               
            ]
        }
    }

    const title = '_; All task lists; Todas las listas de tareas; Wszystkie listy zadań'

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if group}
    {#key group}
    {#if !showArchived}
        <Page   self={group}
                toolbarOperations={pageOperations}
                clearsContext='props sel'
                title={title}>
                <section class="w-full place-self-center max-w-3xl">
            <List   self={group}
                    a='Lists'
                    toolbarOperations={listOperations}
                    orderAttrib='Order'
                     title={title}
                    bind:this={listComponent}>
                <ListTitle a='Name' hrefFunc={(list) => list.href} />
                <ListSummary a='Summary'/>
                <ListInserter action={addList} icon/>

                <span slot="left" let:element>
                    <Icon component={FaList}
                        class="h-5 w-5  text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
                </span>


            </List>
           
            <div class="ml-3 mt-20 mb-10">
                <a  href={`/alllists?archived`}
                    class="hover:underline"
                    use:link>
                        _; Show archived lists; Mostrar listas archivadas; Pokaż zarchiwizowane listy
                        <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
                </a>
            </div>
        </Page>
    {:else}
        <Page   self={group}
                toolbarOperations={[]}
                clearsContext='props sel'
                title={title}>
                <section class="w-full place-self-center max-w-3xl">
            <List   self={group}
                    a='AllLists'
                    orderAttrib='Order'
                    bind:this={listComponent}>
                <ListTitle a='Name' hrefFunc={(list) => `/tasklist/${list.Id}?archivedList`} />
                <ListSummary a='Summary'/>
                <!--ListInserter action={addList} icon/-->

                <span slot="left" let:element>
                    <Icon component={FaList}
                        class="h-5 w-5  text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
                </span>


            </List>

            <div class="ml-3 mt-20 mb-10">
                <button on:click={(e) => pop() }>
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronLeft/></div>
                    _; Back; Volver; Wróć
                </button>
            </div>
            
        </Page>
    {/if}
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected list?", "¿Está seguro de que desea eliminar la list seleccionada?", "Czy na pewno chcesz usunąć wybraną listę?"])}
        icon={FaTrash}
        onOkCallback={deleteList}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected list?", "¿Está seguro de que desea archivar la lista seleccionada?", "Czy na pewno chcesz zarchiwizować wybraną listę?"])}
        icon={FaArchive}
        onOkCallback={archiveList}
        bind:this={archiveModal}
        />