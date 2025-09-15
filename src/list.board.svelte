<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {location, push, link} from 'svelte-spa-router'
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
        mainContentPageReloader,
		KanbanSource,
        Modal,
		KanbanColumnBottom,
        onErrorShowAlert,
        Input,
		showMenu,
        Combo,
		ComboItem,
        UI,
        reloadVisibleTags,
        i18n, ext,
		isDeviceSmallerThan

	} from '@humandialog/forms.svelte';
    import {FaPlus, FaList, FaPen, FaCaretLeft, FaCaretRight, FaTrash, FaArrowsAlt, FaArchive, FaCheck, FaEllipsisH, FaChevronRight,
        FaAngleDown, FaAngleUp, FaColumns, FaRandom, FaChevronLeft, FaCopy, FaRegCalendar, FaCaretUp, FaCaretDown
    } from 'svelte-icons/fa'
    import MoveOperations from './list.board.move.svelte'
	import { tick, onMount } from 'svelte';
    import BasketPreview from './basket.preview.svelte'
    import {cache} from './cache.js'

    export let params = {}

    let currentList = null;

    let listId = 0;
    let listPath = '';

    let users = [];
    let taskStates = [];
    let allTags = ''
    let kanban;
    let definitionChangedTicket = 1
    let usersComboSource;

    const TLK_KANBAN_CHECKLIST = 0
    const TLK_KANBAN_PROCESS = 1
    const TLK_LIST = 2

    $: onParamsChanged($location, $mainContentPageReloader);

	async function onParamsChanged(...args)
    {
        const segments = $location.split('/');

        const foundIdx = segments.findIndex( s => s == 'listboard');
        if(foundIdx < 0)
            return;

        if(users.length == 0)
        {
            //let res = await reef.get('/app/Users')
            reef.post('group/query',
                            {
                                Id: 1,
                                Name: 'Users',
                                Tree:[
                                    {
                                        Id: 1,
                                        Association: 'Members/User'
                                    }
                                ]
                            },
                            onErrorShowAlert
                        ).then( (res) => {
                            if(res)
                            {
                                users = res.User;
                                usersComboSource?.updateObjects(users);
                            }
                        })
        }

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res;
            reloadVisibleTags()
        })

        if(!segments.length)
            listId = 1;
        else
            listId = parseInt(segments[segments.length-1])

        if(isNaN(listId))
            listId = 1

        let prevDef = currentList?.$ref

        const cacheKey = `listboard/${listId}`
        const cachedValue = cache.get(cacheKey)
        prevDef = showCachedDataFirst(cachedValue, prevDef);

        listPath = `/group/Lists/${listId}`;
        const loadedItem = await readContextItem();
        if(loadedItem)
        {
            if(loadedItem.Id != listId)
                return;

            currentList = loadedItem
            if(currentList.GetTaskStates && Array.isArray( currentList.GetTaskStates))
                taskStates = currentList.GetTaskStates
            else
                taskStates = [];
        }


        cache.set(cacheKey, currentList)
        //console.log('loaded new data')

        if(currentList.$ref != prevDef)
        {
            definitionChangedTicket++;
        }
        else
        {
            kanban?.reload(currentList, kanban.KEEP_SELECTION);
        }
    }

    function showCachedDataFirst(cachedValue, prevDef)
    {
        //console.log(cachedValue)
        if(!cachedValue)
            return;

        currentList = cachedValue
        kanban?.reload(currentList, kanban.KEEP_SELECTION);

        if(currentList.GetTaskStates && Array.isArray( currentList.GetTaskStates))
            taskStates = currentList.GetTaskStates
        else
            taskStates = [];

        if(currentList.$ref != prevDef)
            definitionChangedTicket++;

        return currentList.$ref

    }

    async function readContextItem()
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
                                        Expressions:['$ref','Id','Name', 'Kind', 'GetTaskStates','href', '$type'],
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
                            },
                            onErrorShowAlert);
        if(res)
            return res.TaskList;
        else
            return null
    }

    async function fetchData()
    {
        let res = await readContextItem();

        currentList = res;
        if(!currentList)
            return;

        if(currentList.GetTaskStates && Array.isArray( currentList.GetTaskStates))
        {
            taskStates = currentList.GetTaskStates
        }
        else
        {
            taskStates = [];
        }
    }

    async function reload(selectRecommendations)
    {
        await fetchData();
        kanban.reload(currentList, selectRecommendations);
    }


    /*const switchToListOperation = () => {
        if(!currentList)
            return { }

        if(currentList.Kind == TLK_KANBAN_CHECKLIST)
        {
            return {
                icon: FaList,
                right: true,
                action: (f) => switchToList(),
                fab: 'S01',
                tbr: 'C'
            }
        }
        else
            return { }
    }
    */
    function getViewOperationsP()
    {
        return {
                    caption: '_; View; Ver; Widok',

                    operations: [
                        {
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            icon: FaRegCalendar,
                            action: (f) => kanban.add(KanbanColumnBottom, 0),
                            tbr: 'A',
                            fab: 'M01'
                        },
                        {
                            caption: '_; Add tasks from Clipboard; Añadir tareas desde el portapapeles; Dodaj zadania ze schowka',
                            toolbar: BasketPreview,
                            props: {
                                destinationContainer: listPath,
                                onRefreshView: (f) => reload(kanban.KEEP_SELECTION)
                            }
                        },
                        {
                            separator: true
                        },
                        {
                            //icon: FaRandom,
                            caption: '_; Change task list kind; Cambiar tipo de lista de tareas; Zmień rodzaj listy zadań',
                            action: changeListKind,
                        //    fab: 'S02',
                        //    tbr: 'C'
                        },
                        //switchToListOperation()
                    ]
                }
    }

    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                getViewOperationsP()
            ]
        }
    }

    function switchToList()
    {
        reef.post(`${listPath}/SwitchToList`,{  }, onErrorShowAlert)
        push(`/tasklist/${listId}`);
    }

    function getDefaultTypeSummary(list)
    {
        if(!list.TaskStates)
            return '';

        let result = ''
        list.TaskStates.forEach(s => {
            if(result)
                result += ', '
            result += ext(s.name)
        })

        return result
    }

    async function changeListKind(button, aroundRect)
    {
        const listTypes = await reef.get('group/GetTaskListTypes', onErrorShowAlert)
        if(!listTypes || !Array.isArray(listTypes) || listTypes.length == 0)
            return;

        let menuOperations = []
        let prevKind = 0;

        listTypes.forEach(template => {

            //if(prevKind != template.Kind)
            //    menuOperations.push({separator: true})
            //prevKind = template.Kind

            menuOperations.push({
                caption: ext(template.Name),
                description: template.Summary ? ext(template.Summary) : getDefaultTypeSummary(template),
                action: (f) => askToChangeListKind(template)
            })
        })

        if(menuOperations.length > 0)
        {
            let rect;
            if(aroundRect)
                rect = aroundRect
            else
                rect = button.getBoundingClientRect()
            showMenu(rect, menuOperations)
        }
    }

    let changeKindModal;
    let changeListTo = null;
    function askToChangeListKind(template)
    {
        changeListTo = template

        changeKindModal.show();
    }

    async function handleChangeListKind()
    {
        changeKindModal.hide();

        if(!changeListTo)
            return

        let newHref = await reef.post(`${listPath}/ChangeListKind`, {
            template: changeListTo
        }, onErrorShowAlert)

        changeListTo = null

        if(!newHref)
            return null;

        if(!newHref || currentList.href == newHref)
        {
            await fetchData()
            //reload(kanban.KEEP_SELECTION);
            definitionChangedTicket++;
            //await kanban.rerender();
        }
        else
        {
            push(newHref)
            if(UI.navigator)
                UI.navigator.refresh();
        }
    }

    async function onReplace(moveParams)
    {
        let res = await reef.post(`${listPath}/ChangeTaskColumn`, {
            task: moveParams.item.$ref,
            columnNo: moveParams.toColumn
        }, onErrorShowAlert)

        if(!res)
            return null;

        let newTask = res.Task;
        await reload(newTask.Id)
    }

    async function onAdd(newTaskAttribs, columnIdx)
    {
        let res = await reef.post(`${listPath}/CreateTaskInColumn`, {
                properties: newTaskAttribs,
                pos: columnIdx },
                onErrorShowAlert)
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

        await reef.post(`${taskToDelete.$ref}/DeletePermanently`, { } , onErrorShowAlert);
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

        await reef.post(`${taskToArchive.$ref}/Archive`, {}, onErrorShowAlert)
        archiveModal.hide();

        reload(kanban.SELECT_NEXT);
    }

    async function finishTask(task)
    {
        await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        reload(task.Id);
    }


    async function onUpdateAllTags(allAllTags)
    {
        allTags = allAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }


    function getCardOperations(task)
    {
        const columnIdx = taskStates.findIndex(s => s.state == task.State)
        const isOutOfStates = columnIdx < 0
        const mobile = isDeviceSmallerThan("sm")

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    //tbr: 'B',
                    operations:[
                        {
                            caption: '_; New task; Nueva tarea; Nowe zadanie',
                            icon: FaRegCalendar,
                            action: (f) => { kanban.add(task) },
                            fab: "M01",
                            tbr: 'A'
                        },
                        {
                            caption: '_; Add tasks from Clipboard; Añadir tareas desde el portapapele; Dodaj zadania ze schowka',
                            toolbar: BasketPreview,
                            props: {
                                destinationContainer: listPath,
                                onRefreshView: (f) => reload(kanban.KEEP_SELECTION)
                            }
                        },
                        {
                            separator: true
                        },
                        {
                            caption: '_; Change task list kind; Cambiar tipo de lista de tareas; Zmień rodzaj listy zadań',
                            action: changeListKind,
                        },
                    ]
                },
                ... isOutOfStates ? [] : [
                {
                    caption: '_; Column; Columna; Kolumna',
                    //tbr: 'B',
                    operations: getColumnContextMenu(columnIdx, undefined, !mobile)
                }],
                {
                    caption: '_; Task; Tarea; Zadanie',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            tbr: 'A',
                            fab: 'M20',
                            grid: [
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    columns: 2,
                                    action: (f) =>  { kanban.edit(task, 'Title') }
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: (f) =>  { kanban.edit(task, 'Summary') }
                                },
                                {
                                    separator: true
                                },
                                {
                                    caption: '_; Responsible; Responsable; Odpowiedzialny',
                                    action: (f) => { kanban.edit(task, 'Actor') }
                                },
                                {
                                    caption: '_; Due Date; Fecha; Termin',
                                    action: (f) => { kanban.edit(task, 'DueDate') }
                                },
                                {
                                    caption: '_; Tag; Etiqueta; Etykieta',
                                    action: (f) => { kanban.edit(task, 'Tags') }
                                }
                            ]
                        },
                        {
                            caption: '_; Move...; Desplazar...; Przesuń...',
                            icon: FaArrowsAlt,
                            toolbar: MoveOperations,
                            props: {
                                    taskStates: taskStates,
                                    item: task,
                                    afterActionOperation: kanban.scrollViewToCard,
                                 //   onMoveUp: isOutOfStates ? undefined : kanban.moveUp,
                                 //   onMoveDown: isOutOfStates ? undefined : kanban.moveDown,
                                    onReplace: kanban.replace},
                            fab: 'M03',
                            tbr: 'A'
                        },
                        ... (isOutOfStates) ? [] : [
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            icon: FaCaretUp,
                            action: (f) => { kanban.moveUp(task); setTimeout(() => kanban.scrollViewToCard(), 0) },
                            fab: 'M05',
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            icon: FaCaretDown,
                            action: (f) => { kanban.moveDown(task); setTimeout(() => kanban.scrollViewToCard(), 0)},
                            fab: 'M04',
                            tbr: 'A',
                            hideToolbarCaption: true
                        } ],
                        {
                            caption: '_; Add to Clipboard; Añadir al portapapeles; Dodaj do schowka',
                            icon: FaCopy, 
                            action: (f) => copyTaskToBasket(task),
                            fab: 'M30',
                            tbr: 'A', hideToolbarCaption: true

                        },
                        ... (task.State == STATE_FINISHED) ? [] : [
                                {
                                    caption: '_; Finish; Finalizar; Zakończ',
                                    //icon: FaCheck,
                                    action: (f) => finishTask(task),
                                    //fab: 'S20',
                                    //tbr: 'A', hideToolbarCaption: true
                                }
                        ],
                        {
                            caption: '_; Archive; Archivar; Zarchiwizuj',
                            //icon: FaArchive,
                            action: (f) => askToArchive(task)
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(task)
                        }
                    ]
                }
                

            ]

        }

    }

    function getColumnContextMenu(columnIdx, taskState, inColumnContext=true)
    {
        return [
            {
                caption: '_; Edit column name; Editar nombre de columna; Edytuj nazwę kolumny',
                //icon: FaPen, //inColumnContext ? FaPen : undefined,
                action: (f) => kanban.editColumnName(columnIdx)
            },
            /*{
                caption: inColumnContext ? 'Set as finished' : 'Set column as finished',
                icon: inColumnContext ? FaCheck : undefined,
                action: (f) => setColumnAsFinishing(columnIdx)
            },*/
            {
                caption: '_; Move column left; Mueve la columna hacia la izquierda; Przesuń kolumnę w lewo',
                //icon: FaCaretLeft, //inColumnContext ? FaCaretLeft : undefined,
                action: (f) => onColumnMoveLeft(columnIdx)
            },
            {
                caption: '_; Move column right; Mueve la columna hacia la derecha; Przesuń kolumnę w prawo',
                //icon: FaCaretRight, //inColumnContext ? FaCaretRight : undefined,
                action: (f) => onColumnMoveRight(columnIdx)
            },
            {
                caption:  '_; Delete column; Eliminar columna; Usuń kolumnę',
                //icon: FaTrash, //inColumnContext ? FaTrash : undefined,
               // menu: getColumnDeleteOptions(columnIdx, taskState)
               action: (f) => deleteColumnAndSetCardsState(columnIdx, 0)
            },
            {
                separator: true
            },
            {
                caption: '_; Add column; Añadir columna; Dodaj kolumnę',
                //icon: FaPlus, //inColumnContext ? FaPlus : undefined,
                action: (f) => addColumn("", columnIdx+1)
            }
        ];
    }



    function getColumnOperations(columnIdx, taskState)
    {
        const mobile = isDeviceSmallerThan("sm")
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; New Task; Nueva tarea; Nowe zadanie',
                            icon: FaRegCalendar,
                            action: (f) => kanban.add(KanbanColumnBottom, columnIdx),
                            fab: 'M01',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Add tasks from Clipboard; Añadir tareas desde el portapapeles; Dodaj zadania ze schowka',
                            //icon: FaRegClipboard, //FaLink, //aRegShareSquare, //
                            toolbar: BasketPreview,
                            props: {
                                destinationContainer: listPath,
                                onRefreshView: (f) => reload(kanban.KEEP_SELECTION)
                            },
                            //fab: 'M01',
                           // tbr: 'A'
                        },
                        {
                            separator: true
                        },
                        {
                            //icon: FaRandom,
                            caption: '_; Change task list kind; Cambiar tipo de lista de tareas; Zmień rodzaj listy zadań',
                            action: changeListKind,
                        //    fab: 'S02',
                        //    tbr: 'C'
                        },
                        //switchToListOperation()
                    ]
                },
                {
                    caption: 'Column',
                    //tbr: 'B',
                    operations: getColumnContextMenu(columnIdx, taskState, !mobile)
                }
            ]
        }
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

        const res = await reef.post(`${currentList.$ref}/RemoveColumn`, {
                        pos: columnIdx,
                        moveTasksTo: newState
                    }, onErrorShowAlert);

        if(res && Array.isArray(res))
        {
            taskStates = [...res]
            await kanban.rerender();
        }

        //const columnState = taskStates[columnIdx].state;
        //const toColumnIdx = taskStates.findIndex(s => s.state == newState)
        //const tasks = currentList.Tasks.filter(t => t.State == columnState)
        //kanban.moveCardsTo(tasks, toColumnIdx);

        //taskStates.splice(columnIdx, 1);
        //await saveTaskStates();

        //taskStates = [...taskStates]
        //await kanban.rerender();

    }

    async function onColumnNameChanged(columnIdx, name)
    {
        const res = await reef.post(`${currentList.$ref}/ChangeColumnName`, {
                        pos: columnIdx,
                        newName: name
                    }, onErrorShowAlert);

        
        if(res && Array.isArray(res))
        {
            taskStates = [...res]
            await kanban.rerender();
            kanban.activateColumn(columnIdx)
        }

        //taskStates[columnIdx].name = name;
        //await saveTaskStates();
    }

    async function onColumnMoveLeft(columnIdx)
    {
        if(columnIdx <= 0)
            return;

        const res = await reef.post(`${currentList.$ref}/MoveColumn`, {
                        pos: columnIdx,
                        shift: -1
                    }, onErrorShowAlert);

        if(res && Array.isArray(res))
        {
            taskStates = [...res]
            await kanban.rerender();
            kanban.activateColumn(columnIdx-1)
        }
    }

    async function onColumnMoveRight(columnIdx)
    {
        if(columnIdx >= taskStates.length-1)
            return;

        const res = await reef.post(`${currentList.$ref}/MoveColumn`, {
                        pos: columnIdx,
                        shift: 1
                    }, onErrorShowAlert);

        if(res && Array.isArray(res))
        {
            taskStates = [...res]
            await kanban.rerender();
            kanban.activateColumn(columnIdx+1)
        }
    }

    async function copyTaskToBasket(task)
    {
        await reef.post(`${task.$ref}/CopyToBasket`, { } , onErrorShowAlert);
    }

    const STATE_FINISHED = 7000
    /*async function setColumnAsFinishing(columnIdx)
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
    }*/

    async function addColumn(name, idx=-1)
    {
        if(idx < 0)
            idx = 0

        if(currentList && currentList.Kind == TLK_KANBAN_PROCESS)
        {
            await addProcessColumn(idx);
        }
        else
        {

            const res = await reef.post(`${currentList.$ref}/AddColumn`, {
                            pos: idx,
                            state: 0,
                            name: ""
                        }, onErrorShowAlert);


            if(res && Array.isArray(res))
            {
                taskStates = [...res]
                await kanban.rerender();

                kanban.activateColumn(idx)
                //kanban.editColumnName(idx);
            }
        }
    }

    /*
    async function saveTaskStates()
    {
        currentList.TaskStates = JSON.stringify(taskStates);

        await reef.post(`${listPath}/set`,
                    {
                        TaskStates: currentList.TaskStates
                    },
                    onErrorShowAlert);
    }
    */


    let addColumnDialog;
    let newColumnProps = {
        name: '_; New column; Nueva columna; Nowa kolumna',
        state: 0
    }
    let newColumnStates = []
    let newColumnPos = 0
    let numericStateElement;
    let stateValueVisible = false;

    async function addProcessColumn(pos)
    {
        newColumnPos = pos;
        if(!newColumnStates.length)
        {
            newColumnStates = await reef.get(`group/GetPredefinedTaskStates`, onErrorShowAlert)
            await tick();
        }

        addColumnDialog.show();

    }

    async function onNewProcessColumnRequested()
    {
        addColumnDialog.hide();

        let newState
        if (typeof newColumnProps.state === 'string' || newColumnProps.state instanceof String)
            newState = parseInt(newColumnProps.state)
        else
            newState = newColumnProps.state

        const res = await reef.post(`${currentList.$ref}/AddColumn`, {
                            pos: newColumnPos,
                            state: newState,
                            name: newColumnProps.name
                        }, onErrorShowAlert);

        newColumnProps.name = '_; New column; Nueva columna; Nowa kolumna'
        newColumnProps.state = 0

        if(res && Array.isArray(res))
        {
            taskStates = [...res]
            await kanban.rerender();

            kanban.activateColumn(idx)
            //kanban.editColumnName(idx);
        }
        else
        {
            // ?
        }
    }

    function onNewProcessColumnCanceled()
    {
        addColumnDialog.hide();
        newColumnProps.name = '_; New column; Nueva columna; Nowa kolumna'
        newColumnProps.state = 0
    }

    function onNewColumnStateSelected(state, name)
    {
        numericStateElement?.refresh();
    }

    let otherCaption = '_; <Other>; <Otros>; <Inne>'

