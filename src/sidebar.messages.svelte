<script>
    import {Sidebar, SidebarBrand} from '@humandialog/forms.svelte'
	import MessagesNavigator from "./navigator.messages.svelte";
    import {session} from '@humandialog/auth.svelte'
  
</script>
  
<Sidebar>
    <SidebarBrand class="hidden sm:block" >
        Octopus <span class="font-thin">basic</span>
        
        <!--span   slot="summary" 
                class="text-xs pl-2.5 font-semibold text-stone-600 dark:text-stone-300"
                class:hidden={!current_group_name}>
            {current_group_name}
        </span-->    
        
    </SidebarBrand>
    
    <MessagesNavigator sidebar/>

</Sidebar>



    
