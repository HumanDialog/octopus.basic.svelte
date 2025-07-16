<script>
    import {reef, session, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
	import {Layout, onErrorShowAlert, Spinner} from '@humandialog/forms.svelte';
    import Sidebar from './sidebar.svelte'

    import SidebarFolders from './sidebar.folders.svelte'
    import SidebarMessages from './sidebar.messages.svelte'
    
    import {push} from 'svelte-spa-router'


    import AppIcon from './appicon.svelte'
    
    import FaFolder from 'svelte-icons/fa/FaFolder.svelte'
    import {FaUsersCog, FaSignOutAlt, FaList, FaComments, FaUser, FaPaste} from 'svelte-icons/fa/'

    import Tasklist from './tasklist.svelte';
    import Folder from './folder.svelte';
    import Task from './task.svelte'
    import Note from './note.svelte'
    import Board from './list.board.svelte';
    import MyTasks from './mytasks.svelte'
    import MyFolders from './myfolders.svelte'
    import Chat from './chat.svelte'
    import Members from './members.svelte'
    import AppMain from './AppMain.svelte'
    import Thread from './thread.svelte'
    import NewThread from './thread.new.svelte'
    import Forum from './forum.svelte'
    import Profile from './profile.svelte'
    

    import {Console} from '@humandialog/forms.svelte'
    import { tick, onMount } from 'svelte';

    const objectreef_io = __OBJECTREEF_IO__
    const appId = __APP_ID__
    const tenantId = __TENANT_ID__
    const proto = __SERVICE_PROTOCOL__
    const octopus_modules = __OCTOPUS_MODULES__

    let layout = null

    $: init($session)

    async function init(...args)
    {
        if(!$session.isActive && !$session.isUnauthorizedGuest)
        {
            const hasStaticContent = canShowStaticContent(octopus_modules)
            if(!hasStaticContent)
            {
                await tick();
                reef.redirectToSignIn();
            }
            else
            {
                layout = defineStaticLayout()
            }
        }
        else
        {
            if($session.isUnauthorizedGuest)
            {
                const hasPublicData = await configurePublicSession();
                if(hasPublicData)
                    layout = defineGuestLayout()
                else
                    layout = null
            }
            else if($session.isActive)
            {
                layout = defineAuthorizedLayout()
            }
        }

    }

    function defineModuleNavigator(module, showStaticOnly=false)
    {
        if(!showStaticOnly)
        {
            switch(module)
            {
            case 'tasklists':
                return {
                    'TOC':{
                        icon: FaList,
                        component: Sidebar
                    }
                }

            case 'folders':
                return {
                    'Folders': {
                        icon: FaFolder,
                        component: SidebarFolders
                    }
                }

            case 'messages':
                return {
                    'Messages': {
                            icon: FaComments,
                            component: SidebarMessages
                        }
                }

            default:
                return { }
            }
        }
        else
        {
            switch(module)
            {
            
            default:
                return { }
            }
        }
    }

    function canShowStaticContent(modules)
    {
        let navigators = {}
        let mods = modules.split(',')
        mods.forEach( module =>
            navigators = {...navigators, ...defineModuleNavigator(module, true)}
        )

        const staticNavigatos = Object.keys(navigators)
        return staticNavigatos.length > 0
    }

    function defineNavigators(modules, showStaticOnly=false)
    {
        let navigators = {}
        let mods = modules.split(',')
        mods.forEach( module =>
            navigators = {...navigators, ...defineModuleNavigator(module, showStaticOnly)}
        )
        return navigators
    }

    function defineAuthorizedLayout()
    {
        return {
                sidebar : defineNavigators(octopus_modules),
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/note' :       { component: Note },
                        '/note/*' :     { component: Note },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/folder'    :  { component: Folder },
                        '/folder/*'  :  { component: Folder },
                        '/myfolders' :  { component: MyFolders },
                        '/myfolders/*': { component: MyFolders },
                        '/members'   :  { component: Members },
                        '/chat/*':      { component: Chat },
                        '/thread/*' :   { component: Thread },
                        '/newthread/*' :{ component: NewThread },
                        '/forum/*'   :  { component: Forum },
                        '/profile/*':   {component: Profile},
                        '/profile':     {component: Profile}
                    }
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                            caption: 'Profile',
                            icon: FaUser,
                            action: (f) => { push('/profile')},
                            condition: () => $session.isActive
                        },
                        {
                            caption: 'Members',
                            icon: FaUsersCog,
                            action: (f) => { push(`/members`) },
                            condition: () => $session.authAccessGroup() != 0
                        },
                        {
                            caption: 'Clipboard',
                            icon: FaPaste,
                            action: (f) => showBasket(),
                            condition: () => $session.isActive
                        }
                    ]
                },
                selectionDetails:{
                    caption: 'Console',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

        }
    }

    function defineGuestLayout()
    {
        return {
                sidebar : {
                    'TOC': {
                        icon: FaList,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*': { component: Board}
                    }
                },
                mainToolbar : {
                    customOperations:[
                        {
                            caption: 'Leave guest session',
                            icon: FaSignOutAlt,
                            action: (f) => {
                                $session.isUnauthorizedGuest = false
                                push('/');
                            }
                        }
                    ]
                },
                selectionDetails:{
                    caption: 'Console',
                    component: Console
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                },
                autoRedirectToSignIn: false
        }
    }

    function defineStaticLayout()
    {
        return {
                sidebar : defineNavigators(octopus_modules, true),
                mainContent : {
                    routes : {
                        '/' :           { component: AppMain}
                        
                        
                    //    '/doc':         {component: StaticDoc},
                    //    '/doc/*':       {component: StaticDoc}
                    }
                },
                mainToolbar : {
                    signin: true,
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

        }
    }

    async function configurePublicSession()
    {
        return false;
        /*
        const lastChosenTenantId = $session.lastChosenTenantId;
        let result = null;
        try {
            const res = await fetch(`${proto}://${tenantId}.${objectreef_io}/json/anyv/app/PublicGroups`, {
                                    method: 'get',
                                    headers:{
                                        'Accept':'application/json',
                                        'X-Reef-Flags': '1'
                                    }})
            if(res.ok)
            {
                result = await res.json();
            }
            else
            {
                const err = await res.text()
                console.error(err)
                onErrorShowAlert(err);
            }
        }
        catch(err)
        {
            console.error(err)
            onErrorShowAlert(err);
        }

        //$session.setCurrentTenantAPI(`${proto}://${tenantId}.${objectreef_io}/`, '')
        //const result = await reef.get(`app/PublicGroups`)
        if(result)
        {
            let groupInfos = []
            result.Group.forEach(g => {
                groupInfos.push({
                    id: `${tenantId}/${g.Id}`,
                    url: `${proto}://${tenantId}.${objectreef_io}/`,
                    name: g.Name,
                    headers: [
                        {
                            key: 'X-Reef-Group-Id',
                            value: `${g.Id}`
                        },
                        {
                            key: 'X-Reef-Flags',
                            value: '1'
                        }
                    ]
                })
            })

            if(groupInfos.length > 0)
            {
                $session.tenants = groupInfos;

                let currentTenant;

                if(lastChosenTenantId)
                {
                    currentTenant = groupInfos.find(t => t.id == lastChosenTenantId)
                    if(!currentTenant)
                        currentTenant = groupInfos[0];
                }
                else
                {
                    currentTenant = groupInfos[0];
                }

                $session.setCurrentTenantAPI(currentTenant.url, currentTenant.id)
                return true;
            }
            else
            {
                return false;
            }
        }
        else
            return false;
        */
    }

    async function showBasket()
    {
        const href = await reef.post('user/BasketFolder/href', {}, onErrorShowAlert)
        if(!href)
            return;

        push(href)
    }

</script>

{#if layout}
    <Layout {layout} />
{:else}
    <Spinner/>
{/if}
