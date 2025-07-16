<script>
    import {reef, session} from '@humandialog/auth.svelte'
	import  { Editor,
            Page,
            Combo,
            ComboSource,
            ComboItem,
            DatePicker,
            Tags,
            editable,
			saveCurrentEditable,
			activateItem,
			isActive,
			clearActiveItem,
			isDeviceSmallerThan,
            onErrorShowAlert,
            Modal,
			Spinner,
            resizeImage,
            reloadVisibleTags,
			getNiceStringDate,
            IcH1, IcH2, IcH3, IcH4,
            informModification,
			pushChanges,
            hasModifications,
            refreshToolbarOperations,
            informModificationEx
            } from '@humandialog/forms.svelte'
	import { onMount, tick } from 'svelte';
    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList, FaCopy, FaFileDownload,
        FaImage, FaTable, FaPaperclip, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle,
        FaInfo, FaListUl
    } from 'svelte-icons/fa/'


    import AttachedFile from './attached.file.svelte'

    let noteRef = ''
    let note = null;
    let allTags = '';

    let availableStates = [];
    let pendingUploading = false;
    let isReadOnly = false;
    const s = session;
    let creationDate = null
    let modificationDate = null
    let attachedFiles = []

    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('note: ', $location)
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'note');
        if(foundIdx < 0)
            return;

        const taskId = segments[segments.length-1]
        noteRef = `./Note/${taskId}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res
            reloadVisibleTags()
        })

       await reloadData();
    }

    async function reloadData()
    {
        if(!noteRef)
            return;

        let res = await reef.post(`${noteRef}/query`,
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 3,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:[   'Id',
                                                    'Index',
                                                    'Title',
                                                    'Summary',
                                                    'Content',
                                                    'CreationDate',
                                                    'ModificationDate',
                                                    'Tags',
                                                    'AttachedFiles',
                                                    'Kind',
                                                    'State',
                                                    '$ref',
                                                    '$type',
                                                    '$acc'],
                                    SubTree:[
                                        {
                                            Id: 11,
                                            Association: 'CreatedBy',
                                            Expressions:['$ref', 'Name', 'href']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'ModifiedBy',
                                            Expressions:['$ref', 'Name']
                                        }
                                    ]
                                }
                            ]
                        },
                        onErrorShowAlert)

        note = res.Note

        if(note.CreationDate)
            creationDate = new Date(note.CreationDate)
        else
            creationDate = null

        if(note.ModificationDate)
            modificationDate = new Date(note.ModificationDate)
        else
            modificationDate = null

        isReadOnly = (note.$acc & 0x2) == 0

        if(note.AttachedFiles)
        {
            attachedFiles = []
            const names = note.AttachedFiles.split(';');
            names.forEach(n => {
                attachedFiles.push({
                    name: n,
                    downloading: false
                })
            })
        }

    }

    async function onTitleChanged(text)
    {
        note.Title = text;
        informModification(note, 'Title')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetTitle`, {val: text}, onErrorShowAlert)
    }

    async function onSummaryChanged(text)
    {
        note.Summary = text;
        informModification(note, 'Summary')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetSummary`, {val: text}, onErrorShowAlert)

    }

    function onPropertySingleChange(txt, attrib)
    {
        //note[attrib] = txt
        //informModification(note, attrib)
        informModificationEx(note.$type, note.Id, attrib, txt)
        refreshToolbarOperations()
    }

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        note.Tags = tags;
        informModification(note, 'Tags')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetTags`, {val: tags}, onErrorShowAlert)
    }

    
    let summary;
    let summaryPlaceholder = false;

    let dueDate;
    let dueDatePlaceholder = false


    let createdBy;
    let responsiblePlaceholder = false

    let tags;
    let tagsPlaceholder = false



    let description;
    let descriptionPlaceholder = false;



    let addOperations = [
        {
            caption: 'Summary',
            action: async (f) =>
                {
                    if(summary)
                        summary.focus();
                    else
                    {
                        summaryPlaceholder = true;
                        await tick();
                        summary?.focus();
                    }
                }
        },


        {
            caption: 'Tag',
            icon: FaTag,
            action: async (f) => runTagInserter()
        },

        {
            separator: true
        },
        {
            caption: 'Attachement',
            icon: FaFileDownload,
            action: async (f) => runFileAttacher()
        },
        {
            caption: 'Content',
            icon: FaAlignLeft,
            action: async (f) =>
                {
                    if(description)
                        description.run();
                    else
                    {
                        descriptionPlaceholder = true;
                        await tick();
                        description?.run(() => {descriptionPlaceholder = false})
                    }
                }
        }
    ];

    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: 'Note',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: 'Save',
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },
                        {
                            caption: 'Add to Clipboard',
                            icon: FaCopy,   // MdLibraryAdd
                            action: (f) => copyTaskToBasket(),
                            fab: 'M03',
                            tbr: 'A'

                        }
                    ]
                }
            ]
        }
    }

    async function copyTaskToBasket()
    {
        await reef.post(`${noteRef}/CopyToBasket`, { } , onErrorShowAlert);
    }



    function getPageOperationsWithFormattingTools()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            preAction: description.preventBlur,
            operations: [
                {
                    caption: 'Styles',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Normal',
                            icon: FaRemoveFormat,
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setNormal(),
                            activeFunc: description.isActiveNormal,
                        },
                        {
                            caption: 'Heading 1',
                            icon: IcH1,
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setHeading(1),
                            activeFunc: description.isActiveH1
                        },
                        {
                            caption: 'Heading 2',
                            icon: IcH2,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(2),
                            activeFunc: description.isActiveH2
                        },
                        {
                            caption: 'Heading 3',
                            icon: IcH3,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(3),
                            activeFunc: description.isActiveH3
                        },
                        {
                            caption: 'Heading 4',
                            icon: IcH4,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(4),
                            activeFunc: description.isActiveH4
                        },
                        {
                            caption: 'Code',
                            icon: FaCode,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setCode(),
                            activeFunc: description.isActiveCode
                        },
                        {
                            caption: 'Quote',
                            icon: FaQuoteRight,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setQuote(),
                            activeFunc: description.isActiveQuote
                        },
                        {
                            caption: 'BulletList',
                            icon: FaListUl,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setBulletList(),
                            activeFunc: description.isActiveBulletList

                        },
                    ]
                },
                {
                    caption: 'Text',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Bold',
                            icon: FaBold,
                            action: (f) => description.setBold(),
                            activeFunc: description.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Italic',
                            icon: FaItalic,
                            action: (f) => description.setItalic(),
                            activeFunc: description.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Underline',
                            icon: FaUnderline,
                            action: (f) => description.setUnderline(),
                            activeFunc: description.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Strikethrough',
                            icon: FaStrikethrough,
                            action: (f) => description.setStrikethrough(),
                            activeFunc: description.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: 'Insert',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Image',
                            icon: FaImage,
                            action: (f) => description.setImage(),
                            activeFunc: description.isActiveImage,
                            tbr: 'A', hideToolbarCaption: true
                        },
                        {
                            caption: 'Table',
                            icon: FaTable,
                            action: (f) => description.setTable(),
                            activeFunc: description.isActiveTable
                        },
                        {
                            caption: 'Attachement',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Tag',
                            icon: FaTag,
                            action: (f) => runTagInserter()
                        }
                    ]
                },
                {
                    caption: 'Note',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Save',
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => description?.save(),
                       //     fab: 'S00',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            grid: addOperations,
                        //    fab: 'M10',
                        //    tbr: 'A'
                        },
                        {
                            caption: 'Add to Clipboard',
                            icon: FaCopy,   // MdLibraryAdd
                            action: (f) => copyTaskToBasket(),
                        //    fab: 'M04',
                        //    tbr: 'A'

                        }
                    ]
                }
            ]
        }

    }
    const extraPaletteCommands = []

    const extraPaletteCommandsExt = [
        {
            caption: 'Save',
            icon: FaSave,
            action: () => description?.save(),
        },
        {
            caption: 'Add to Clipboard',
            icon: FaCopy,   // MdLibraryAdd
            action: () => copyTaskToBasket(),
        }
    ]
    const extraInsertPalletteCommands = []

    const extraInsertPalletteCommandsExt = [
        {
            caption: 'Attachement',
            icon: FaPaperclip,
            action: runFileAttacher
        },
        {
            caption: 'Tag',
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

    let imgInput;
    let imgEditorActionAfterSuccess;
    function uploadImage(editorActionAfterSuccess)
    {
        imgEditorActionAfterSuccess = editorActionAfterSuccess;
        imgInput?.click();
    }

    async function onImageSelected()
    {
        const [file] = imgInput.files;
        if(file)
        {
            pendingUploading = true

            let resizedImage = await resizeImage(file, 1024, 1024)
            if(!resizedImage)
                resizedImage = file

            const res = await reef.post(`${noteRef}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
            if(res && res.key && res.uploadUrl)
            {
                const newKey = res.key;
                const uploadUrl = res.uploadUrl

                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': resizedImage.type
                                                }),
                                                body: resizedImage})
                    if(res.ok)
                    {
                        // todo: editor path imgPath
                        const dataPath = `${noteRef}/Images/blob?key=${newKey}`

                        //console.log('upload success for ', dataPath)
                        if(imgEditorActionAfterSuccess)
                            imgEditorActionAfterSuccess(dataPath)
                    }
                    else
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

            pendingUploading = false;

            await reloadData();
        }
    }

    function removeImage(dataPath)
    {
        reef.delete(dataPath, onErrorShowAlert)
    }

    async function runTagInserter()
    {
        if(tags)
            tags.show();
        else
        {
            tagsPlaceholder = true;
            await tick();
            tags?.show(undefined, () => {tagsPlaceholder = false})
        }
    }

    let attInput;
    function runFileAttacher()
    {
        attInput?.click();
    }

    async function onAttachementSelected()
    {
        const [file] = attInput.files;
        if(file)
        {
            pendingUploading = true

            const res = await reef.post(`${noteRef}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
            if(res && res.key && res.uploadUrl)
            {
                const newKey = res.key;
                const uploadUrl = res.uploadUrl

                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': file.type
                                                }),
                                                body: file})
                    if(res.ok)
                    {
                        // todo: editor path imgPath
                        /*const dataPath = `${taskRef}/Images/blob?key=${newKey}`

                        //console.log('upload success for ', dataPath)
                        if(imgEditorActionAfterSuccess)
                            imgEditorActionAfterSuccess(dataPath)
                        */
                    }
                    else
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

            pendingUploading = false;

            await reloadData();
        }
    }

