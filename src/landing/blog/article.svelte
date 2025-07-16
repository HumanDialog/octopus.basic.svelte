<script lang="ts">
    import { location , link} from 'svelte-spa-router';
    //import HorizontalToolbar from "../doc.elements/horizontal.toolbar.svelte";
    //import VerticalToolbar from "../doc.elements/vertical.toolbar.svelte";
    //import {Highlight, HighlightSvelte} from "svelte-highlight";
    //import typescript from "svelte-highlight/languages/typescript";
    //import http from "svelte-highlight/languages/http";
    //import json from "svelte-highlight/languages/json";
    //import xml from "svelte-highlight/languages/xml";
    //import github from "svelte-highlight/styles/github";
    //import black_metal from "svelte-highlight/styles/black-metal-bathory"
    //import darkTheme from "svelte-highlight/styles/espresso";
    //import lightTheme from "svelte-highlight/styles/classic-light";
    //import CheatSheet from '../doc.elements/cheat.sheet.svelte'    
    import { afterUpdate } from "svelte";
    //import { dark_mode_store } from "../doc.elements/doc.js";
    import Header from '../header.svelte'
    import Footer from '../footer.svelte';

    import FaLinkedin from 'svelte-icons/fa/FaLinkedin.svelte'
    //import Oreef from '../common/objectreef.logo.black.svelte'

    import { Email, HackerNews, Reddit, LinkedIn, Facebook, X} from 'svelte-share-buttons-component';

	//==========================================
    let book = null;
    let right_xl_padding = "xl:pr-[128px]";
    let box;

    //let lang = {
    //    "http": http,
    //    "json": json,
    //    "xml": xml
    //}

    let book_index :string;
    let scroll_to;
    let social_media_img_path :string;
    let recommended_articles = []
    
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    $: {
        let urlpath = $location;
                
        let path_array = urlpath.split("/");
        let path_size = path_array.length

        

        if(path_size > 2) 
            book_index = path_array[2];
        else
            book_index = "toc";

        if(book == null || book.Index != book_index)
            get_book(book_index);

        scroll_to = window.location.hash;
        if(!scroll_to)
            scroll_to = '#top';
    }

    
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

    async function fetch_book(name) :Promise<object>
    {
        let path = "/blog/" + name + ".json"
        
        try
        {
            const res = await fetch(path);
            if(res.ok)
            {
                let jsonres = await res.json();
                return jsonres.Book;
            }
            else
            {
                console.error(`can't load toc from ${path}`)
                return null;
            }
        }
        catch(err)
        {
            console.error(err);
            return null;
        }
    }
      
    async function get_book(book_index :string)
    {
        if(book_index == '')
            book_index = 'toc'; 

        let my_book;
        if((book == null) || (book.Index != book_index))
        {
            my_book = await fetch_book(book_index);
            if(my_book == null)
            {
                book_index = 'toc';
                my_book = await fetch_book(book_index);
            }
        }
        
        book = my_book;
        book.Index = book_index;

        let sections_no :number = 0;
        book.TOC.forEach(chapter => {
            sections_no += chapter.Pages.length;
        });

        if(sections_no > 1)
            right_xl_padding = "xl:pr-[256px]"

        social_media_img_path = getFirstImgPath(book);

        if(book?.Tags?.recommended)
            recommended_articles = JSON.parse(book.Tags.recommended)
        
        //book.Tags['recommended'] = [{title: 'Svelte Cheat Sheet',img: '/reef-loves-svelte.png',href: '/blog/svelte-cheatsheet',desc: 'Useful snippets for daily work with Svelte.'},{title: 'Octopus Basic',img: '/samples/octopus-basic/image3.png',href: '/samples/octopus-basic',desc: 'Complete task management application with kanban boards and complex task descriptions.'},]

    }


    /*let scroll_to;
    $: setup_scroll($currentURL);

    function setup_scroll(...args)
    {
        //let params = $currentURL.searchParams;
        //let section_id = params.get("section");

        scroll_to = window.location.hash;
        if(!scroll_to)
            scroll_to = '#top';
    }
        */
    afterUpdate(() => {
		if(scroll_to.startsWith('#'))
            scroll_to = scroll_to.substr(1);
        
        let top_element = document.getElementById(scroll_to)
        if(top_element)
            top_element.scrollIntoView();
        scroll_to = '';
        
	});

    function getFirstImgPath(book: any) :string
    {
        if(!book)
            return '';
           
        Object.keys(book.Content).forEach(pageId => 
            {
                const pageContent = book.Content[pageId];
                if(pageContent)
                {
                    pageContent.Page.forEach(fragment => 
                    {
                        if(fragment.Kind == "IMG")
                        {
                            const path = "/blog/" + book.Index +'/' + fragment.PATH
                            return path;
                        }
                    })   
                }
            })

        return '';
    }

