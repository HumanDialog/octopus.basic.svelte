<script>
   
	import { reef, session, signInHRef } from '@humandialog/auth.svelte';
    import {MembersPage, onErrorShowAlert} from '@humandialog/forms.svelte';
	import { onMount } from 'svelte';
	
    let users = []
    onMount( async () =>
    {
        //let result = await reef.get('app/Users')
        let result = await reef.post('group/query',
                            {
                                Id: 1,
                                Name: 'Users',
                                Tree:[
                                    {
                                        Id: 1,
                                        Association: 'Members/User',
                                        Expressions: ['Name', 'login', '$ref', 'href', '$acc']
                                    }
                                ]                    
                            },
                            onErrorShowAlert
                        )
        if(result)
        {
            users = result.User;
        }
        return () => {}
    })

  </script>

<svelte:head>
    <title>Members | {__APP_TITLE__}</title>
</svelte:head>

{#if users && users.length > 0}
  <MembersPage {users} nameAttrib="Name" emailAttrib="login" refAttrib="$ref" hrefAttrib="href" showAccessRoles/>
{/if}