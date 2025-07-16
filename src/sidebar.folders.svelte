<script>
       import {Sidebar, 
                SidebarBrand,
                SidebarGroup, 
                SidebarList, 
                SidebarItem} from '@humandialog/forms.svelte'
    import GroupFoldersNavigator from "./navigator.group.folders.svelte";
    import {session} from '@humandialog/auth.svelte'

    /*let current_group_name = ""
    $: validate_group_name($session)

    function validate_group_name(...args)
    {
        const gid = $session.tid;       // current tenant id
        const tInfo = $session.tenants.find(t => t.id == gid)
        if(tInfo)
            current_group_name = tInfo.name;
    }
    */
    
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
    
        
    <GroupFoldersNavigator sidebar/>
    

</Sidebar>



    