</script>

<svelte:head>
    {#if currentList && currentList.Name}
        <title>{ext(currentList.Name)} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#key definitionChangedTicket}
{#if currentList}
	<Page
		self={currentList}
		toolbarOperations={getPageOperations()}
		clearsContext="props sel"
		title={ext(currentList.Name)}
	>

		<Kanban class="grow-0"
                title={ext(currentList.Name)}
                bind:this={kanban}>

            <KanbanSource self={currentList}
                          a='Tasks'
                          stateAttrib='State'
                          orderAttrib='ListOrder'/>


                {#each taskStates as taskState, columnIdx (taskState.name+taskState.state)}
                    <KanbanColumn   title={ext(taskState.name)}
                                    state={taskState.state}
                                    operations={getColumnOperations(columnIdx, taskState)}
                                    onTitleChanged={(title) => onColumnNameChanged(columnIdx, title)}
                                    finishing={taskState.state == STATE_FINISHED}/>
                {/each}


            <KanbanColumn   title={otherCaption}
                            state={-1} />


			<KanbanCallbacks {onAdd} {getCardOperations} {onReplace}/>

			<KanbanTitle    a="Title"
                            hrefFunc={(task) => `/task/${task.Id}`}
                            hasAttachment={(task) => task.Description || (task.Steps && task.Steps.length > 0) || task.AttachedFiles }/>
			<KanbanSummary a="Summary" />

            <KanbanStaticProperty top a='Index'/>
            <KanbanDateProperty top a='DueDate'/>

            <KanbanComboProperty middle a='Actor' association>
                <ComboSource objects={users} key="$ref" name='Name' bind:this={usersComboSource}/>
            </KanbanComboProperty>

            <KanbanTagsProperty bottom a='Tags'
                                getAllTags={() => allTags}
                                {onUpdateAllTags}
                                canChangeColor/>
        </Kanban>

        <div class="ml-3 mt-20 mb-10">
            <a  href={`/tasklist/${listId}?archivedTasks`}
                use:link
                class="hover:underline">
                    _; Show archived tasks; Mostrar tareas archivadas; Pokaż zarchiwizowane zadania
                    <div class="inline-block mt-1.5 w-3 h-3"><FaChevronRight/></div>
            </a>
        </div>
	</Page>

{:else}
	<Spinner delay={3000} />
{/if}
{/key}

<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected task?", "¿Está seguro de que desea eliminar la tarea seleccionada?", "Czy na pewno chcesz usunąć wybrane zadanie?"])}
        icon={FaTrash}
        onOkCallback={deleteTask}
        bind:this={deleteModal}
        />

<Modal  title={i18n(['Archive', 'Archivar', 'Zarchiwizuj'])}
        content={i18n(["Are you sure you want to archive selected task?", "¿Está seguro de que desea archivar la tarea seleccionada?", "Czy na pewno chcesz zarchiwizować wybrane zadanie?"])}
        icon={FaArchive}
        onOkCallback={archiveTask}
        bind:this={archiveModal}
        />

<Modal  title={i18n(['Change list kind', 'Cambiar tipo de lista', 'Zmień rodzaj listy'])}
        content={i18n(["Are you sure you want to change current list kind?", "¿Estás seguro de que deseas cambiar el tipo de lista actual?", "Czy na pewno chcesz zmienić aktualny rodzaj listy?"])}
        icon={FaRandom}
        onOkCallback={handleChangeListKind}
        okCaption={i18n(['Change', 'Cambiar', 'Zmień'])}
        bind:this={changeKindModal}
        />

{#key newColumnStates}
<Modal  title={i18n(['Add column', 'Añadir columna', 'Dodaj kolumnę'])}
        okCaption={i18n(['Add', 'Añadir', 'Dodaj'])}
        onOkCallback={onNewProcessColumnRequested}
        onCancelCallback={onNewProcessColumnCanceled}
        icon={FaColumns}
        bind:this={addColumnDialog}>

    <Input  label={i18n(['Name', 'Nombre', 'Nazwa'])}
        placeholder=''
        self={newColumnProps}
        a="name"/>

    <section class="mt-2 grid grid-cols-2 gap-2">
        <Combo label={i18n(['State', 'Estado', 'Stan'])}
                self={newColumnProps}
                a='state'
                changed={onNewColumnStateSelected}>

            {#each newColumnStates as column}
                <ComboItem key={column.state} name={ext(column.name)}/>
            {/each}
        </Combo>

        <div class="col-span-1 flex flex-row">
            <button class="mt-6 w-3 h-3 mr-2" on:click={() => stateValueVisible = !stateValueVisible}>
                {#if stateValueVisible}
                    <FaChevronLeft/>
                {:else}
                    <FaChevronRight/>
                {/if}

            </button>

            {#if stateValueVisible}
                <Input class="inline-block"
                    label={i18n(['State value', 'Valor del estado', 'Wartość stanu'])}
                    placeholder=''
                    self={newColumnProps}
                    a="state"
                    bind:this={numericStateElement}/>
            {/if}
        </div>

    </section>

</Modal>
{/key}