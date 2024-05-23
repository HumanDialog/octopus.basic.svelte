<script>
    import {reef} from '@humandialog/auth.svelte'
	import  {RichEdit, 
            Page,
            Combo,
            ComboSource,
            ComboItem,
            DatePicker,
            Tags,
            editable,
			saveCurrentEditable,
			activateItem,
			isActive,
			clearActiveItem,
			isDeviceSmallerThan
            } from '@humandialog/forms.svelte'
	import { onMount, tick } from 'svelte';
    import {location, querystring} from 'svelte-spa-router'
    import TaskSteps from './task.steps.svelte'
    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave} from 'svelte-icons/fa/'

    let taskRef = ''
    let task = null;
    let allTags = '';
    let allLists = [];
    let allActors = [];
    let availableStates = [];

    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'task');
        if(foundIdx < 0)
            return;

        const taskId = segments[segments.length-1]
        taskRef = `./Task/${taskId}`

        allTags = await reef.get('/app/AllTags');

        let res = await reef.get('/app/Lists?fields=$ref,Name')
        allLists = res.TaskList

        res = await reef.get('/app/Users?fields=$ref,Name')
        allActors = res.User;

        await reloadData();
    }

    async function reloadData()
    {
        if(!taskRef)
            return;
        
        let res = await reef.post(`${taskRef}/query`, 
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 3,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:['Id', 'Index', 'Title','Summary', 'Description', 'DueDate', 'Tags', 'State', '$ref', '$type'],
                                    SubTree:[
                                        {
                                            Id: 10,
                                            Association: 'Steps',
                                            Sort: 'Order',
                                        },
                                        {
                                            Id: 11,
                                            Association: 'Actor',
                                            Expressions:['$ref', 'Name']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'TaskList',
                                            Expressions:['$ref', 'Name', 'TaskStates']
                                        }
                                    ]
                                }
                            ]
                        })
        
        task = res.Task
        if(task.TaskList.TaskStates)
        {
            try{
                availableStates = JSON.parse(task.TaskList.TaskStates);
                availableStates.forEach( e => {
                    if(e.state == 1000)
                        e.icon = FaCheck;
                    else
                        e.icon = null;
                })
            }
            catch(e)
            {
                availableStates = [];
            }
        }
    }

    async function onTitleChanged(text)
    {
        task.Title = text;
        await reef.post(`${taskRef}/set`, {Title: text})
    }

    async function onSummaryChanged(text)
    {
        task.Summary = text;
        await reef.post(`${taskRef}/set`, {Summary: text})
        
    }

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('app/set', { AllTags: allTags})
    }

    async function onAddStep(txt, beforeIdx)
    {
        if(task.Steps == undefined)
            task.Steps = []

        if(beforeIdx >= task.Steps.length)
            beforeIdx = undefined;

        const newStep = {
                Label: txt,
                Done: false,
                Order: 0}

        if(beforeIdx == undefined)
        {
            let maxOrder = 0;
            task.Steps.forEach(s => {
                if(s.Order > maxOrder)
                    maxOrder = s.Order;});
            
            newStep.Order = maxOrder + 64;
        }
        else
        {
            const next = task.Steps[beforeIdx]
            if(beforeIdx > 0)
            {
                const prev = task.Steps[beforeIdx-1]
                const orderSpace = next.Order - prev.Order;
                newStep.Order = prev.Order + Math.floor(orderSpace / 2)
            }
            else
                newStep.Order = next.Order - 64;
        }

        await reef.post(`${taskRef}/Steps/new`, {...newStep})
        await reloadData();
    }

    async function onChangeStep(txt, idx)
    {
        const taskStep = task.Steps[idx];
        taskStep.Label = txt;
        await reef.post(`${taskRef}/Steps/${taskStep.Id}/set`, { Label: txt}) 
    }

    async function onRemoveStep(idx)
    {
        const taskStep = task.Steps[idx];
        await reef.delete(`${taskRef}/Steps/${taskStep.Id}`) 
        await reloadData();
    }

    async function setStepDone(value, taskStep)
    {
        taskStep.Done = value;
        task.Steps = [...task.Steps]
        await reef.post(`${taskRef}/Steps/${taskStep.Id}/set`, {Done: value})
    }

    function getPageOperationsWithStepTools(step) 
    {
        let operations = [ 
            {
                icon: FaPlus,
                caption: '',
                grid: addOperations
            }
        ];

        if(!isDeviceSmallerThan('sm'))
        {
            operations.push({
                icon: FaSave,
                action: (f) => saveCurrentEditable()
            })
        }

        if(step.Done)
        {
            operations.push(
                {
                    icon: FaUndo,
                    action: async (f) => 
                    {  
                        await setStepDone( false, step)
                        activateItem('props', step, getPageOperationsWithStepTools(step))
                    }
                }
            )
        }
        else
        {
            operations.push(
                {
                    icon: FaCheck,
                    action: async (f) => 
                    {  
                        await setStepDone( true, step)
                        activateItem('props', step, getPageOperationsWithStepTools(step))
                    }
                }
            )
        }

        return operations
    }
    function onSelectStep(idx)
    {
        let step = task.Steps[idx];
        activateItem('props', step, getPageOperationsWithStepTools(step))
    }

    function onUnselectStep(idx)
    {
        let step = task.Steps[idx];
        if(isActive('props', step))
            clearActiveItem('props')
    }

    let summary;
    let summaryPlaceholder = false;
    
    let dueDate;
    let dueDatePlaceholder = false

    let onList;
    let onListPlaceholder = false

    let responsible;
    let responsiblePlaceholder = false

    let tags;
    let tagsPlaceholder = false

    let steps;
    let stepsPlaceholder = false;

    let description;
    let descriptionPlaceholder = false;
    
    let addOperations = [
        {
            caption: 'Summary',
            action: async (f) => 
                { 
                    if(summary)
                        summary.focus();
                    else
                    {
                        summaryPlaceholder = true;
                        await tick();
                        summary?.focus();
                    }
                }
        },
        {
            caption: 'List',
            action: async (f) => 
                {
                    if(onList)
                        onList.show();
                    else
                    {
                        onListPlaceholder = true;
                        await tick();
                        onList?.show(undefined, () => {onListPlaceholder = false})
                    }
                }
        },
        {
            caption: 'Due Date',
            icon: FaCalendarAlt,
            action: async (f) => 
                {
                    if(dueDate)
                        dueDate.show();
                    else
                    {
                        dueDatePlaceholder = true;
                        await tick();
                        dueDate?.show(undefined, () => {dueDatePlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: 'Responsible',
            icon: FaUser,
            action: async (f) => 
                {
                    if(responsible)
                        responsible.show();
                    else
                    {
                        responsiblePlaceholder = true;
                        await tick();
                        responsible?.show(undefined, () => {responsiblePlaceholder = false})
                    }
                }
        },
        
        {
            caption: 'Tag',
            icon: FaTag,
            action: async (f) => 
                {
                    if(tags)
                        tags.show();
                    else
                    {
                        tagsPlaceholder = true;
                        await tick();
                        tags?.show(undefined, () => {tagsPlaceholder = false})
                    }
                }
        },
        {
            caption: 'Step',
            icon: FaCheck,
            action: async (f) => 
                {
                    if(steps)
                        steps.run();
                    else
                    {
                        stepsPlaceholder = true;
                        
                        if(task.Steps == undefined)
                            task.Steps = []

                        await tick();
                        steps?.run(steps.END_OF_LIST, '', () => {stepsPlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: 'Description',
            icon: FaAlignLeft,
            action: async (f) => 
                {
                    if(description)
                        description.run();
                    else
                    {
                        descriptionPlaceholder = true;
                        await tick();
                        description?.run(() => {descriptionPlaceholder = false})
                    }
                }
        }
    ];
    
    function getPageOperations()
    {
        let operations = [
            {
                icon: FaPlus,
                grid: addOperations 
            }
        ]

        if(!isDeviceSmallerThan('sm'))
        {
            operations.push({
                icon: FaSave,
                action: (f) => saveCurrentEditable()
            })
        }

        return operations;
    }
    

    function getPageOperationsWithFormattingTools() 
    {
        const mobile = isDeviceSmallerThan("sm")
        if(mobile)
        {
            return [
                /*{
                    icon: FaFont,
                    //aboveKeyboard: true,
                    menu: description.getFormattingOperations(true)
                }*/
            ]
        }
        else
        {
            const addOperation = {
                icon: FaPlus,
                caption: '',
                grid: addOperations
            };

            const saveOperation = {
                icon: FaSave,
                action: (f) => { description?.save() }
            }

            const separator = {
                separator: true
            }

            let formattingOperations = description.getFormattingOperations();
            if(!isDeviceSmallerThan('sm'))
                formattingOperations = [saveOperation, ...formattingOperations]

            let operations = [addOperation,  separator, ...formattingOperations]
            return operations
        }
    }

    const descriptionActive = { }
    function activateFormattingTools(e)
    {
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded(e)
    {
        if(isActive('props', descriptionActive))
            clearActiveItem('props')
    }

</script>

{#if task != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={task} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={task.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert">
            <section class="not-prose h-6 w-full flex flex-row justify-between mb-10">
                    <p class="text-base sm:text-xs mt-1 sm:mt-2">
                        {task.Index}
                    </p>
                    <div>
                        {#if task.TaskList || onListPlaceholder}
                            <Combo  compact={true} 
                                    inContext='data'
                                    a='TaskList'
                                    isAssociation
                                    icon={false}
                                    placeholder='List'
                                    s='sm'
                                    bind:this={onList}>
                                <ComboSource    objects={allLists} 
                                                key="$ref" 
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div>
                    <div>
                        {#if task.DueDate || dueDatePlaceholder}
                            <DatePicker     a='DueDate'
                                            compact={true}
                                            s="sm"
                                            inContext="data"
                                            bind:this={dueDate}
                                />
                        {/if}
                    </div>
            </section>

            <h1     class="font-normal text-4xl"
                    use:editable={{
                        action: (text) => onTitleChanged(text), 
                        active: true}}
                        tabindex="0">
                {task.Title}
            </h1>
            
            {#if task.Actor || responsiblePlaceholder || task.Tags || tagsPlaceholder}
                <section class="not-prose h-6 w-full flex flex-row justify-between">
                    <div class="grow-0">
                        {#if task.Actor || responsiblePlaceholder}
                            <Combo  compact={true} 
                                    inContext='data'
                                    a='Actor'
                                    isAssociation
                                    icon={false}
                                    placeholder='Responsible'
                                    s='sm'
                                    bind:this={responsible}>
                                <ComboSource    objects={allActors}
                                                key="$ref" 
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div>

                    <div>
                        {#if availableStates && availableStates.length > 0}
                            <Combo  compact={true} 
                                    inContext='data'
                                    a='State'
                                    icon
                                    placeholder='State'
                                    s='sm'>
                                <ComboSource    objects={availableStates}
                                                key="state" 
                                                name="name"
                                                icon="icon"/>
                            </Combo>
                        {/if}
                    </div>
                
                    <div>
                        {#if task.Tags || tagsPlaceholder}
                            <Tags class=""
                                a='Tags'
                                getGlobalTags={() => allTags}
                                {onUpdateAllTags}
                                canChangeColor
                                bind:this={tags}/>
                        {/if}
                    </div>
                </section>
            {/if}
            
            {#if task.Summary || summaryPlaceholder}
                {#key task.Summary}
                    <p  class="mb-1" 
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            active: true}}
                        tabindex="0"
                        bind:this={summary}>
                        {task.Summary}
                    </p>
                {/key}
                
            {/if}
            
            {#if (task.Steps && task.Steps.length > 0) || stepsPlaceholder}
                <TaskSteps steps={task.Steps}
                                a='Label'
                                checkedAttribute='Done'
                                onRemove={onRemoveStep}
                                onAdd={onAddStep}
                                onChange={onChangeStep}
                                onSelect={onSelectStep}
                                onUnselect={onUnselectStep}
                                bind:this={steps}/>
            {/if}
                
            {#if task.Description || descriptionPlaceholder}
                <RichEdit   a='Description'
                            compact={true}
                            bind:this={description}
                            on:focus={activateFormattingTools}
                            on:blur={deactivateFormattingToolsIfNeeded}/>

            {/if}

        </article>
    </section>
</Page>
{/if}