</script>

<svelte:head>
    {#if note && note.Title}
        <title>{note.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={note}
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={note.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl ">
            <section class="w-full flex flex-row justify-between">
                    <p class="">
                        {note.Index}
                    </p>
                    <!--div>
                        {#if note.TaskList || onListPlaceholder}
                            <Combo  compact
                                    inContext='data'
                                    a='TaskList'
                                    isAssociation
                                    icon={false}
                                    placeholder='List'
                                    s='prose'
                                    hasNone={false}
                                    bind:this={onList}>
                                <ComboSource    objects={allLists}
                                                key="$ref"
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div-->
                    <div>
                        {#if creationDate}
                            <p>
                                {getNiceStringDate(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section>

            <h1     class=""
                    use:editable={{
                        action: (text) => onTitleChanged(text),
                        onSingleChange: (txt) => onPropertySingleChange(txt, 'Title'),
                        active: true,
                        readonly: isReadOnly}}
                        tabindex="0">
                {note.Title}
            </h1>

            {#if note.Summary || summaryPlaceholder}
                {#key note.Summary}
                    <p  class="lead"
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            onSingleChange: (txt) => onPropertySingleChange(txt, 'Summary'),
                            active: true,
                            readonly: isReadOnly}}
                        tabindex="0"
                        bind:this={summary}>
                        {note.Summary}
                    </p>
                {/key}

           {/if}

            <section class="w-full flex flex-row flex-wrap justify-between">
                <div class="grow-0">
                    {#if note.CreatedBy}
                        {@const href = `${note.CreatedBy.href}`}
                        <a {href} use:link> {note.CreatedBy.Name} </a>
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
                            {onUpdateAllTags}
                            canChangeColor
                            bind:this={tags}/>
                    {/if}
                </div>
            </section>


            {#if attachedFiles && attachedFiles.length > 0}
            <p>
                {#each attachedFiles as fileInfo (fileInfo.name)}
                    <AttachedFile self={note} a='AttachedFiles' {fileInfo}/>
                {/each}
            </p>
            {/if}

            <!--{#if note.Content || descriptionPlaceholder}-->
                <hr/>
                <Editor     class="mb-40"
                            a='Content'
                            compact={true}
                            bind:this={description}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            extraFrontPaletteCommands={extraPaletteCommands}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}/>
            <!--{/if}-->

        </article>



    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

<Modal title='Uploading...' bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">Your file is uploading to the server</span>
</Modal>
