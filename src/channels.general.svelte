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
                Modal,
                onErrorShowAlert, i18n} from '@humandialog/forms.svelte'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaHashtag, FaCaretUp, FaCaretDown, FaTrash, FaRegComments, FaRegClipboard, FaPen, FaArchive, FaEllipsisH, FaCopy, FaCut} from 'svelte-icons/fa'

    export let params = {}

    let group = null;
    let listComponent;

    const title = '_; General Channels; Canales generales; Kanały ogólne'


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            group = null;
            return;
        }

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
                                                    Association: 'MessageChannels',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref', 'GetUnreadMessagesNo', 'IsSubscribed'],
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

    async function reloadChannels(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(group, selectRecommendation);
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


        await reloadChannels(listComponent.SELECT_NEXT)
    }


    async function addChannel(newChannelAttribs)
    {
        let res = await reef.post("/group/AddGeneralMessageChannel", 
            {
                title: newChannelAttribs.Title,
                summary: newChannelAttribs.Summary ?? '',
                order: newChannelAttribs.Order ?? 0
            }, onErrorShowAlert);
        if(!res)
            return null;

        let newChannel = res.MessageChannel
        await reloadChannels(newChannel.Id)
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
                        icon: FaHashtag,
                        action: (focused) => { listComponent.addRowAfter(null) },
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
                            icon: FaHashtag,
                            action: (focused) => { listComponent.addRowAfter(channel) },
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
                                {
                                    caption: '_; Edit Title; Editar título; Edytuj tytuł',
                                    action: (f) =>  { listComponent.edit(channel, 'Title') },
                                },
                                {
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

            <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {title}
            </p>

        <List   self={group}
                a='MessageChannels'
                toolbarOperations={channelOperations}
                orderAttrib='Order'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(channel) => `${channel.href}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addChannel} icon/>

            <span slot="left" let:element>
                <Icon component={FaHashtag}
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