</script>

<svelte:head>
    <!--
    {#if $dark_mode_store == 'dark'}
        {@html darkTheme}
    {:else}
        {@html lightTheme}
    {/if}
    -->

    <title>Blog &gt; {book?.Title} | {__APP_TITLE__}</title>

    {#if book?.Tags?.description}
        <meta name="description" content="{book?.Tags?.description}"/>
        <meta property="og:description" content={book?.Tags?.description} />
        <meta name="twitter:description" content={book?.Tags?.description} />
    {/if}

    <meta property="og:type" content="website" />
	<meta property="og:title" content={book?.Title} />
	<meta property="og:site_name" content="Octopus" />
	
	<meta property="og:image" name="og:image" content={social_media_img_path} />
	<meta name="og:url" content="https://octopus.objectreef.dev/#/blog/{book_index}" />

	<!--meta name="twitter:site" content="@ObjectReef" />
	<meta name="twitter:image" content={social_media_img_path} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={book?.Title} /-->
	

    <link rel="canonical" href="{__WEBSITE__}/#/blog/{book_index}"/>
</svelte:head>

<!--HorizontalToolbar catalog_href="/blog" never_show_toc={true}/-->
<!--VerticalToolbar catalog_href="/blog" never_show_toc={true}/-->

<section>
    <Header transparent light main/>
</section>

<div class="mt-10 antialiased overflow-x-hidden bg-white darkx:bg-stone-900"> <!--  overflow-hidden sm:overflow-auto -->
    <div>
        <div id="1440" class="max-w-[1280px] mx-auto px-0 sm:px-0 md:px-0">
            <div class=" sm:pl-10  lg:pl-[120px] {right_xl_padding}">
                
                <!--div class="min-w-0 {content_class} flex-auto px-4 py-16  lg:px-8 overflow-y-auto overflow-x-hidden"-->

                <div class=" margin-x-auto px-4 sm:px-8 lg:px-10 
                             "
                    bind:this={box}> <!--  h-[calc(100vh-40px)] sm:h-auto overflow-y-scroll sm:overflow-y-visible overflow-x-hidden  -->
                    <article>
                        <header id='top' class="mb-9">
                            <!--div  class=" pt-5 mb-10 text-2xl tracking-tight text-stone-900 darkx:text-white
                                        flex flex-row">
                                <p class="mr-3">The</p>
                                <a href="/" class="h-6 mt-2"><Oreef/></a>
                                <p class="">'s blog</p>
                            </div-->

                            <h1 class="font-display text-3xl tracking-tight text-stone-900 darkx:text-white">{book?.Title}</h1>
                            <div class="mt-3 flex flex-row text-xs darkx:text-gray-400">
                                <p class="flex-1">Date: <span class="font-semibold">{book?.Tags?.date}</span></p>
                                <p class="flex-1">Author: <span class="font-semibold">{book?.Tags?.author}</span></p>
                                <p class="flex-1">Minutes: <span class="font-semibold">{book?.Tags?.MTR}</span></p>
                              </div>
                            
                            {#if book && book.Title}
                            {@const url = window.location.href}
                            {@const title = book.Title}
                            <div class=" flex flex-row justify-end gap-2 mt-4">
                                <Email class="rounded-full h-10 w-10 share-button" subject="{title}" body="{url}" />
                                <Reddit class="rounded-full h-10 w-10 share-button !bg-[#FF4500] hover:!bg-[#C73600]" {title} {url}/>
                                <LinkedIn class="rounded-full h-10 w-10 share-button" {url} />
                                <Facebook class="rounded-full h-10 w-10 share-button" quote="{title}" {url}/>
                                <X class="rounded-full h-10 w-10 share-button" text="{title}" {url} related="other,users" />
                            </div>
                            {/if}
                            
                        </header>
                        <!--div class="prose prose-stone max-w-none darkx:prose-invert darkx:text-stone-400 prose-headings:scroll-mt-28 prose-headings:font-display prose-headings:font-normal lg:prose-headings:scroll-mt-[8.5rem] prose-lead:text-stone-500 darkx:prose-lead:text-stone-400 prose-a:font-semibold darkx:prose-a:text-sky-400 prose-a:no-underline prose-a:shadow-[inset_0_-2px_0_0_var(--tw-prose-background,#fff),inset_0_calc(-1*(var(--tw-prose-underline-size,4px)+2px))_0_0_var(--tw-prose-underline,theme(colors.sky.300))] hover:prose-a:[--tw-prose-underline-size:6px] darkx:[--tw-prose-background:theme(colors.stone.900)] darkx:prose-a:shadow-[inset_0_calc(-1*var(--tw-prose-underline-size,2px))_0_0_var(--tw-prose-underline,theme(colors.sky.800))] darkx:hover:prose-a:[--tw-prose-underline-size:6px] prose-pre:rounded-xl prose-pre:bg-stone-900 prose-pre:shadow-lg darkx:prose-pre:bg-stone-800/60 darkx:prose-pre:shadow-none darkx:prose-pre:ring-1 darkx:prose-pre:ring-stone-300/10 darkx:prose-hr:border-stone-800"-->
                        <div class="prose prose-stone max-w-none darkx:prose-invert darkx:text-stone-200">

                            {#if book != null}
                            {#each Object.keys(book.Content) as page_id}
                                {@const page_content = book.Content[page_id]}
                                {#each page_content.Page as fragment}
                                    {#if fragment.Kind == "HTML"}
                                        {@html fragment.HTML}
                                    {:else if fragment.Kind == "CODE"}
                                        <pre class="overflow-x-auto shrink">
                                            {fragment.Src}
                                        </pre>
                                <!--   {#if fragment.Type == null}
                                            <div class="overflow-x-auto shrink">
                                                <div>
                                            <Highlight language={typescript} code={fragment.Src} class="p-0"/>    
                                                </div>
                                            </div>
                                        {:else if fragment.Type=='svelte'}
                                            <HighlightSvelte code={fragment.Src} class="p-0"/>
                                        {:else}    
                                        <div class="overflow-x-auto">
                                            <Highlight language={lang[fragment.Type]} code={fragment.Src} class="p-0"/>    
                                        </div>
                                        {/if}
                                    -->
                                    {:else if fragment.Kind == "IMG"}
                                        
                                        <section class="flex flex-col justify-center items-center">
                                            <figure >
                                                <img class="max-w-3xl max-h-[calc(50vh)]
                                                            border-stone-200 darkx:border-stone-700 shadow-lg shadow-stone-300 darkx:shadow-black"
                                                        src={"/blog/" + book.Index +'/' + fragment.PATH}
                                                    alt="" />
                                                    {#if fragment.Caption != null && fragment.Caption != ""}
                                                    <figcaption class="text-center">
                                                        {@html fragment.Caption}
                                                    </figcaption>
                                                    {/if}
                                            </figure>
                                        </section>
                                    {:else if fragment.Kind == "CHEATSHEET"}
                                        <div class="not-prose max-w-none">
                                            <!--CheatSheet/-->                    
                                        </div>
                                    {:else}
                                        <p>Unknown content kind: {fragment.Kind}</p>
                                    {/if}
                                {/each}
                            {/each}
            
            
                            {:else}
                            <p>Page is empty</p>
                            {/if} 
            

                            <section class="not-prose mt-20">
                                <hr class="my-2 border-gray-200 darkx:border-gray-700">
                                
                                {#if book?.Tags?.author_img}
                                    <img class="block h-20 w-20 mt-10 mb-5 bg-red-300 rounded-full" src="{book?.Tags?.author_img}" alt="avatar"/>
                                {/if}

                                <div class="flex flex-row justify-between">
                                    <p class="text-base font-semibold">Written by {book?.Tags?.author}</p>
                                    
                                    <section class="flex flex-row gap-4">
                                        <!-- Twitter -->
                                         {#if book?.Tags?.author_x}
                                            <a href="{book?.Tags?.author_x}" target=”_blank” class="text-gray-500 hover:text-gray-900 darkx:hover:text-white" aria-label="twitter">
                                                <svg class="w-4 h-5" fill="currentColor" viewBox="0 0 300 300"  version="1.1" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>
                                                </svg>
                                            </a>
                                        {/if}

                                        <!-- LinkedIn -->
                                        {#if book?.Tags?.author_li}
                                            <a href="{book?.Tags?.author_li}" target=”_blank” class="w-4 h-5 text-gray-500 hover:text-gray-900 darkx:hover:text-white" aria-label="linkedin">
                                                <FaLinkedin/>
                                                
                                            </a>
                                        {/if}
                                    </section>
                                </div>
                                {#if book?.Tags?.author_desc}
                                    <p class="text-xs">{book?.Tags?.author_desc}</p>
                                {/if}
                            </section>

                            {#if recommended_articles && recommended_articles.length > 0}
                                <section class="mt-10">
                                    <hr class="my-2 border-gray-200 darkx:border-gray-700">
                                    <h2>Recommended articles</h2>
                                    <div class="not-prose max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 sm:m-3">
                                        {#each recommended_articles as recommended}
                                            {@const height = recommended.img ? "h-[320px]" : "h-[160px]"}

                                            <a class="group block max-w-md {height}
                                                        bg-white border border-stone-200 rounded-lg shadow  darkx:bg-stone-800 darkx:border-stone-700
                                                        hover:bg-stone-100 darkx:hover:bg-stone-700
                                                        cursor-pointer"
                                                        href = {recommended.href}
                                                        use:link>
                                    
                                                {#if recommended.img}
                                                <div class="overflow-hidden h-1/2">
                                                    {#if recommended.img}
                                                        <img class="rounded-t-lg opacity-100 lg:opacity-90 group-hover:opacity-100 " src={recommended.img} alt="">
                                                    {:else} 
                                                        <!--ImgPlaceholder is_loading={false}/-->
                                                    {/if}
                                                </div>
                                                {/if}
                                            
                                                <div class = "p-2">
                                                    <h2 class="font-semibold text-xl">{recommended.title}</h2>
                                                    <p class="mt-2">{recommended.desc}</p>
                                                </div>
                                            </a>    
                                        {/each}
                                    </div>
                                </section>
                            {/if}
                            
                        </div>
                    </article>
   
                    
            
   
                </div>    
            </div>
            
            <!--#######################################################-->
            <!--##  CONTENT COMMENTS                 ##################-->
            <!--#######################################################-->
            {#if false && book && book.TOC }
                <div class="    hidden xl:block fixed  w-[256px] right-[max(0px,calc(50vw-720px))]
                                z-20 top-[2px] bottom-0  py-10 overflow-y-auto bg-stone-50 darkx:bg-stone-800">
                    <div class="px-8">
                        
                        
                        <h2 id="on-this-page-title" class="font-display text-sm font-medium text-stone-900 darkx:text-white">
                            On this page</h2>
                        <ol class="mt-4 space-y-3 text-sm">
                        {#each book.TOC as chapter}
                            {#each chapter.Pages as page}
                                <li>
                                    <h3><a class="font-normal text-stone-500 hover:text-stone-700 darkx:text-stone-400 darkx:hover:text-stone-300 cursor-pointer"
                                            href={`/blog/${book.Index}#${page.Id}`}>{page.Page}</a></h3>
                                    
                                </li>   
                            {/each}
                        {/each}

                        </ol>
                    
                    </div>
                </div>
            {/if}

        
        </div>
    </div>

    <section>
        <Footer/>
    </section>

</div>



    