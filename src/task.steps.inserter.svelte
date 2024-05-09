<script>
    import {editable, startEditing} from '@humandialog/forms.svelte'
    
    export let onInsert;
    export function run(onClose, initialText='')
    {
        text = initialText;
        startEditing(insertionParagraph, onClose)
    }

    let insertionParagraph;
    let text;


</script>

<li class="mt-0 mb-0 inserter neglect-brs"
    bind:this={insertionParagraph}
    use:editable={onInsert}>
    {text}
</li>

<style>
    
    /*  firefox puts <br> into conenteditable element when 'space' is pressed 
        quick solution is to not render those <br>s 
    br 
    {
        display:none;
    }
    */
    
</style>