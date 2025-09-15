<script>
    import {reef, session} from '@humandialog/auth.svelte'
	import  { Editor,
            Page,
            Tags,
            editable,
			activateItem,
			isActive,
			clearActiveItem,
			isDeviceSmallerThan,
            onErrorShowAlert,
            Modal,
			Spinner,
            resizeImage,
			getNiceStringDateTime,
            startEditing,
            IcH1, IcH2, IcH3, IcH4,
            addAlert, i18n
        } from '@humandialog/forms.svelte'
	import { tick } from 'svelte';
    import {location, push, pop, replace, link} from 'svelte-spa-router'
    
    import {    FaTimes, FaTag,  FaCloudUploadAlt, FaFont, FaBold, FaItalic, FaUnderline, FaStrikethrough,
                FaRegStar, FaStar, FaPaperPlane, FaPaperclip, FaPlus, FaTable, FaImage,
                FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo, FaListUl} from 'svelte-icons/fa/'
	
        
    let folderRef = ''
    
    let note = null;
    let allTags = '';

    let attachedFiles = []
    let pendingResizing = false;
    let pendingPosting = false;
    const s = session;
    let creationDate = null
    let modificationDate = null

    let user = null


    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('note: ', $location)
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'newthread');
        if(foundIdx < 0)
            return;

        if(!user)
        {
            reef.get('user?fields=$ref,Name,Email,href', onErrorShowAlert).then((res) => {
                if(res)
                {
                    user = res.User;   
                }
            })
        }

        const folderId = segments[segments.length-1]
        folderRef = `./Folder/${folderId}`

        if(!allTags)
            reef.get('/group/AllTags', onErrorShowAlert).then( (res) => allTags = res)

       prepareData();
    }

    function prepareData()
    {
        note = {
            Index: '',
            Title: '',
            Summary: '',
            Content: '',
            Images: '',
            AttachedFiles: '',
            Tags: ''
            
        }

        creationDate = new Date( Date.now())
        attachedFiles = []
    }

   

    /*
    async function onSummaryChanged(text)
    {
        note.Summary = text;
        await reef.post(`${noteRef}/SetSummary`, {val: text}, onErrorShowAlert)
        
    }
    */

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        //await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        note.Tags = tags;
        //await reef.post(`${noteRef}/SetTags`, {val: tags}, onErrorShowAlert)
    }

    async function onContentChanged(content)
    {
        note.Content = content;
        //await reef.post(`${noteRef}/SetContent`, {val: content}, onErrorShowAlert)
    }
    
    
    let createdBy;
    let responsiblePlaceholder = false

    let tags;
    let tagsPlaceholder = false


    let contentElement;
    let contentPlaceholder = false;

    async function runTagInserter()
    {
        if(tags)
            tags.show();
        else
        {
            tagsPlaceholder = true;
            await tick();
            tags?.show(undefined, () => {tagsPlaceholder = false;})
        }
    }
    
    
    
    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            operations: [
                {
                    caption: '_; Thread; Hilo; Wątek',
                    tbr: 'B',
                    operations: [
                        {
                            caption: '_; Publish; Publicar; Opublikuj',
                            icon: FaPaperPlane,
                            action: (f) => {postQuestion()},
                            tbr: 'A'
                        }, 
                        {
                            caption: '_; Cancel; Cancelar; Anuluj',
                            icon: FaTimes,
                            action: (f) => {askLeaveQuestion()},
                        }
                    ]
                },
                {
                    caption: '_; Insert; Insertar; Wstaw',
                    tbr: 'B',
                    operations: [
                         {
                            caption: '_; Attachement; Anexo; Załącznik',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Tag; Etiqueta; Etykieta',
                            icon: FaTag,
                            action: (f) => runTagInserter()
                        }
                    ]
                }
            ]
        }
    }

    function getPageOperationsWithFormattingTools()
    {
        let operations = {
            opver: 2,
            fab: 'M00',
            operations: [
                {
                    caption: '_; Thread; Hilo; Wątek',
                    tbr: 'B',
                    preAction: contentElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Publish; Publicar; Opublikuj',
                            icon: FaPaperPlane,
                            action: (f) => {postQuestion()},
                            tbr: 'A'
                        }, 
                        {
                            caption: '_; Cancel; Cancelar; Anuluj',
                            icon: FaTimes,
                            action: (f) => {askLeaveQuestion()},
                        }
                    ]
                },
                {
                    caption: '_; Insert; Insertar; Wstaw',
                    tbr: 'B',
                    preAction: contentElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Image; Imagen; Obraz',
                            icon: FaImage,
                            action: (f) => contentElement.setImage(),
                            activeFunc: contentElement.isActiveImage,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Table; Tabla; Tabela',
                            icon: FaTable,
                            action: (f) => contentElement.setTable(),
                            activeFunc: contentElement.isActiveTable
                        },
                        {
                            caption: '_; Attachement; Anexo; Załącznik',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Tag; Etiqueta; Etykieta',
                            icon: FaTag,
                            action: (f) => runTagInserter()
                        }
                    ]
                },
                {
                    caption: '_; Text; Texto; Tekst',
                    tbr: 'B',
                    preAction: contentElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Bold; Negrita; Pogrubiony',
                            icon: FaBold,
                            action: (f) => contentElement.setBold(),
                            activeFunc: contentElement.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Italic; Cursiva; Kursywa',
                            icon: FaItalic,
                            action: (f) => contentElement.setItalic(),
                            activeFunc: contentElement.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Underline; Subrayar; Podkreślenie',
                            icon: FaUnderline,
                            action: (f) => contentElement.setUnderline(),
                            activeFunc: contentElement.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Strikethrough; Tachado; Przekreślenie',
                            icon: FaStrikethrough,
                            action: (f) => contentElement.setStrikethrough(),
                            activeFunc: contentElement.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: '_; Styles; Estilos; Style',
                    tbr: 'B',
                    preAction: contentElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Normal; Normal; Normalny',
                            icon: FaRemoveFormat,
                            action: (f) => contentElement.setNormal(),
                            activeFunc: contentElement.isActiveNormal,
                        },
                        {
                            caption: '_; Heading 1; Título 1; Nagłówek 1',
                            icon: IcH1,
                            action: (f) => contentElement.setHeading(1),
                            activeFunc: contentElement.isActiveH1
                        },
                        {
                            caption: '_; Heading 2; Título 2; Nagłówek 2',
                            icon: IcH2,
                            action: (f) => contentElement.setHeading(2),
                            activeFunc: contentElement.isActiveH2
                        },
                        {
                            caption: '_; Heading 3; Título 3; Nagłówek 3',
                            icon: IcH3,
                            action: (f) => contentElement.setHeading(3),
                            activeFunc: contentElement.isActiveH3
                        },
                        {
                            caption: '_; Heading 4; Título 4; Nagłówek 4',
                            icon: IcH4,
                            action: (f) => contentElement.setHeading(4),
                            activeFunc: contentElement.isActiveH4
                        },
                        {
                            caption: '_; Code; Código; Kod',
                            icon: FaCode,
                            action: (f) => contentElement.setCode(),
                            activeFunc: contentElement.isActiveCode,
                        },
                    /*    {
                            caption: 'Comment',
                            icon: FaComment,
                            action: (f) => contentElement.setComment(),
                            activeFunc: contentElement.isActiveComment,
                        }, */
                        {
                            caption: '_; Quote; Cita; Cytat',
                            icon: FaQuoteRight,
                            action: (f) => contentElement.setQuote(),
                            activeFunc: contentElement.isActiveQuote,
                        },
                   /*     {
                            caption: 'Warning',
                            icon: FaExclamationTriangle,
                            action: (f) => contentElement.setWarning(),
                            activeFunc: contentElement.isActiveWarning,
                        },
                        {
                            caption: 'Info',
                            icon: FaInfo,
                            action: (f) => contentElement.setInfo(),
                            activeFunc: contentElement.isActiveInfo,
                        },*/
                        {
                            caption: '_; BulletList; Lista con viñetas; Lista punktowana',
                            icon: FaListUl,
                            action: (f) => contentElement.setBulletList(),
                            activeFunc: contentElement.isActiveBulletList,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                    ]
                }
                
            ]
        }

        return operations
        
    }
       
    const extraPaletteCommands = [
        {
            caption: '_; Publish; Publicar; Opublikuj',
            icon: FaPaperPlane,
            action: () => postQuestion()
        },
        {
            caption: '_; Cancel; Cancelar; Anuluj',
            icon: FaTimes,
            action: () => askLeaveQuestion()
        }
    ]

    const extraInsertPalletteCommands = [
        {
            caption: '_; Attachement; Anexo; Załącznik',
            icon: FaPaperclip,
            action: runFileAttacher
        },
        {
            caption: '_; Tag; Etiqueta; Etykieta',
            icon: FaTag,
            action: () => setTimeout(() => runTagInserter(), 500)
        }
    ]

    const descriptionActive = { }
    function activateFormattingTools()
    {
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded()
    {
        if(isActive('props', descriptionActive))
            clearActiveItem('props')
    }

    let selectedImages = []
    let selectedAttachements = []
    let imgInput;
    let attInput;
    
    function selectImage(finishEditorCb)
    {
    //    imgEditorActionAfterSuccess = editorActionAfterSuccess;
        imgInput?.click();
    }
    
    async function onImageSelected()
    {
        const [file] = imgInput.files;
        if(file)
        {
            pendingResizing = true 

            let resizedImage = await resizeImage(file, 1024, 1024)
            if(!resizedImage)
                resizedImage = file
            
            const selectedImageInfo = {
                image: resizedImage,
                name: file.name,
                url: URL.createObjectURL(resizedImage)
            }

            contentElement.addTemporaryImage(selectedImageInfo.url)

            selectedImages = [...selectedImages, selectedImageInfo];
            pendingResizing = false;
        }
    }

    function removeImage(url)
    {
        const idx = selectedImages.findIndex(i => i.url == url)
        if(idx >= 0)
            selectedImages.splice(idx, 1)
    }


    function runFileAttacher()
    {
        attInput?.click();
    }

    function onAttachementSelected()
    {
        if(attInput.files.length > 0)
        {
            selectedAttachements = [...selectedAttachements, ...attInput.files]
        }
    }

    function onRemoveAttachement(idx)
    {
        selectedAttachements.splice(idx, 1);
    }

    function clearAttachements()
    {
        selectedAttachements = []
    }

   
    let titlePlaceholder = false;
    let titleElement;
    async function startTitleEditing(e)
    {
        if(titleElement)
            startEditing(titleElement, () => titlePlaceholder=false)
        else
        {
            titlePlaceholder = true;
            await tick();   // rerender with h1
            startEditing(titleElement, () => titlePlaceholder=false)
        }
    }

    async function onTitleChanged(text)
    {
        note.Title = text;
    }

 
    async function startDescriptionEditing(e)
    {
        if(contentElement)
            contentElement.run();
        else
        {
            contentPlaceholder = true;
            await tick();
            contentElement?.run(() => {contentPlaceholder = false})
        }
    }

    async function postQuestion()
    {
        const msg = '_; Enter title and description first; Introduzca primero el título y la descripción; Najpierw wprowadź tytuł i opis';
        if(!note.Title)
        {
            addAlert(msg)
            return;
        }

        if(!contentElement)
        {
            addAlert(msg)
            return
        }

        const originalPostContent = contentElement.getInnerHtml()
        if(!originalPostContent)
        {
            addAlert(msg)
            return
        }

        pendingPosting = true;
        note.Content = originalPostContent

        let newPostHRef = ''

        if(selectedImages.length==0 && selectedAttachements.length==0)
        {
            const res = await reef.post(`${folderRef}/AddPost`, { 
                    title: note.Title,
                    summary: '',
                    content: note.Content,
                    tags: note.Tags
                }, onErrorShowAlert)

            if(res)
            {
                newPostHRef = await reef.get(`${res.Note.$ref}/href`, onErrorShowAlert);
            }
            else
            {
                pendingPosting = false;
                return;
            }
        }
        else
        {
        
        //1. create note
            
            const res = await reef.post(`${user.$ref}/AddWorkingPost`, { }, onErrorShowAlert)
            if(!res)
            {
                pendingPosting = false;
                return;
            }

            const questionRef = res.Note.$ref;

            //2. post images
            for(let i=0; i<selectedImages.length; i++)
            {
                let imageInfo = selectedImages[i];
                
                const res = await reef.post(`${questionRef}/Images/blob?name=${imageInfo.name}&size=${imageInfo.image.size}`, {}, onErrorShowAlert)
                if(res && res.key && res.uploadUrl)
                {
                    const newKey = res.key;
                    const uploadUrl = res.uploadUrl

                    try
                    {
                        const res = await fetch(uploadUrl, {
                                                    method: 'PUT',
                                                    headers: new Headers({
                                                        'Content-Type': imageInfo.image.type
                                                    }),
                                                    body: imageInfo.image})

                        const dataPath = `${questionRef}/Images/blob?key=${newKey}`
                        contentElement.replaceTemporaryImage(imageInfo.url, dataPath)
                        
                        if(!res || !res.ok)
                        {
                            const err = await res.text()
                            console.error(err)
                            onErrorShowAlert(err)
                        }
                            
                    }
                    catch(err)
                    {
                        console.error(err)
                        onErrorShowAlert(err)

                        contentElement.removeTemporaryImage(imageInfo.url)
                    }
                }
                else
                {
                    contentElement.removeTemporaryImage(imageInfo.url)
                }
            }

            // 3. send attached files
            for(let i=0; i<selectedAttachements.length; i++)
            {
                const file = selectedAttachements[i];
                const res = await reef.post(`${questionRef}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
                if(res && res.key && res.uploadUrl)
                {
                    const newKey = res.key;
                    const uploadUrl = res.uploadUrl
                    
                    try
                    {
                        const res = await fetch(uploadUrl, {
                                                    method: 'PUT',
                                                    headers: new Headers({
                                                        'Content-Type': file.type
                                                    }),
                                                    body: file})
                        if(!res.ok)
                        {
                            const err = await res.text()
                            console.error(err)
                            onErrorShowAlert(err)
                        }
                            
                    }
                    catch(err)
                    {
                        console.error(err)
                        onErrorShowAlert(err)
                    }
                }
                else
                {
                    // can't upload attachement
                    // nothing to do
                }
            }
            
            note.Content = contentElement.getInnerHtml()
            
            // 4. Attach post to folder
            const res2 = await reef.post(`${folderRef}/AttachPost`, {
                note: questionRef,
                title: note.Title,
                summary: '',
                content: note.Content,
                tags: note.Tags
            }, onErrorShowAlert)

            if(res2)
            {
                newPostHRef = await reef.get(`${res2.Note.$ref}/href`, onErrorShowAlert);
            }
            else
            {
                // can't attach new post with attachements
                // should we show any message to user?

                contentElement.setInnerHtml(originalPostContent)
                note.Content = contentElement.getInnerHtml()
                pendingPosting = false;
                return;
            }
        }

        pendingPosting = false;
        
        if(newPostHRef)
        {
            // replace instead of push to not add current page to history stack
            replace(newPostHRef)
        }
    }

    let leaveModal;
    function askLeaveQuestion()
    {
        leaveModal.show()
    }

    async function leaveQuestion()
    {
        leaveModal.hide();
        pop()   // na razie tak
    }

    const title = '_; New thread; Nuevo hilo; Nowy wątek'

</script>

<svelte:head>
    <title> {title} | {__APP_TITLE__}</title>
</svelte:head>

{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={note} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={note.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
            <section class="w-full flex flex-row justify-between">
                    <p class="">
                        {note.Index}
                    </p>
                    
                    <div>
                        {#if creationDate}
                            <p>
                                {getNiceStringDateTime(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section>

            
            
            <h1 on:click={startTitleEditing}>
                {#if note.Title || titlePlaceholder}
                    <span   bind:this={titleElement}
                            use:editable={{
                                action: (text) => onTitleChanged(text), 
                                active: false}}
                                tabindex="0">
                        {#if note.Title}
                            {note.Title}
                        {:else}
                            &ZeroWidthSpace;
                        {/if}
                    </span>
                {:else}
                    <span class="placeholder">
                        _; Title; Título; Tytuł
                    </span>
                {/if}
            </h1>
            

            <!--
            {#if note.Summary || summaryPlaceholder}
                {#key note.Summary}
                    <p  class="lead"
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            active: true,
                            readonly: true}}
                        tabindex="0"
                        bind:this={summary}>
                        {note.Summary}
                    </p>
                {/key}
                
           {/if}
           -->
            
            <section class="w-full flex flex-row flex-wrap justify-between">
                <div class="grow-0">
                    {#if user}
                        {@const href = user.href}
                        <a {href} use:link> {user.Name} </a>
                    {/if}
                </div>

                <div>
                    <!--
                    {#if availableStates && availableStates.length > 0}
                        <Combo  compact={true} 
                                inContext='data'
                                a='State'
                                icon
                                placeholder='State'
                                hasNone={false}
                                s='prose'>
                            <ComboSource    objects={availableStates}
                                            key="state" 
                                            name="name"
                                            icon="icon"/>
                        </Combo>
                    {/if}
                    -->
                </div>

                <div>
                    {#if note.Tags || tagsPlaceholder}
                        <Tags class="w-full "
                            a='Tags'
                            s='prose'
                            onSelect={onTagsChanged}
                            getGlobalTags={() => allTags}
                            allowNewTags={false}
                            bind:this={tags}/>
                    {/if}
                </div>
            </section>
            
            {#if selectedAttachements && selectedAttachements.length > 0}
                {#each selectedAttachements as att}
                    <span class="mx-1 px-1  text-nowrap
                                    border rounded border-stone-300 dark:border-stone-600
                                    text-xs">
                        {att.name}
                    </span>    
                {/each}
                <button class="w-3 h-3 mt-1" on:click={clearAttachements}>
                    <FaTimes/>
                </button>
            {/if}
            
                
            <hr/>    

            {#if note.Content || contentPlaceholder}
                <Editor     self={note}
                            a='Content'
                            compact={true}
                            bind:this={contentElement}
                            onApplyChanges={onContentChanged}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={(editorCB) => selectImage(editorCB)}
                            onRemoveImage={removeImage}
                            extraFrontPaletteCommands={extraPaletteCommands}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}/>
            {:else}
                <p class="placeholder"
                    on:click={startDescriptionEditing}>
                    {i18n(["Description. Press '/' to show commands palette", "Descripción. Presiona “/” para mostrar la paleta de comandos.", "Opis. Naciśnij „/”, aby wyświetlić paletę poleceń."])}
                    
                </p>
            {/if}

            {#if true}
            {@const disabled = false}
            {@const styleFont = disabled ? "text-stone-400 dark:text-stone-500" : "text-stone-700 dark:text-stone-300 dark:hover:text-white"}
            {@const styleBg = disabled ? "" : "hover:bg-stone-200 dark:hover:bg-stone-800"}
            <section class="mt-20 flex flex-row justify-end mr-2 ml-2 mb-1 gap-2">
                <button type="button" 
                        class="
                        py-2.5 px-4 
                        text-sm  
                        hover:bg-stone-200 dark:hover:bg-stone-800 
                        border border-stone-300 focus:outline-none dark:border-stone-600
                        flex items-center rounded"
                        on:click={(e) => {askLeaveQuestion()}}>
                    <span class="ml-1">_; Cancel; Cancelar; Anuluj</span>
                    
                </button>
                <button type="button" 
                        class="
                        py-2.5 px-4 
                        text-sm {styleFont} {styleBg}
                        border border-stone-300 focus:outline-none dark:border-stone-600
                        flex items-center rounded"
                        on:click={(e) => {postQuestion()}}
                        {disabled}>
                    <div class="w-5 h-5 mr-1"><FaPaperPlane/></div>
                    <span class="ml-2">_; Publish; Publicar; Opublikuj</span>
                    
                </button>
            </section>
            {/if}
        </article>
        
    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/>
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

<Modal  title={i18n({en: 'Preparing...', es: 'Preparación...', pl: 'Przygotowanie...'})}  
        bind:open={pendingResizing} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/> 
    <span class="ml-3">
         _;
        Your image is preparing;
        Tu imagen se está preparando;
        Twoje zdjęcie jest w trakcie przygotowywania
    </span>
</Modal>

<Modal  title={i18n({en: 'Leave', es: 'Salir', pl: 'Opuść'})}
        content={i18n({en: 'Are you sure you want to leave the creation of a new post?', es: '¿Estás seguro de que deseas abandonar la creación de una nueva publicación?', pl: 'Czy na pewno chcesz zrezygnować z tworzenia nowego posta?'})}
        icon={FaTimes}
        onOkCallback={leaveQuestion}
        bind:this={leaveModal}
        />

<style>
    .placeholder {
        color: var(--tw-prose-lead)
    }

    .placeholder.dark {
        color: var(--tw-prose-lead-invert)
    }
</style>