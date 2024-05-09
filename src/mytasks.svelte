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
				mainViewReloader,
                Modal} from '@humandialog/forms.svelte'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaArchive, FaEllipsisH} from 'svelte-icons/fa'
    
    export let params = {}

    let user = null;
    let listComponent;

    let lists = [];
    const STATUS_CLOSED = 2;

    $: onParamsChanged($session, $mainViewReloader);
    
    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        if(lists.length == 0)
        {
            let res = await reef.get('/app/Lists')
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
                                });
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

        await reef.delete(taskToDelete.$ref);
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

        await reef.get(`${taskToArchive.$ref}/Archive`)
        archiveModal.hide();
        
        await reloadTasks(listComponent.SELECT_NEXT)
    }

    async function finishTask(event, task)
    {
        event.stopPropagation();

        let result = await reef.get(`${task.$ref}/Finish`);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)   
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`/user/MyTasks/new`, newTaskAttribs)
        if(!res)
            return null;

        let newTask = res.Task[0];
        await reloadTasks(newTask.Id)
    }

    let pageOperations = [
        {
            icon: FaPlus,
            caption: '',
            action: (focused) => { listComponent.addRowAfter(null) }
        }
    ]

    function getEditOperations(task)
    {
        return [
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

        ];
    }

    let taskOperations = (task) => { 
        let editOperations = getEditOperations(task)
        return [
                {
                    icon: FaPlus,
                    caption: '',
                    action: (focused) => { listComponent.addRowAfter(task) }
                },
                {
                    toolbox:[
                        {
                            icon: FaPen,
                            grid: editOperations
                        },
                        {
                            icon: FaEllipsisH,
                            menu:[
                            /* {
                                    icon: FaArchive,
                                    caption: 'Archive',
                                    action: (f) => askToArchive(task)
                                },*/
                                {
                                    icon: FaTrash,
                                    caption: 'Delete',
                                    action: (f) => askToDelete(task)
                                }
                            ]
                        }
                        
                    ]
                },
                {
                    icon: FaCaretDown,
                    action: (f) => listComponent.moveDown(task)
                },
                {
                    icon: FaCaretUp,
                    action: (f) => listComponent.moveUp(task)
                }
            ];
    }

    let taskContextMenu = (task) => {
        let editOperations = getEditOperations(task);
        return {
            grid: editOperations
        }
    }

</script>


{#if user}
    <Page   self={user} 
            toolbarOperations={pageOperations}
            clearsContext='props sel'>

        <List   self={user} 
                a='MyTasks' 
                toolbarOperations={taskOperations} 
                contextMenu={taskContextMenu}
                orderAttrib='UserOrder'
                bind:this={listComponent}>
            <ListTitle a='Title'/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="TaskList" association>
                <ComboSource objects={lists} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                <Icon component={element.Status == STATUS_CLOSED ? FaRegCheckCircle : FaRegCircle} 
                    on:click={(e) => finishTask(e, element)} 
                    class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
            </span>

            
        </List>
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