<script>
    import {FaBars, FaUsers} from 'svelte-icons/fa'
    import MyTasks from './mytasks.svelte'
    import TaskList from './tasklist.svelte'
    import Sidebar from './sidebar.svelte'  
    import {Layout, Console} from '@humandialog/forms.svelte'
    import {reef, session} from '@humandialog/auth.svelte'
    import Members from './members.svelte'
    import {push} from 'svelte-spa-router'
    import AppIcon from './appicon.svelte'
    import Task from './task.svelte'
    import Board from './list.board.svelte'
    import Main from './main.svelte'
    
    reef.configure( {
                    mode: 'local',
                    remote: {
                        iss :       "https://objectreef.io",
                        clientID : "<USE_YOUR_REGISTERED_CLIENT_ID>",
                        clientSecret : "USE_YOUR_REGISTERED_CLIENT_SECRET",
                        scope :     "openid profile email <USE_YOUR_DEPLOYED_APP_ID>",
                        apiVersion: "v001"},
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        users:
                        [
                            "alice@example.com",
                            "bob@example.com"
                        ],
                        apiVersion: "v001"}
                   });


    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: AppIcon,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Main},
                        '/tasklist':    { component: TaskList},
                        '/tasklist/*':  { component: TaskList},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*' :  { component: Board},
                        '/members'   :  { component: Members }
                    }
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                            caption: 'Members',
                            icon: FaUsers,
                            condition: () => ($session.authAccessGroup() & 0x1) != 0,
                            action: (focused) => { push('/members') }
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
                    default: false
                },
                operations:
                {
                    optional: false,
                    default: true
                }
    }

    
</script>


<Layout {layout} />

      