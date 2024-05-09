<script>
   
	import { reef } from '@humandialog/auth.svelte';
    import {MembersPage} from '@humandialog/forms.svelte';
	import { onMount } from 'svelte';
	
    let users = []
    onMount( async () =>
    {
        let result = await reef.get('app/Users')
        if(result)
        {
            users = result.User;
        }
        return () => {}
    })

  </script>

{#if users && users.length > 0}
  <MembersPage {users} nameAttrib="Name" emailAttrib="login" refAttrib="$ref"/>
{/if}