<script>   
	import { reef, session, signInHRef } from '@humandialog/auth.svelte';
    import { onErrorShowAlert, mainContentPageReloader, Spinner, Page, editable, getNiceStringDateTime, startEditing} from '@humandialog/forms.svelte';
	import { location, querystring, link, push } from 'svelte-spa-router';
    import {tick} from 'svelte'
    import {FaComments} from 'svelte-icons/fa'
	
    $: onParamsChanged($location, $querystring, $mainContentPageReloader);
    
    let userRef = 'user'
    let user = null
    let isReadOnly = true
    let isSelfProfile = false

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'profile');
        if(foundIdx < 0)
            return;

        if(!segments.length)
        {
            userRef = 'user';
        }
        else
        {
            const userId = parseInt(segments[segments.length-1])
            if(!userId)
            {
                userRef = 'user'
                isSelfProfile = true
            }
            else
            {
                userRef = `./User/${userId}`
                isSelfProfile = false

                reef.get('user/Id', onErrorShowAlert).then((currentUserId) => {
                    if(currentUserId == userId)
                        isSelfProfile = true
                })

                
            }
        }

        const res = await reef.post(`${userRef}/query`, {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 4,
                            Tree: [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:['Id', '$ref', 'Name', 'Email', 'Avatar', 'Bio', '$acc'],
                                    SubTree: [
                                        {
                                            Id: 10,
                                            Association: 'CreatedNotes',
                                            Filter: 'Kind>=NK_THREAD',
                                            Sort: "-CreationDate",
                                            Expressions: ['Id', '$ref', 'Title', 'Summary', 'CreationDate', 'Tags', 'Index', 'href', 'Kind']
                                        }
                                    ]
                                }
                            ]
        }, onErrorShowAlert)
        user = res.User

        isReadOnly = (user.$acc & 0x2) == 0
        
    }

    function getPageOperations()
    {

    }

    function onNameChanged(txt)
    {
        user.Name = txt
        reef.post(`${userRef}/set`, {
            Name: txt
        }, onErrorShowAlert)
    }

    async function onBioChanged(text)
    {
        user.Bio = text
        reef.post(`${userRef}/set`, {
            Bio: text
        }, onErrorShowAlert)
    }

    let bioElement
    let bioPlaceholder = false
    async function startBioEditing()
    {
        if(bioElement)
            startEditing(bioElement, () => bioPlaceholder=false)
        else
        {
            bioPlaceholder = true;
            await tick();
            startEditing(bioElement, () => bioPlaceholder=false)
        }
    }

    async function openChat()
    {
        const res = await reef.post(`user/AddDirectMesssageChannel`, {
            toWhom: user.$ref
        }, onErrorShowAlert)

        if(!res)
            return;

        let channel = res.MessageChannel
        const href = await reef.get(`${channel.$ref}/href`, onErrorShowAlert)
        if(href)
            push(href)
    }

</script>

<svelte:head>
    <title>Profile | {__APP_TITLE__}</title>
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

{#if user}
    <Page   self={user} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={user.Name}>
        <section class="w-full flex justify-center">
            <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
                <h1 use:editable={{
                        action: (text) => onNameChanged(text), 
                        active: true,
                        readonly: isReadOnly}}
                        tabindex="0">
                    {user.Name}
                </h1>

                {#if !isReadOnly}
                    <p class="lead"
                        on:click={startBioEditing}>
                        {#if user.Bio || bioPlaceholder}
                            <span   bind:this={bioElement}
                                    use:editable={{
                                        action: (text) => onBioChanged(text), 
                                        active: false}}
                                        tabindex="0">
                                {#if user.Bio}
                                    {user.Bio}
                                {:else}
                                    &ZeroWidthSpace;
                                {/if}
                            </span>
                        {:else}
                            Enter bio here
                        {/if}
                    </p>
                {:else}
                    {#if user.Bio}
                        <p class="lead">{user.Bio}</p>
                    {/if}
                {/if}

                <h2>Contact information</h2>
                <a href="mailto:{user.Email}">{user.Email}</a>

                {#if !isSelfProfile}
                    <button type="button" 
                            class=" 
                            py-2.5 px-4 
                            text-sm  
                            hover:bg-stone-200 dark:hover:bg-stone-800 
                            border border-stone-300 focus:outline-none dark:border-stone-600
                            flex items-center rounded"
                            on:click={(e) => {openChat()}}>
                        <div class="w-5 h-5 mr-1"><FaComments/></div>
                        <span class="ml-1">Chat with {user.Name}</span>
                        
                    </button>
                {/if}

                <h2>Activity</h2>
                {#if user.CreatedNotes && user.CreatedNotes.length > 0}
                    <ul>
                    {#each user.CreatedNotes as post}
                        {@const creatioDate = new Date(post.CreationDate)}
                        <li>
                            <h4>
                                <a href={post.href} use:link>
                                    {post.Title}
                                </a>
                            </h4>
                            <section class="flex flex-row w-full gap-4">
                                <p class="text-sm flex-1">
                                    {post.Summary}
                                </p>
                                <p class="ms-auto text-sm font-semibold">{getNiceStringDateTime(creatioDate)}</p>
                            </section>
                        </li>
                    {/each}
                    </ul>
                {:else}
                    <p>No recent activity</p>
                {/if}
                
            </article>
        </section>
    </Page>
{:else}
    <Spinner/>
{/if}

