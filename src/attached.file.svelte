<script>
    import {reef} from '@humandialog/auth.svelte'
    import {Spinner, onErrorShowAlert} from '@humandialog/forms.svelte'
    import {FaFileDownload} from 'svelte-icons/fa/'

    export let self;
    export let a;
    export let fileInfo;


    function getNiceFileName(fileName)
    {
        let prefix
        
        if(self.$type && self.Id)
            prefix = `${self.$type}_${self.Id}_${a}_`;
        else if(self.$ref)
        {
            const segments = self.$ref.split('/')
            if(segments.length == 3)
                prefix = `${segments[1]}_${segments[2]}_${a}_`;
            else
                return fileName;
        }
        else
            return fileName;

        if(fileName.startsWith(prefix))
        {
            return fileName.substr(prefix.length)   
        }
        else
            return fileName;
    }

    async function onDownloadFile(e, file)
    {
        e.preventDefault();
        e.stopPropagation();

        file.downloading = true;

        const href=`${self.$ref}/${a}/blob?key=${file.name}`

        const res = await reef.fetch(`json/anyv/${href}`, onErrorShowAlert);
        if(res.ok)
        {
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob);
    
            const link = document.createElement("a"); // Or maybe get it from the current document
            link.href = blobUrl;
            link.download = getNiceFileName(decodeURIComponent(file.name));

            //document.body.appendChild(link); // Or append it whereever you want
            link.click() //can add an id to be specific if multiple anchor tag, and use #id
            
            
            URL.revokeObjectURL(blobUrl)
        }
        else
        {
            const err = await res.text()
            console.error(err)
            onErrorShowAlert(err)
        }

        file.downloading = false;
    }

</script>

<a href="#" download
    on:click={(e) => onDownloadFile(e, fileInfo)}
    class="mr-2 font-normal text-nowrap break-normal">
    {#if fileInfo.downloading}
        <Spinner size={3} delay={0}/>
    {:else}
        <span class="inline-block w-3 h-3"><FaFileDownload/></span>
    {/if}
    {getNiceFileName(decodeURIComponent(fileInfo.name))}
</a>