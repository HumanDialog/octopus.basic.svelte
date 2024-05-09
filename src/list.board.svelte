<script>
    import {reef} from '@humandialog/auth.svelte'
    import {location, push} from 'svelte-spa-router'
    import {
		Page,
		Kanban,
		KanbanColumn,
		KanbanTitle,
		KanbanSummary,
		Spinner,
		ComboSource,
		KanbanCallbacks,
        KanbanDateProperty,
        KanbanComboProperty,
        KanbanTagsProperty,
        KanbanStaticProperty,
        mainViewReloader,
		KanbanSource,
        Modal,
		KanbanColumnBottom

	} from '@humandialog/forms.svelte';
    import {FaPlus, FaList, FaPen, FaCaretLeft, FaCaretRight, FaTrash, FaArrowsAlt, FaArchive, FaCheck, FaEllipsisH, FaChevronRight} from 'svelte-icons/fa'
    import MoveOperations from './list.board.move.svelte'
	
    export let params = {}

    let currentList = null;
    
    let listId = '';
    let listPath = '';

    let users = [];
    let taskStates = [];
    let allTags = ''
    let kanban;

    $: onParamsChanged($location, $mainViewReloader);

	async function onParamsChanged(...args) 
    {
        const segments = $location.split('/');
        
        const foundIdx = segments.findIndex( s => s == 'listboard');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            let res = await reef.get('/app/Users')
            if(res)
                users = res.User;
        }

        allTags = await reef.get('/app/AllTags');
        
        if(!segments.length)
            listId = 'first';
        else
            listId = segments[segments.length-1]
        
        currentList = null

        listPath = `/app/Lists/${listId}`;
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
                                        Expressions:['Id','Name','TaskStates','$type'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Tasks',
                                                //Filter: 'Status <> STATUS_CLOSED',
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
        {
            currentList = null
            return;
        }

        let resetTaskStates = false;
        if(currentList.TaskStates)
        {
            try{
                taskStates = JSON.parse(currentList.TaskStates);
            }
            catch(e)
            {
                taskStates = [];
                resetTaskStates = true;
            }
        }
        else
        {
            taskStates = [];
            resetTaskStates = true;
        }

        if(resetTaskStates)
        {
            taskStates=[
                {
                    name: 'Preparing',
                    state: 0
                },
                {
                    name: 'Finished',
                    state: STATE_FINISHED
                }
            ]
            await saveTaskStates();
        }
    }

    async function reload(selectRecommendations)
    {
        await fetchData();
        kanban.reload(currentList, selectRecommendations);
    }

    let pageOperations = [
        {
            icon: FaPlus,
            action: (f) => kanban.add(KanbanColumnBottom, 0)
        },
        {
            separator: true
        },
        {
            icon: FaList,
            right: true,
            action: (f) => switchToList()
        }
    ];

    function switchToList()
    {
        push(`/tasklist/${listId}`);
    }

    function switchToArchive()
    {
        push(`/tasklist/${listId}?archivedTasks`);
    }
  
	async function onAdd(newTaskAttribs) 
    {
        let res = await reef.post(`${listPath}/CreateTaskEx`,{ properties: newTaskAttribs })
        if(!res)
            return null;

        let newTask = res.Task;
        await reload(newTask.Id)
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

        reload(kanban.SELECT_NEXT);
	}

    let archiveModal;
    let taskToArchive;
    function askToArchive(task)
    {
        taskToArchive = task;
        archiveModal.show();
    }

    async function archiveTask(task)
    {
        if(!taskToArchive)
            return;

        await reef.get(`${taskToArchive.$ref}/Archive`)
        archiveModal.hide();
        
        reload(kanban.SELECT_NEXT);
    }

	
    function onOpen(item)
    {
        push(`/task?ref=${item.$ref}`);
    }

    async function onUpdateAllTags(allAllTags)
    {
        allTags = allAllTags
        await reef.post('app/set', { AllTags: allTags})
    }

    function getCardOperations(task)
    {
        const columnIdx = taskStates.findIndex(s => s.state == task.State)

        return [
            {
                icon: FaPlus,
                action: (f) => { kanban.add(task) }
            },
            {
                toolbox:[
                    {
                        icon: FaPen,
                        grid: [
                            {
                                caption: 'Name',
                                columns: 2,
                                action: (f) =>  { kanban.edit(task, 'Title') }
                            },
                            {
                                caption: 'Summary',
                                action: (f) =>  { kanban.edit(task, 'Summary') }
                            },
                            {
                                separator: true
                            },
                            {
                                caption: 'Responsible',
                                action: (f) => { kanban.edit(task, 'Actor') }
                            },
                            {
                                caption: 'Due Date',
                                action: (f) => { kanban.edit(task, 'DueDate') }
                            },
                            {
                                caption: 'Tag',
                                action: (f) => { kanban.edit(task, 'Tags') }
                            }
                        ]
                    },
                    {
                        icon: FaEllipsisH,
                        menu:[
                            {
                                caption: 'Archive',
                                icon: FaArchive,
                                action: (f) => askToArchive(task)
                            },
                            {
                                caption: 'Delete',
                                icon: FaTrash,
                                action: (f) => askToDelete(task)
                            },
                            {
                                caption: 'Column',
                                menu: getColumnContextMenu(columnIdx, taskStates)
                            }
                        ]
                    }
                ]
            },
            
            {
                icon: FaArrowsAlt,
                toolbar: MoveOperations,
                props: {
                        taskStates: taskStates,
                        item: task,
                        afterActionOperation: kanban.scrollViewToCard,
                        onMoveUp: kanban.moveUp,
                        onMoveDown: kanban.moveDown,
                        onReplace: kanban.replace}
            },
            {
                icon: FaList,
                right: true,
                action: (f) => switchToList()
            }
            
        ]
    }

    function getColumnContextMenu(columnIdx, taskState, inColumnContext=true)
    {
        return [
            {
                caption: inColumnContext ? 'Edit name' : 'Edit column name',
                icon: inColumnContext ? FaPen : undefined,
                action: (f) => kanban.editColumnName(columnIdx)
            },
            {
                caption: inColumnContext ? 'Set as finished' : 'Set column as finished',
                icon: inColumnContext ? FaCheck : undefined,
                action: (f) => setColumnAsFinishing(columnIdx)
            },
            {
                caption: inColumnContext ? 'Move left' : 'Move column left',
                icon: inColumnContext ? FaCaretLeft : undefined,
                action: (f) => onColumnMoveLeft(columnIdx)
            },
            {
                caption: inColumnContext ? 'Move right' : 'Move column right',
                icon: inColumnContext ? FaCaretRight : undefined,
                action: (f) => onColumnMoveRight(columnIdx)
            },
            {
                caption: inColumnContext ? 'Delete' : 'Delete column',
                icon: inColumnContext ? FaTrash : undefined,
                menu: getColumnDeleteOptions(columnIdx, taskState)
            },
            {
                separator: true
            },
            {
                caption: 'Add column',
                icon: inColumnContext ? FaPlus : undefined,
                action: (f) => addColumn("", columnIdx+1)
            }];
    }

    function getColumnOperations(columnIdx, taskState)
    {


        return [
            {
                icon: FaPlus,
                action: (f) => kanban.add(KanbanColumnBottom, columnIdx)
            },
            {
                icon: FaEllipsisH,
                menu: getColumnContextMenu(columnIdx, taskState)
            },
            {
                icon: FaList,
                right: true,
                action: (f) => switchToList()
            }
        ]
    }

    function getColumnDeleteOptions(columnIdx, taskState)
    {
        if(!taskStates)
            return [];

        let moveTos = taskStates.filter(c => c.state != taskState.state).map(
            ({name, state}) => 
                ({  caption: `Move items to ${name}`, 
                    action: (f) => deleteColumnAndSetCardsState(columnIdx, state)}))
                    
        return moveTos;
    }

    async function deleteColumnAndSetCardsState(columnIdx, newState)
    {
        const columnState = taskStates[columnIdx].state;
        const toColumnIdx = taskStates.findIndex(s => s.state == newState)
        const tasks = currentList.Tasks.filter(t => t.State == columnState)
        kanban.moveCardsTo(tasks, toColumnIdx);

        taskStates.splice(columnIdx, 1);
        await saveTaskStates();

        taskStates = [...taskStates]
        await kanban.rerender();

    }

    async function onColumnNameChanged(columnIdx, name)
    {
        taskStates[columnIdx].name = name;
        await saveTaskStates();
    }

    async function onColumnMoveLeft(columnIdx)
    {
        if(columnIdx <= 0)
            return;

        const prevState = taskStates[columnIdx-1];
        const selectedState = taskStates[columnIdx];
        taskStates[columnIdx-1] = selectedState;
        taskStates[columnIdx] = prevState;
        
        await saveTaskStates();

        taskStates = [...taskStates]
        await kanban.rerender(columnIdx-1);
    }

    async function onColumnMoveRight(columnIdx)
    {
        if(columnIdx >= taskStates.length-1)
            return;

        const nextState = taskStates[columnIdx+1];
        const selectedState = taskStates[columnIdx];
        taskStates[columnIdx+1] = selectedState;
        taskStates[columnIdx] = nextState;
        
        await saveTaskStates();

        taskStates = [...taskStates]
        await kanban.rerender(columnIdx+1);
    }

    const STATE_FINISHED = 1000
    async function setColumnAsFinishing(columnIdx)
    {
        for(let i=0; i<taskStates.length; i++)
        {
            let taskState = taskStates[i];
            if(taskState.state == STATE_FINISHED)
            {
                if(i == columnIdx)
                    return;
                else
                {
                    let maxStateValue=0;
                    for(let j=0; j<taskStates.length; j++)
                    {
                        const taskState = taskStates[j];
                        if(taskState.state > maxStateValue)
                            maxStateValue = taskState.state;
                    }

                    const newState = maxStateValue + 1;
                    const tasks = currentList.Tasks.filter(t => t.State == taskState.state)
                    kanban.setCardsState(tasks, newState)
                    taskState.state = newState
                }
            }
        }

        const taskState = taskStates[columnIdx]
        const tasks = currentList.Tasks.filter(t => t.State == taskState.state)
        kanban.setCardsState(tasks, STATE_FINISHED)
        taskState.state = STATE_FINISHED
        
        await saveTaskStates();
        taskStates = [...taskStates]
        await kanban.rerender(columnIdx);
    }

    async function addColumn(name, idx=-1)
    {
        let maxStateValue=0;
        for(let i=0; i<taskStates.length; i++)
        {
            const taskState = taskStates[i];
            if(taskState.state > maxStateValue)
                maxStateValue = taskState.state;
        }

        if(idx < 0)
            idx = taskStates.length;
        
        
        
        taskStates.splice(idx, 0, {
            state: maxStateValue+1,
            name: name
        })
        
        await saveTaskStates();

        taskStates = [...taskStates]
        await kanban.rerender();

        kanban.activateColumn(idx)
        kanban.editColumnName(idx);
    }

    async function saveTaskStates()
    {
        currentList.TaskStates = JSON.stringify(taskStates);
        
        await reef.post(`${listPath}/set`,
                    {
                        TaskStates: currentList.TaskStates
                    });
    }

