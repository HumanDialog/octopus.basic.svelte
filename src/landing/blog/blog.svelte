<script lang="ts">
    import { location, link } from 'svelte-spa-router';
    import ImgPlaceholder from "./img.placeholder.svelte";
    //import {fetch_book} from '../doc.elements/utils'
    import Footer from '../footer.svelte'
    import Header from '../header.svelte'

       
    let book = null;
         
    $: {
        let urlpath = $location;
        read_toc();
    }

    
    async function read_toc()
    {
        let book_index = 'toc'
        if((book == null) || (book.Index != book_index))
            book = await fetch_book(book_index, 'blog');
        
        book.Index = book_index;
    }

    async function fetch_book(name: string, scope: string)
    {
        let path = `/${scope}/${name}.json`
        
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


</script>

<svelte:head>
  <title>Blog | {__APP_TITLE__}</title>
  <meta name="description" content="Blog about productivity and project management."/>
  <link rel="canonical" href="{__WEBSITE__}/#/blog/toc"/>
</svelte:head>

<section>
    <Header transparent light main/>
</section>

<!--HorizontalToolbar catalog_href="/blog" never_show_toc={true}/>
<VerticalToolbar catalog_href="/blog" never_show_toc={true}/-->

<div class="mt-10 ml-0 sm:ml-10 flex flex-col justify-center items-center">
    <h2 class="text-4xl font-extrabold dark:text-white mb-4 text-center mb-10">The {__APP_TITLE__} Blog</h2>
    {#if book && book.TOC.length>0 && book.TOC[0].Pages}

    <div class="max-w-6xl grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 m-3">
    {#each book.TOC[0].Pages as toc_entry}
        {@const entry = book.Content[toc_entry.Id]}
        {@const content = entry.Page[0].HTML}
        <a class="group block max-w-md h-[320px]
                    bg-white border border-stone-200 rounded-lg shadow  dark:bg-stone-800 dark:border-stone-700
                    hover:bg-stone-100 dark:hover:bg-stone-700
                    cursor-pointer"
                    href = {entry?.Tags?.href}
                    use:link>

        <div class="overflow-hidden h-1/2">
            {#if entry?.Tags?.img}
                <img class="rounded-t-lg opacity-100 lg:opacity-90 group-hover:opacity-100 " src={entry?.Tags?.img} alt="">
            {:else} 
                <ImgPlaceholder is_loading={false}/>
            {/if}
            
        </div>
        <div class="p-2 flex flex-row text-xs dark:text-stone-400">
            <p class="flex-1">Date: <span class="font-semibold">{entry?.Tags?.date}</span></p>
            <p class="flex-1">Minutes: <span class="font-semibold">{entry?.Tags?.MTR}</span></p>
            <p class="flex-1">Author: <span class="font-semibold">{entry?.Tags?.author}</span></p>
        </div>
        <div class = "  p-2
                        prose prose-stone max-w-none dark:prose-invert dark:text-stone-200
                        prose-headings:mt-1 prose-headings:mb-1
                        prose-p:mt-1 prose-p:mb-1">
            {@html content}
        </div>
        </a>    
    {/each}
    </div>
    {:else}
        <p class="sm:mt-20 sm:mb-64">There are no articles yet</p>
    {/if}
</div>

<section>
    <Footer />
</section>
    