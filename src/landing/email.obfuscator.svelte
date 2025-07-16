<script>
    export let email;

    const groupLettersNo = 5;
    const groupsNo = email.length / groupLettersNo + 1; 
    
    let groups = []
    for(let i=0; i<groupsNo; i++)
    {
        const fromIdx = i * groupLettersNo;
        const toIdx = fromIdx + groupLettersNo;
        groups.push( email.substring(fromIdx, toIdx) );
    }

    console.log(groups)
    
</script>


{#each groups as group}
    <span>
        {#each Array.from(group) as ch}
            <span>{ch}</span><!--
         --><span style:display="none">H</span><!--
        -->{/each}<!--
    --></span>
{/each}
