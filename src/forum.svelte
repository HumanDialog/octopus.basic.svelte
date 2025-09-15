<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner, 
                Page, 
                Icon, 
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListTags,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert,
				activateItem, UI,
				showFloatingToolbar,
                reloadVisibleTags,
				ListStaticProperty,
                getNiceStringDateTime,
                getNiceStringDate,
                Paginator, i18n, ext,
                Breadcrumb,
				breadcrumbAdd
            } from '@humandialog/forms.svelte'
    import {FaSync, FaComments, FaComment} from 'svelte-icons/fa'
    import {location, pop, push, querystring} from 'svelte-spa-router'
    
    import FaPostPlus from './icons/post.plus.svelte'
    import {cache} from './cache.js'
	
    export let params = {}

    let contextItem = null;
    let contextPath;
    let contextItemId;
    let subfoldersComponent;
    let notesComponent;
    let folderTitle = ''
    let isRootFolder = false
    let allTags = ''
    let pageNo = 0
    let allPagesNo = 1
    let pageElementsNo = 25

    let prevBreadcrumbPath = ''
    let breadcrumbPath = ''
    
    $: onParamsChanged($location, $querystring, $mainContentPageReloader);
    
    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'forum');
        if(foundIdx < 0)
            return;
        
        
        if(!segments.length)
            contextItemId = 1
        else
            contextItemId = parseInt(segments[segments.length-1])
        
        
        contextItem = null
        contextPath = `/Folder/${contextItemId}` 

        const params = new URLSearchParams($querystring);
        if(params.has("page"))
            pageNo = parseInt(params.get("page"))
        else
            pageNo = 0

        if(params.has("path"))
            prevBreadcrumbPath = params.get("path") ?? ''
        else
            prevBreadcrumbPath = ''
     
        const cacheKey = `forum_${contextItemId}`
        const cachedValue = cache.get(cacheKey)
        if(cachedValue)
        {
            contextItem = cachedValue;
            folderTitle = ext(contextItem.Title);

            breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, folderTitle, $location)

            subfoldersComponent?.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
            notesComponent?.reload(contextItem, notesComponent.KEEP_SELECTION)
        }

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res;
            reloadVisibleTags()
        })
           
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
            isRootFolder = !!contextItem.IsRoot

            breadcrumbPath = breadcrumbAdd(prevBreadcrumbPath, folderTitle, $location)

            const allElementsNo = contextItem.NotesCount + contextItem.FoldersCount
            allPagesNo = Math.floor(allElementsNo / pageElementsNo)
            if(allElementsNo % pageElementsNo)
                allPagesNo += 1

           pageNo = Math.max(0, Math.min(pageNo, allPagesNo-1))

            paginatorTop?.updatePageNo(pageNo)
            paginatorTop?.updateAllPagesNo(allPagesNo)
            paginatorBtt?.updatePageNo(pageNo)
            paginatorBtt?.updateAllPagesNo(allPagesNo)

        }

        cache.set(cacheKey, contextItem)

        subfoldersComponent?.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
        notesComponent?.reload(contextItem, notesComponent.KEEP_SELECTION)
    }

    async function readContextItem(contextItemId) 
    {
        if(pageNo < 0)
            pageNo = 0
        const pageOffset = pageNo * pageElementsNo
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
                                        Expressions:['Id', '$ref','Title','Summary', 'IsPinned', 'IsRoot', 'href', 'icon', 'FoldersCount', 'NotesCount'],
                                        SubTreeOffset: pageOffset,
                                        SubTreeLimit: pageElementsNo,
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                Sort: 'Order',
                                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'IsPinned', 'GetLastForumActivity']
                                                
                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Sort: '-ModificationDate, Id',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', 'ModificationDate', 'Tags', 'NotesCount'],
                                                SubTree:[
                                                    {
                                                        Id:31,
                                                        Association: 'Note/ModifiedBy',
                                                        Expressions: ["$ref", "Name"]
                                                    }
                                                ]
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
        {
            folderTitle = ext(contextItem.Title);
            isRootFolder = !!contextItem.IsRoot

            const allElementsNo = contextItem.NotesCount + contextItem.FoldersCount
            allPagesNo = Math.floor(allElementsNo / pageElementsNo)
            if(allElementsNo % pageElementsNo)
                allPagesNo += 1

            pageNo = Math.max(0, Math.min(pageNo, allPagesNo-1))

            paginatorTop?.updatePageNo(pageNo)
            paginatorTop?.updateAllPagesNo(allPagesNo)
            paginatorBtt?.updatePageNo(pageNo)
            paginatorBtt?.updateAllPagesNo(allPagesNo)
        }
    }

   
    async function refreshView() 
    {
        await fetchData();
        subfoldersComponent.reload(contextItem, subfoldersComponent.KEEP_SELECTION)
        notesComponent.reload(contextItem, notesComponent.KEEP_SELECTION)
    }

    function getPageOperations(folder)
    {
        if(!contextItem)
            return [];

        return {
            opver: 2,
            fab: 'M00',
            operations: [
                {
                    caption: "_; View; Ver; Widok",
                    operations: [
                        ... (!folder.IsRoot) ? [
                            {
                                icon: FaPostPlus,
                                caption: '_; New thread; Nuevo hilo; Nowy wątek',
                                action: (f) => push(`/newthread/${contextItemId}`),
                                tbr: 'A'
                            } ]: [],
                        {
                            caption: '_; Refresh; Actualizar; Odśwież',
                            icon: FaSync,
                            action: async (f) => await refreshView(),
                            tbr: 'C',
                            hideToolbarCaption: true
                        }
                    
                    ]
                }
            ]
        }
    }

    function getActivityDate(item)
    {
        if(item && item.GetLastForumActivity && item.GetLastForumActivity.lastActivity)
        {
            let dt = new Date(item.GetLastForumActivity.lastActivity)
            return getNiceStringDateTime(dt)
        }
        else
            return ''
    }

    function getActivityUser(item)
    {
        if(item && item.GetLastForumActivity && item.GetLastForumActivity.lastUser)
        {
            return item.GetLastForumActivity.lastUser
        }
        else
            return ''
    }

    function getActivityTitle(item)
    {
        if(item && item.GetLastForumActivity && item.GetLastForumActivity.title)
        {
            return item.GetLastForumActivity.title
        }
        else
            return ''
    }

    let paginatorTop
    let paginatorBtt
    function onPage(page)
    {
        pageNo = page

        const path = $location
        const loc = `${path}?page=${pageNo}`
        push(loc)
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
    {#key contextItem.$ref}
        <Page   self={contextItem} 
                toolbarOperations={ getPageOperations(contextItem) }
                clearsContext='props sel'
                title={folderTitle}>

                <section class="w-full place-self-center max-w-3xl relative">
                    
                    {#if breadcrumbPath}
                        <Breadcrumb class="hidden sm:block mb-5" path={breadcrumbPath} />
                    {/if}


                    <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">
                        {folderTitle}
                    </p>

                    <!-- paginator -->

                    <div class="flex flex-row  mt-2 ">
                        <section class="ml-auto mr-2">
                            <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorTop}/>
                        </section>
                    </div>
            
                <List   self={contextItem} 
                        a='Folders'
                        
                        toolbarOperations={ (el) => [] } 
                        orderAttrib='Order'
                        bind:this={subfoldersComponent}>
                    <ListTitle      a='Title' 
                                    hrefFunc={(folder) => `${folder.href}?path=${breadcrumbPath}`}
                                    />
                    
                    <ListSummary    a='Summary'
                                    />

                    <ListStaticProperty name="Author" getter={ (item) => getActivityTitle(item)}/>
                    <ListStaticProperty name="Date" getter={ (item) => getActivityDate(item)}/>
                    <!--ListStaticProperty name="Author" getter={ (item) => getActivityUser(item)}/-->

                    <span slot="left" let:element>
                        <Icon component={FaComments} 
                            class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                    </span>
                </List>
            
                <List   self={contextItem} 
                        a='Notes'
                        toolbarOperations={ (el) => [] } 
                        orderAttrib='Order'
                        bind:this={notesComponent}>
                    <ListTitle      a='Title' 
                                    hrefFunc={(note) => `${note.href}?path=${breadcrumbPath}`}
                                    />
                    <ListSummary    a='Summary' 
                                    />

                    <ListStaticProperty name="NotesCount" postfix='replies'/>

                    <ListDateProperty name='ModificationDate' detailed editable={false}/>
                    <ListComboProperty name="Note/ModifiedBy" association editable={false}>
                        <ComboSource key="$ref" name='Name'/>
                    </ListComboProperty>

                    <ListTags a='Tags' 
                              getAllTags={() => allTags}
                              readOnly
                              />
                    
                    <span slot="left" let:element>
                        <Icon component={FaComment} 
                            class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5 ml-2  mr-1"/>
                    </span>
                </List>

                <div class="flex flex-row  mt-10 mb-10">
                    <section class="ml-auto mr-2">
                        <Paginator {onPage} {pageNo} {allPagesNo} bind:this={paginatorBtt}/>
                    </section>
                </div>
        </section>

        </Page>
    {/key}
{:else}
    <Spinner delay={3000}/>
{/if}