</script>

{#if currentList}
	<Page
		self={currentList}
		toolbarOperations={pageOperations}
		clearsContext="props sel"
		title={currentList.Name}
	>
		<Kanban class="grow-0" 
                title={currentList.Name} 
                bind:this={kanban}>

            <KanbanSource self={currentList}
                          a='Tasks'
                          stateAttrib='State'
                          orderAttrib='ListOrder'/>

            {#each taskStates as taskState, columnIdx (taskState.state)}
                <KanbanColumn   title={taskState.name} 
                                state={taskState.state} 
                                operations={getColumnOperations(columnIdx, taskState)}
                                onTitleChanged={(title) => onColumnNameChanged(columnIdx, title)}
                                finishing={taskState.state == STATE_FINISHED}/>
            {/each}

			<KanbanCallbacks {onAdd} {onOpen} 
                            {getCardOperations}/>

			<KanbanTitle a="Title"/>
			<KanbanSummary a="Summary" />

            <KanbanStaticProperty top a='Index'/>
            <KanbanDateProperty top a='DueDate'/>

            <KanbanComboProperty middle a='Actor' association>
                <ComboSource objects={users} key="$ref" name='Name'/>
            </KanbanComboProperty>

            <KanbanTagsProperty bottom a='Tags' 
                                getAllTags={() => allTags}
                                {onUpdateAllTags}
                                canChangeColor/>
        </Kanban>

        <div class="ml-3 mt-20 mb-10">
            <a  href={`#/tasklist/${listId}?archivedTasks`} 
                class="hover:underline">
                    Show archived tasks 
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
            </a>
        </div>
	</Page>
{:else}
	<Spinner delay={3000} />
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