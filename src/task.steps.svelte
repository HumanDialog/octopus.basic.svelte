<script lang="ts">
    import {editable} from '@humandialog/forms.svelte'
    import {tick} from 'svelte'
    import Inserter from './task.steps.inserter.svelte'
    
    export let steps: object[];
    export let a :string = ''
    export let checkedAttribute: string = ''
    export let onRemove: any;    // onRemove(idx)
    export let onAdd: any;       // onAdd(txt: string, before_idx: number|undefined)
    export let onChange: any;    // onChange(txt: string idx: number)
    export let onSelect: any;    // onSelect(idx: number)
    export let onUnselect: any   // onUnselect(idx: number)

    export const END_OF_LIST = -2

    export async function run(idx = END_OF_LIST, inserterInitialTxt = '', onStop = undefined)
    {
        showInserterAfter = idx;

        await tick();

        if(!inserter)
            return;

        inserter.run(async (detail) => {
            const prev_showInserterAfter = showInserterAfter;
            showInserterAfter = -1;

            if(onStop)
                onStop();

            if(detail.cancel)
            {
                
            }
            else  
            {
                if(detail.incremental)
                {
                    await tick();
                    
                    if(prev_showInserterAfter == END_OF_LIST)
                        run(END_OF_LIST);
                    else
                        run(prev_showInserterAfter+1)
                }
            }
        },
        inserterInitialTxt);
    }
    
    let showInserterAfter: number = -1;
    
    let inserter;

    async function onStepEnter(e, idx)
    {
        if(!e.detail.incremental)
            return;

        const sel = window.getSelection();
        if(isRangeSelected(sel))
            return;

        
        let step = steps[idx];
        let inserterInitialTxt: string = ''
        if(sel?.focusNode)
        {
            let stepPart = step[a].substring(0, sel?.focusOffset);    
            inserterInitialTxt = step[a].substring(sel.focusOffset)
            if(step[a] != stepPart)
            {
                step[a] = stepPart
                onChange(stepPart, idx);
            }
        }

        run(idx, inserterInitialTxt);
    }

    function isRangeSelected(sel: Selection) :boolean
    {
        if(sel.rangeCount == 0)
            return false;

        if(sel.rangeCount > 1)
            return true;

        if(sel.anchorNode !== sel.focusNode)
            return true;

        if(sel.anchorOffset != sel.focusOffset)
            return true;

        return false;
    }

    function isFinished(step)
    {
        if(checkedAttribute)
            return step[checkedAttribute]
        else
            return false;
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

<ul class="mt-1 mb-6">
    {#each steps as step, idx (step[a])}
        {@const finished = isFinished(step) ? "line-through" : ""}
        <li class="mt-0 mb-0 {finished} editable focus:outline-none neglect-brs"
            use:editable={{
                action: (text) => onChange(text, idx),
                remove: () => onRemove(idx),
                active: true}}
            on:finish={async (e) => { await onStepEnter(e, idx) } }
            on:focus={(e) => onSelect(idx)}
            on:blur={(e) => onUnselect(idx)}
            tabindex="0">
            {step[a]}
        </li>
        {#if idx == showInserterAfter}
            <Inserter   bind:this={inserter} 
                        onInsert={async (text) => {await onAdd(text, idx+1)}}/>
        {/if}
    {/each}
    {#if showInserterAfter == END_OF_LIST}
        <Inserter   bind:this={inserter} 
                    onInsert={async (text) => {await onAdd(text, undefined)}}/>
    {/if}
</ul>

<style>
    
    /*  firefox puts <br> into conenteditable element when 'space' is pressed 
        quick solution is to not render those <br>s
    ul li br 
    {
        display:none;
    }*/

    :global(.neglect-brs br)
    {
        display: none;
    }

</style>