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
                onErrorShowAlert} from '@humandialog/forms.svelte'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaArchive, FaEllipsisH} from 'svelte-icons/fa'

    export let params = {}

    let user = null;
    let listComponent;

    let lists = [];
    const STATE_FINISHED = 7000;

    $: onParamsChanged($session, $mainContentPageReloader);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        if(lists.length == 0)
        {
            let res = await reef.get('/group/Lists', onErrorShowAlert)
            if(res)
                lists = res.TaskList;
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
                                            Expressions:['Id','Name'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'MyTasks',
                                                    Filter: 'State <> STATE_FINISHED',
                                                    Sort: "UserOrder",
                                                    SubTree:[
                                                        {
                                                            Id: 3,
                                                            Association: 'Actor',
                                                            Expressions:['$ref', 'Name']
                                                        },
                                                        {
                                                            Id: 4,
                                                            Association: 'TaskList',
                                                            Expressions:['$ref', 'Name']
                                                        }
                                                    ]
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

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }


    let deleteModal;
    let taskToDelete;
    function askToDelete(task)
    {
        taskToDelete = task;
        deleteModal.show()
    }


    async function deleteTask()
    {
        if(!taskToDelete)
            return;

        //await reef.delete(taskToDelete.$ref, onErrorShowAlert);
        await reef.post(`${taskToDelete.$ref}/DeletePermanently`, { } , onErrorShowAlert);
        deleteModal.hide();


        await reloadTasks(listComponent.SELECT_NEXT)
    }

    let archiveModal;
    let taskToArchive;
    function askToArchive(task)
    {
        taskToArchive = task;
        archiveModal.show();
    }

    async function archiveTask()
    {
        if(!taskToArchive)
            return;

        await reef.post(`${taskToArchive.$ref}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        await reloadTasks(listComponent.SELECT_NEXT)
    }

    async function finishTask(event, task)
    {
        event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`/user/MyTasks/new`, newTaskAttribs, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.Task[0];
        await reloadTasks(newTask.Id)
    }


    let pageOperations = {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: 'View',
                    operations: [
                        {
                            icon: FaPlus,
                            caption: 'Add',
                            hideToolbarCaption: true,
                            action: (focused) => { listComponent.addRowAfter(null) },
                            //fab: 'M10',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }

    let taskOperations = (task) => {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: 'Task',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            fab: 'M20',
                            tbr: 'A',
                            grid: [
                                    {
                                        caption: 'Name',
                                        action: (focused) =>  { listComponent.edit(task, 'Title') }
                                    },
                                    {
                                        caption: 'Summary',
                                        action: (focused) =>  { listComponent.edit(task, 'Summary') }
                                    },
                                    {
                                        separator: true
                                    },
                                    {
                                        caption: 'List',
                                        action: (focused) => { listComponent.edit(task, 'TaskList') }
                                    },
                                    {
                                        caption: 'Due Date',
                                        action: (focused) => { listComponent.edit(task, 'DueDate') }
                                    }
                            ]

                        },
                        {
                            caption: 'Move up',
                            hideToolbarCaption: true,
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(task),
                            fab: 'M03',
                            tbr: 'A'
                        },
                        {
                            caption: 'Move down',
                            hideToolbarCaption: true,
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(task),
                            fab: 'M02',
                            tbr: 'A'
                        },

                        /* {
                            icon: FaArchive,
                            caption: 'Archive',
                            action: (f) => askToArchive(task)
                        },*/
                        {
                            icon: FaTrash,
                            caption: 'Delete',
                            action: (f) => askToDelete(task),
                            fab: 'S10',
                        }

                    ]
                },
                {
                    caption: 'View',
                    operations: [
                        {
                            caption: 'Add',
                            hideToolbarCaption: true,
                            icon: FaPlus,
                            action: (focused) => { listComponent.addRowAfter(task) },
                            fab: 'M01',
                            tbr: 'A'
                        }
                    ]
                }
            ]
        }
    }



</script>

<svelte:head>
    <title>My Tasks | {__APP_TITLE__}</title>
</svelte:head>

{#if user}
    <Page   self={user}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title='My tasks'>
            <section class="w-full place-self-center max-w-3xl">
        <List   self={user}
                a='MyTasks'
                toolbarOperations={taskOperations}
                orderAttrib='UserOrder'
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(task) => `/task/${task.Id}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="TaskList" association>
                <ComboSource objects={lists} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                <Icon component={element.State == STATE_FINISHED ? FaRegCheckCircle : FaRegCircle}
                    on:click={(e) => finishTask(e, element)}
                    class="h-5 w-5  text-stone-500 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
            </span>


        </List>
        <section class="w-full flex justify-center">
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title="Delete"
        content="Are you sure you want to delete selected task?"
        icon={FaTrash}
        onOkCallback={deleteTask}
        bind:this={deleteModal}
        />

<Modal  title="Archive"
        content="Are you sure you want to archive selected task?"
        icon={FaArchive}
        onOkCallback={archiveTask}
        bind:this={archiveModal}
        />