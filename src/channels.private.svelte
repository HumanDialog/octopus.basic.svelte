<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
				mainContentPageReloader,
                Modal, showMenu,
                onErrorShowAlert, i18n} from '@humandialog/forms.svelte'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaRegComment, FaCaretUp, FaCaretDown, FaTrash, FaRegComments, FaRegClipboard, FaPen, FaArchive, FaEllipsisH, FaCopy, FaCut} from 'svelte-icons/fa'

    export let params = {}

    let user = null;
    let listComponent;

    const title = '_; Private channels; Canales privados; Kanały prywatne'


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/user/query`,
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
                                                    Association: 'MessageChannels',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref', 'UnreadMessagesNo', 'MessageChannelId'],
                                                    Sort: "Order",
                                                }
                                            ]
                                        }
                                    ]
                                },
                                onErrorShowAlert);
        if(res)
            user = res.User;
        else
            user = null
    }

    async function reloadChannels(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
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

        await reef.delete(`/user/MessageChannels/${channelToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();


        await reloadChannels(listComponent.SELECT_NEXT)
    }


    

    let pageOperations = {
        opver: 2,
        fab: 'M00',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        caption: '_; New channel; Nuevo canal; Nowy kanał',
                        icon: FaRegComment,
                        action: onNewDMChannel,
                        tbr: 'A',
                        fab: 'M03'
                    }
                ]
            }
        ]
    }

    function getEditOperations(channel)
    {
        return [

        ];
    }

    let channelOperations = (channel) => {
        let editOperations = getEditOperations(channel)
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [ 
                        {
                            caption: '_; New channel; Nuevo canal; Nowy kanał',
                            icon: FaRegComment,
                            action: onNewDMChannel,
                            tbr: 'A',
                            fab: 'M03'
                        }
                    ]
                },
                {
                    caption: '_; Channel; Canal; Kanał',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            icon: FaPen,
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                        /*        {
                                    caption: '_; Edit Title; Editar título; Edytuj tytuł',
                                    action: (f) =>  { listComponent.edit(channel, 'Title') },
                                },
                        */        {
                                    caption: '_; Edit summary; Editar resumen; Edytuj podsumowanie',
                                    action: (f) =>  { listComponent.edit(channel, 'Summary') }
                                }
                            ]

                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(channel),
                            fab:'M05',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(channel),
                            fab:'M04',
                            tbr:'A' 
                        },
                    
                       {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(channel),
                            //fab:'M30',
                            //tbr:'B'
                        }
                        
                    ]
                }
            ]
        }
    }

    async function addDirectChannel(toWhom)
    {
        const res = await reef.post(`user/AddDirectMesssageChannel`, {
            toWhom: toWhom
        }, onErrorShowAlert)

        await reloadChannels(listComponent.KEEP_SELECTION)
    }

    async function onNewDMChannel(element)
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

        let owner = element;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()
        showMenu(rect, options);
    }
</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if user}

    <Page   self={user}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title={title}>
            <section class="w-full place-self-center max-w-3xl">

            <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {title}
            </p>

        <List   self={user}
                a='MessageChannels'
                toolbarOperations={channelOperations}
                orderAttrib='Order'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(channel) => `${channel.href}`}/>
            <ListSummary a='Summary'/>
            <!--ListInserter action={addChannel} icon/-->

            <span slot="left" let:element>
                <Icon component={FaRegComment}
                    class="h-5 w-5  text-stone-500 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
            </span>

        </List>
    </section>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected channel?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteChannel}
        bind:this={deleteModal}
        />
