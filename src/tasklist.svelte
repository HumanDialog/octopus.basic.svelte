<script>
    import {reef} from '@humandialog/auth.svelte'
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
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaColumns, FaArchive, FaList, FaEllipsisH, FaChevronRight, FaChevronLeft} from 'svelte-icons/fa'
    import {location, pop, push, querystring} from 'svelte-spa-router'

    export let params = {}

    let currentList = null;
    let listPath;
    let listId;
    let listComponent;
    let isArchivedList = false;
    let isArchivedTasks = false;
    let assocName = 'Tasks'
    let listTitle = ''

    let users = [];

    const STATE_FINISHED = 1000;
    
    $: onParamsChanged($location, $querystring, $mainViewReloader);
    
    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'tasklist');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            let res = await reef.get('/app/Users')
            if(res)
                users = res.User;
        }
        
        
        if(!segments.length)
            listId = 'first';
        else
            listId = segments[segments.length-1]
        
        currentList = null

        
        const params = new URLSearchParams($querystring);
        isArchivedList = params.has('archivedList')
        isArchivedTasks = params.has('archivedTasks')

        assocName = (isArchivedTasks || isArchivedList) ? 'ArchivedTasks' : 'Tasks';
        listPath = isArchivedList ? `/app/ArchivedLists/${listId}` : `/app/Lists/${listId}`;
            
        await fetchData()
    }

    async function fetchData()
    {

        let res = await reef.post(`${listPath}/query`,
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
                                                Association: assocName,
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'ListOrder',
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
            currentList = res.TaskList;
        else
            currentList = null

        if(currentList)
        {
            if(!isArchivedTasks)
                listTitle = currentList.Name
            else
                listTitle = `Archive of ${currentList.Name}`
        }
    }

    async function reloadTasks(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(currentList, selectRecommendation);
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
        if(event)
            event.stopPropagation();

        let result = await reef.get(`${task.$ref}/Finish`);
        if(result)
            await reloadTasks(listComponent.KEEP_OR_SELECT_NEXT)   
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${listPath}/CreateTaskEx`,{ properties: newTaskAttribs })
        if(!res)
            return null;

        let newTask = res.Task;
        await reloadTasks(newTask.Id)
    }

    function getPageOperations()
    {
        if(isArchivedList)
            return [];

        if(isArchivedTasks)
            return [];
        
        return [
                    {
                        icon: FaPlus,
                        action: (f) => { listComponent.addRowAfter(null) }
                    },
                    {
                        separator: true
                    },
                    {
                        icon: FaColumns,
                        right: true,
                        action: (f) => switchToKanban()
                    }
                ]
        
    }

    function switchToKanban()
    {
        push(`/listboard/${listId}`);
    }

    function switchToArchive()
    {
        push(`/tasklist/${listId}?archivedTasks`);
    }

    function switchToActive()
    {
        push(`/tasklist/${listId}`);
    }

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
                caption: 'Responsible',
                action: (focused) => { listComponent.edit(task, 'Actor') }
            },
            {
                caption: 'Due Date',
                action: (focused) => { listComponent.edit(task, 'DueDate') }
            }

        ];
    }

    function onOpen(task)
    {
        push(`/task?ref=${task.$ref}`);
    }

    let taskOperations = (task) => { 
        let editOperations = getEditOperations(task)
        return [
                {
                    icon: FaPlus,
                    action: (f) => { listComponent.addRowAfter(task) }
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
                                {
                                    icon: FaArchive,
                                    caption: 'Archive',
                                    action: (f) => askToArchive(task)
                                },
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
                },
                {
                    icon: FaColumns,
                    right: true,
                    action: (f) => switchToKanban()
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


{#if currentList}
    <Page   self={currentList} 
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={listTitle}>

        <List   self={currentList} 
                a={assocName}
                title={listTitle} 
                toolbarOperations={taskOperations} 
                contextMenu={taskContextMenu}
                orderAttrib='ListOrder'
                bind:this={listComponent}>
            <ListTitle a='Title' {onOpen}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addTask} icon/>

            <ListComboProperty  name="Actor" association>
                <ComboSource objects={users} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                {#if element.State == STATE_FINISHED}
                    <Icon component={FaRegCheckCircle} 
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-400 dark:text-stone-500  mt-2 sm:mt-1.5 ml-2 "
                    />    
                {:else}
                    <Icon component={FaRegCircle} 
                        on:click={(e) => finishTask(e, element)} 
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "
                    />
                {/if}
            </span>

            
        </List>

        {#if !isArchivedTasks}
            {#if !isArchivedList}
                <div class="ml-3 mt-20 mb-10">
                    <a  href={`#/tasklist/${listId}?archivedTasks`} 
                        class="hover:underline">
                            Show archived tasks 
                            <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
                    </a>
                </div>
            {/if}
        {:else}
            <div class="ml-3 mt-20  mb-10">
                <button on:click={(e) => pop() }>
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronLeft/></div>
                    Back 
                </button>

            </div>
        {/if}
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