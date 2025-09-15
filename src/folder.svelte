<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert,
				activateItem, UI,
				i18n, ext,
                Breadcrumb,
				breadcrumbAdd} from '@humandialog/forms.svelte'
    import {FaRegFile, FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCalendarCheck, FaRegCalendar, FaPen, FaColumns, FaArchive, FaSync,
        FaList, FaEllipsisH, FaChevronRight, FaChevronLeft, FaRegShareSquare, FaLink, FaUnlink, FaRegStar, FaStar, FaCopy, FaCut} from 'svelte-icons/fa'

        import {FaEdit} from 'svelte-icons/fa'
        import FaHighlighter from 'svelte-icons/fa/FaHighlighter.svelte'

        import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
        import MdContentCut from 'svelte-icons/md/MdContentCut.svelte'

    import {onMount} from 'svelte'
    import {location, pop, push, querystring} from 'svelte-spa-router'
    import BasketPreview from './basket.preview.svelte'
    import FaBasketTrash from './icons/basket.trash.svelte'
    import {cache} from './cache.js'

    export let params = {}

    let contextItem = null;
    let contextPath;
    let contextItemId;
    let subfoldersComponent;
    let notesComponent;
    let tasksComponent;
    let folderTitle = ''

    let prevBreadcrumbPath = ''
    let breadcrumbPath = ''
    
    let users = [];

    const STATE_FINISHED = 7000;

    $: onParamsChanged($location, $querystring, $mainContentPageReloader, $session);

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'folder');
        if(foundIdx < 0)
            return;

        if(!segments.length)
            contextItemId = 1
        else
            contextItemId = parseInt(segments[segments.length-1])


        contextItem = null
        contextPath = `/Folder/${contextItemId}`


        const params = new URLSearchParams($querystring);
        if(params.has("path"))
            prevBreadcrumbPath = params.get("path") ?? ''
        else
            prevBreadcrumbPath = ''

        const cacheKey = `folder_${contextItemId}`
        const cachedValue = cache.get(cacheKey)
        if(cachedValue)
        {
            contextItem = cachedValue;
            folderTitle = ext(contextItem.Title);
            breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, folderTitle, $location)

            subfoldersComponent?.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
            notesComponent?.reload(contextItem, notesComponent.KEEP_SELECTION)
            tasksComponent?.reload(contextItem, tasksComponent.KEEP_SELECTION)
        }

        const readItem = await readContextItem(contextItemId)

        // dodatkowe zabezpiecznie dla przypadku kiedy pokazalismy folder, ale jego wersje z cache'a
        // i wciąż jeszcze czekamy na odpowiedź z serwisu. W międzyczasie user przeszedł do folderu niżej
        // zostajemy więc w tym komponencie, ale zmienił się parametr folderu do załadowania
        // wysyłamy więc nowe zapytanie, a to poprzednie, które wciąż jeszcze trwa, już nas nie interesuje
        if(readItem.Id != contextItemId)
            return;

        contextItem  = readItem
        if(contextItem)
        {
            folderTitle = ext(contextItem.Title);
            breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, folderTitle, $location)
        }

        cache.set(cacheKey, contextItem)

        subfoldersComponent?.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
        notesComponent?.reload(contextItem, notesComponent.KEEP_SELECTION)
        tasksComponent?.reload(contextItem, tasksComponent.KEEP_SELECTION)
    }

    async function readContextItem(contextItemId)
    {
        let res = await reef.post(`/Folder/${contextItemId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id', '$ref','Title','Summary', 'IsPinned', 'IsBasket', 'IsRootPinned'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'IsPinned']

                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Tasks',
                                                //Filter: 'State <> STATE_FINISHED',
                                                Sort: 'Order',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'href']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
        if(res)
        {
            return res.Folder;
        }
        else
            return null;
    }

    async function fetchData()
    {
        contextItem = await readContextItem(contextItemId);
        if(contextItem)
            folderTitle = ext(contextItem.Title);
    }

    /*onMount( () => {
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
        }
    })

    function onKeyDown(e)
    {
        switch(e.key)
        {
        case 'c':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+C')   
                e.stopPropagation()
                e.preventDefault()
            }
            break;  
            
        case 'x':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+X')   
                e.stopPropagation()
                e.preventDefault()
            }
            break;  

        case 'v':
            if(e.ctrlKey || e.metaKey)
            {
                console.log('handle Ctrl+V')   
                e.stopPropagation()
                e.preventDefault()
            }
            break;  
        }
    }
    */

    let deleteModal;
    let objectToDelete;
    let deleteObjectKind = ''
    function askToDelete(object, kind)
    {
        deleteObjectKind = kind;
        objectToDelete = object;
        deleteModal.show()
    }


    async function deleteElement()
    {
        if(!objectToDelete)
            return;

        switch(deleteObjectKind)
        {
        case 'Task':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyTask`, { taskLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
            break;

        case 'Note':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
            break;

        case 'Folder':
            await reef.post(`${contextItem.$ref}/DeletePermanentlyFolder`, { folderLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await fetchData();
            subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
            break;
        }

    }

    async function dettachSubFolder(folder)
    {
        await reef.post(`${contextItem.$ref}/DettachSubFolder`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
    }

    async function dettachNote(note)
    {
        await reef.post(`${contextItem.$ref}/DettachNote`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
    }

    async function dettachTask(task)
    {
        await reef.post(`${contextItem.$ref}/DettachTask`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function copyTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CopyTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutTaskToBasket(task)
    {
        await reef.post(`${contextItem.$ref}/CutTaskToBasket`, { taskLink: task.$ref } , onErrorShowAlert);
        await fetchData();
        tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function copyNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CopyNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutNoteToBasket(note)
    {
        await reef.post(`${contextItem.$ref}/CutNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        await fetchData();
        notesComponent.reload(contextItem, notesComponent.SELECT_NEXT);
    }

    async function copySubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CopySubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        // not needed
        //await fetchData();
        //tasksComponent.reload(contextItem, tasksComponent.SELECT_NEXT);
    }

    async function cutSubFolderToBasket(folder)
    {
        await reef.post(`${contextItem.$ref}/CutSubFolderToBasket`, { folderLink: folder.$ref } , onErrorShowAlert);
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.SELECT_NEXT);
    }

    async function finishTask(event, task)
    {
        if(event)
            event.stopPropagation();

        let result = await reef.post(`${task.$ref}/Finish`, {}, onErrorShowAlert);
        if(result)
        {
            await fetchData();
            tasksComponent.reload(contextItem, tasksComponent.KEEP_OR_SELECT_NEXT);
        }
    }

    async function addTask(newTaskAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateTaskEx`,{ properties: newTaskAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newTask = res.FolderTask;

        await fetchData();
        tasksComponent.reload(contextItem, newTask.Id);
    }

    async function addNote(newNoteAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateNoteEx`,{ properties: newNoteAttribs }, onErrorShowAlert)
        if(!res)
            return null;

        let newNote = res.FolderNote;

        await fetchData();
        notesComponent.reload(contextItem, newNote.Id);
    }

    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post(`${contextPath}/CreateSubFolder`,{ 
            title: newFolderAttribs.Title,
            summary:  newFolderAttribs.Summary,
            order: newFolderAttribs.Order,
            kind: 0
        }, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.FolderFolder;

        await fetchData();
        subfoldersComponent.reload(contextItem, newFolder.Id);
    }

    async function toggleFolderPinned(folder)
    {
        let res = await reef.post(`${folder.$ref}/TogglePinned`, {}, onErrorShowAlert)
        if(res)
        {
            folder.IsPinned = true
        }
        else
        {
            folder.IsPinned = false
        }
    }

    async function changeElementProperty(item, value, propName)
    {
        item[propName] = value

        switch(propName)
        {
        case 'Title':
            await reef.post(`${item.$ref}/SetTitle`, { value: value }, onErrorShowAlert)
            break;

        case 'Summary':
            await reef.post(`${item.$ref}/SetSummary`, { value: value }, onErrorShowAlert)
            break;
        }

    }

    async function dettachAllMyContent()
    {
        await reef.post(`${contextItem.$ref}/DettachAllContent`, {} , onErrorShowAlert)

        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.CLEAR_SELECTION)
        notesComponent.reload(contextItem, notesComponent.CLEAR_SELECTION)
        tasksComponent.reload(contextItem, tasksComponent.CLEAR_SELECTION)
    }

    async function refreshView()
    {
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
        notesComponent.reload(contextItem, notesComponent.KEEP_SELECTION)
        tasksComponent.reload(contextItem, tasksComponent.KEEP_SELECTION)
    }

    function pinOp()
    {
        let pinOperation;
        if(contextItem.IsPinned)
        {
            pinOperation = {
                caption: '_; Unpin folder; Desenganchar la carpeta; Odepnij folder',
                //icon: FaStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleFolderPinned(contextItem);
                    // refreshing operations
                    activateItem('data', contextItem, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                    },
                //fab: 'S00',
                //tbr: 'C',
                //hideToolbarCaption: true
            }
        }
        else
        {
            pinOperation = {
                caption: '_; Pin folder; Fijar carpeta; Przypnij folder',
                //icon: FaRegStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleFolderPinned(contextItem);
                    // refreshing operations
                    activateItem('data', contextItem, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                },
                //fab: 'S00',
                //tbr: 'C',
                //hideToolbarCaption: true
            }
        }
        return pinOperation;
    }

    function basketPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    menu: 'FT',
                    operations: [
                        {
                            caption: '_; Clear Clipboard; Borrar portapapeles; Wyczyść schowek',
                        //    icon: FaBasketTrash, //FaTrash,
                            action: async (f) => await dettachAllMyContent(),
                        //      fab: 'M30',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            //icon: FaSync,
                            action: async (f) => await refreshView(),
                        //    fab: 'S10',
                            //tbr: 'C',
                            hideToolbarCaption: true
                        }
                    ]
                }
            ]
        }
    }

    function newElementOperations(afterElement)
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned

        const canAddFolders = !(isRootPinned || isClipboard)
        const canAddNotes = !(isRootPinned || isClipboard)
        const canAddTasks = !(isRootPinned || isClipboard)

        const newFolder = {
            caption: '_; New folder; Nueva carpeta; Nowy folder',
            icon: FaRegFolder,
            action: (f) => { subfoldersComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M03'
        }

        const newNote = {
            caption: '_; New note; Nueva nota; Nowa notatka',
            icon: FaRegFile,
            action: (f) => { notesComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M02'
        }

        const newTask = {
            caption: '_; New task; Nueva tarea; Nowe zadanie',
            icon: FaRegCalendar,
            action: (f) => { tasksComponent.addRowAfter(afterElement) },
            tbr: 'A',
            fab: 'M01'
        }

        let result = {
            caption: '_; File; Archivo; Plik',
            // tbr: 'B',
            operations: [ ]
        }

        if(canAddFolders)
            result.operations.push(newFolder)

        if(canAddNotes)
            result.operations.push(newNote)

        if(canAddTasks)
            result.operations.push(newTask)

        if(result.operations.length > 0)
            result.operations.push({separator: true})

        
        result.operations.push({
            caption: '_; Add elements from Clipboard; Añadir elementos del portapapeles; Dodaj elementy ze schowka',
            toolbar: BasketPreview,
            props: {
                destinationContainer: contextPath,
                onRefreshView: refreshViewAfterAttachingFromBasket
            },
            //fab: 'M01',
            //tbr: 'A'
        })
        return result
    }

    function  folderPageOperations()
    {
        const isClipboard = contextItem.IsBasket
        const isRootPinned = contextItem.IsRootPinned
        const canPin = !(isRootPinned || isClipboard)
        
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                newElementOperations(null),
                {
                    caption: '_; View; Ver; Widok',
                    //tbr: 'B',
                    operations: [
                        
                        ... !canPin ? [] : [pinOp()],
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            //icon: FaSync,
                            action: async (f) => await refreshView(),
                            //fab: 'S10',
                            //tbr: 'C',
                            //hideToolbarCaption: true
                        }
                    ]
                }

            ]
        }
    }

    function getPageOperations()
    {
        if(!contextItem)
            return [];

        if(contextItem.IsBasket)
            return basketPageOperations();
        else
            return folderPageOperations();

    }

    async function refreshViewAfterAttachingFromBasket(f)
    {
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.CLEAR_SELECTION)
        notesComponent.reload(contextItem, notesComponent.CLEAR_SELECTION)
        tasksComponent.reload(contextItem, tasksComponent.CLEAR_SELECTION)
    }


    function listComponent(kind)
    {
        switch(kind)
        {
        case 'Task':
            return tasksComponent;
        case 'Note':
            return notesComponent;
        case 'Folder':
            return subfoldersComponent;
        }
    }


    async function dettachElement(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return dettachSubFolder(element)
        case 'Note':
            return dettachNote(element)
        case 'Task':
            return dettachTask(element)
        }
    }

    async function copyElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return copySubFolderToBasket(element)
        case 'Note':
            return copyNoteToBasket(element)
        case 'Task':
            return copyTaskToBasket(element)
        }
    }

    async function cutElementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Folder':
            return cutSubFolderToBasket(element)
        case 'Note':
            return cutNoteToBasket(element)
        case 'Task':
            return cutTaskToBasket(element)
        }
    }

    function basketElementOperations(element, kind)
    {
        let list = listComponent(kind);
        return {
                opver: 2,
                fab: 'M00',
                operations: [
                    {
                        caption: kind,
                        operations: [
                            {
                                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                                icon: FaCaretUp,
                                action: (f) => list.moveUp(element),
                                fab:'M05',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                                icon: FaCaretDown,
                                action: (f) => list.moveDown(element),
                                fab:'M04',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                            //    icon: FaTrash,
                                caption: '_; Remove from Clipboard; Eliminar del portapapeles; Usuń ze schowka',
                                action: (f) => dettachElement(element, kind),
                            //    fab:'M30',
                                tbr:'A'
                            }
                        ]
                    }
                ]
            }
    }

    function folderElementOperations(element, kind)
    {
        let list = listComponent(kind);
        return {
                opver: 2,
                fab: 'M00',
                tbr: 'C',
                operations: [
                    newElementOperations(element),
                    {
                        caption: '_; Element; Elemento; Element',

                        //icon: FaPlus,
                        //hideToolbarCaption: true,
                        operations: [
                            {
                                caption: '_; Edit; Editar; Edytuj',
                                icon: FaPen,
                                tbr: 'A',
                                fab:'M20',
                                grid:[
                                    {
                                        caption: '_; Edit Title; Editar título; Edytuj tytuł',
                                        action: (focused) =>  { listComponent(kind).edit(element, 'Title') },
                                        tbr: 'A',

                                    },
                                    {
                                        caption: '_; Edit summary; Editar resumen; Edytuj podsumowanie',
                                        action: (focused) =>  { listComponent(kind).edit(element, 'Summary') }
                                    }
                                ]

                            },
                            {
                                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                                icon: FaCaretUp,
                                action: (f) => list.moveUp(element),
                                fab:'M05',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                                icon: FaCaretDown,
                                action: (f) => list.moveDown(element),
                                fab:'M04',
                                tbr:'A' ,
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Add to Clipboard; Añadir al portapapeles; Dodaj do schowka',
                                icon: FaCopy, //FaCopy,   // MdLibraryAdd
                                action: (f) => copyElementToBasket(element, kind),
                                hideToolbarCaption: true,
                                fab: 'M30',
                                tbr: 'A'

                            },
                            {
                                caption: '_; Move to Clipboard; Mover al portapapeles; Przenieś do schowka',
                                icon: FaCut, //FaCut,
                                action: (f) => cutElementToBasket(element, kind),
                                hideToolbarCaption: true,
                                fab: 'M40',
                                tbr: 'A'
                            },
                            {
                                separator: true
                            },
                            {
                                caption: '_; Detach; Desconectar; Odłącz',
                          //      icon: FaUnlink,
                                action: (f) => dettachElement(element, kind)
                            },
                            {
                                caption: '_; Delete; Eliminar; Usuń',
                             //   icon: FaTrash,
                                action: (f) => askToDelete(element, kind)
                            }
                        ]
                    }
                ]
            }
    }

    

    let elementOperations = (element, kind) => {


        if(contextItem.IsBasket)
        {
            return basketElementOperations(element, kind)
        }
        else
        {
            return folderElementOperations(element, kind)
        }
    }


</script>

<svelte:head>
    {#if contextItem && folderTitle}
        <title>{folderTitle} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>


{#if contextItem}
    {#key contextPath}  <!-- to force new page operations -->
    <Page   self={contextItem}
            toolbarOperations={ getPageOperations() }
            clearsContext='props sel'
            title={folderTitle}>

            <section class="w-full place-self-center max-w-3xl">

            <!--p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {folderTitle}
            </p-->
            

            {#if breadcrumbPath}
                <Breadcrumb class="hidden sm:block mb-5" path={breadcrumbPath} />
            {/if}


            <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                {folderTitle}
            </p>

            <List   self={contextItem}
                    a='Folders'
                    toolbarOperations={(el) => elementOperations(el, 'Folder')}
                    orderAttrib='Order'
                    bind:this={subfoldersComponent}>
                <ListTitle      a='Title'
                                hrefFunc={(folder) => `${folder.href}?path=${breadcrumbPath}`}
                                onChange={changeElementProperty}/>

                <ListSummary    a='Summary'
                                onChange={changeElementProperty}/>

                <ListInserter   action={addFolder} icon/>

                <span slot="left" let:element>
                    <Icon component={FaRegFolder}
                        class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                </span>
            </List>

            <List   self={contextItem}
                    a='Notes'
                    toolbarOperations={ (el) => elementOperations(el, 'Note')}
                    orderAttrib='Order'
                    bind:this={notesComponent}>
                <ListTitle      a='Title'
                                hrefFunc={(note) => `${note.href}?path=${breadcrumbPath}`}
                                onChange={changeElementProperty}/>
                <ListSummary    a='Summary'
                                onChange={changeElementProperty}/>
                <ListInserter action={addNote} icon/>

                <span slot="left" let:element>
                    <Icon component={FaRegFile}
                        class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2  mr-1"/>
                </span>
            </List>

            <List   self={contextItem}
                    a='Tasks'
                    toolbarOperations={(el) => elementOperations(el, 'Task')}
                    orderAttrib='Order'
                    bind:this={tasksComponent}>
                <ListTitle      a='Title'
                                hrefFunc={(task) => `${task.href}?path=${breadcrumbPath}`}
                                onChange={changeElementProperty}/>

                <ListSummary    a='Summary'
                                onChange={changeElementProperty}/>
                <ListInserter action={addTask} icon/>

                <span slot="left" let:element>
                    {#if element.State == STATE_FINISHED}
                        <Icon component={FaRegCalendarCheck}
                        class="h-5 w-5  text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>

                    {:else}
                        <Icon component={FaRegCalendar}
                            on:click={(e) => finishTask(e, element)}
                            class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1 "/>

                    {/if}
                </span>
            </List>

    </section>

    </Page>
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}



<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected folder?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteElement}
        bind:this={deleteModal}
        />
