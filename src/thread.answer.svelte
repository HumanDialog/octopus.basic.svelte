<script>
    import {reef, session} from '@humandialog/auth.svelte'
	import  {  getNiceStringDateTime, onErrorShowAlert, isDeviceSmallerThan, Modal, Spinner, resizeImage,
                Editor, activateItem, isActive, clearActiveItem, IcH1, IcH2, IcH3, IcH4, i18n
            } from '@humandialog/forms.svelte'

    import {link} from 'svelte-spa-router'

    import {FaFont, FaPen, FaSave, FaCloudUploadAlt, FaPaperclip, FaImage, FaTable, FaBold, FaItalic, FaUnderline,
        FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo, FaListUl

    } from 'svelte-icons/fa'

    import AttachedFile from './attached.file.svelte'
	
    export let note;


    $: updateData();
    
    let isReadOnly = false
    let creationDate = '';
    let attachedFiles = []
    let contentElement;
    
    function updateData(...args)
    {
        if(note.CreationDate)
        {
            const d = new Date(note.CreationDate)
            creationDate = getNiceStringDateTime(d)
        }
        else
            creationDate = '';

        attachedFiles = []
        if(note.AttachedFiles)
        {
            const names = note.AttachedFiles.split(';');
            names.forEach(n => {
                attachedFiles.push({
                    name: n,
                    downloading: false
                })
            })
        }

        isReadOnly = true; //(note.$acc & 0x2) == 0
    }

    async function reloadData()
    {
        let res = await reef.post(`${note.$ref}/query`, 
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 4,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:[   'Id', 
                                                    'Index', 
                                                    'Title',
                                            //      'Summary', 
                                                    'Content', 
                                                    'CreationDate',
                                                    'ModificationDate',
                                                    'Images',
                                                    'AttachedFiles', 
                                                    'Tags', 
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
                                            Expressions:['$ref', 'Name', 'href']
                                        }
                                    ]
                                }
                            ]
                        },
                        onErrorShowAlert)
        
        note = res.Note
        updateData();
    }

    
    async function onContentChanged(content)
    {
        note.Content = content;
        await reef.post(`${note.$ref}/SetContent`, {val: content}, onErrorShowAlert)
    }

   
    function getPageOperationsWithFormattingTools()
    {
        return {
            opver: 2,
            fab: 'M00',
            operations: [
                {
                    caption: 'Post',
                    preAction: contentElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Save; Guardar; Zapisz',
                            icon: FaSave,
                            action: (f) => { contentElement?.save() },
                            tbr: 'A',
                            hideToolbarCaption: true
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
                /*        {
                            caption: 'Comment',
                            icon: FaComment,
                            action: (f) => contentElement.setComment(),
                            activeFunc: contentElement.isActiveComment,
                        },*/
                        {
                            caption: '_; Quote; Cita; Cytat',
                            icon: FaQuoteRight,
                            action: (f) => contentElement.setQuote(),
                            activeFunc: contentElement.isActiveQuote,
                        },
                /*        {
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
    }

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

    let attInput;
    let pendingUploading = false
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

            const res = await reef.post(`${note.$ref}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
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
                    if(res.ok)
                    {
                        
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
 
    let imgInput;
    let imgEditorActionAfterSuccess;
    function selectImage(finishEditorCb)
    {
        imgEditorActionAfterSuccess = finishEditorCb;
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
            
            const res = await reef.post(`${note.$ref}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
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
                        const dataPath = `${note.$ref}/Images/blob?key=${newKey}`
                            
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

    function removeImage(url)
    {
        reef.delete(url, onErrorShowAlert)
    }

</script>


{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
    
        <section class="w-full flex flex-row justify-between">
                <div class="grow-0">
                    {#if note.CreatedBy}
                        {@const href = note.CreatedBy.href}
                        <h2 class="font-semibold"> 
                            <a {href} use:link>{note.CreatedBy.Name}</a>
                        </h2>
                    {/if}
                </div>
                <div>
                    <h4 class="mt-14">
                        {creationDate}
                    </h4>
                </div>
        </section>

        <!--{#if note.Title}
            <h1>
                {note.Title}
            </h1>
        {/if}

        {#if note.Summary}
                <p  class="lead">
                    {note.Summary}
                </p>
        {/if} -->
        
        <Editor   a='Content'
                    readOnly={isReadOnly}
                    self={note}
                    compact={true}
                    bind:this={contentElement}
                    onApplyChanges={onContentChanged}
                    onFocusCb={activateFormattingTools}
                    onBlurCb={deactivateFormattingToolsIfNeeded}
                    onAddImage={selectImage}
                    onRemoveImage={removeImage}
                    />

        {#if attachedFiles && attachedFiles.length > 0}
        <p>
            {#each attachedFiles as fileInfo (fileInfo.name)}
                <AttachedFile self={note} a='AttachedFiles' {fileInfo}/>
            {/each}
        </p>
        {/if}
        
        {#if !isReadOnly}
            <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/>
            <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>

            <Modal  title={i18n({en: 'Uploading...', es: 'Cargando...', pl: 'Przesyłanie...'})} 
                     bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
                <Spinner delay={0}/> 
                <span class="ml-3">
                    _;
                    Your file is uploading to the server;
                    Tu archivo se está cargando en el servidor;
                    Twój plik jest przesyłany na serwer
                </span>
            </Modal>
        {/if}
{/if}


