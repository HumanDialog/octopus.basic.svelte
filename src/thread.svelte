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
			getNiceStringDateTime,
            IcH1,
            IcH2,
            IcH3,
            IcH4,
            reloadVisibleTags
            } from '@humandialog/forms.svelte'
	import { afterUpdate, tick } from 'svelte';
    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaTimes, FaAlignLeft,FaCheck, FaTag, FaUser, FaCalendarAlt, FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen,
        FaCommentMedical, FaRegStar, FaStar, FaPaperPlane, FaPaperclip, FaPlus, FaComment, FaQuoteRight, FaInfo, FaListUl,
        FaImage, FaTable, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaExclamationTriangle, FaCopy
    } from 'svelte-icons/fa/'

    import FaCommentPlus from './icons/post.plus.svelte'
    import AnswerPost from './thread.answer.svelte'
    import AttachedFile from './attached.file.svelte'

    let noteRef = ''
    let note = null;
    let allTags = '';

    let attachedFiles = []
    let pendingResizing = false;
    let pendingPosting = false;
    let pendingUploading = false;
    let isReadOnly = false;
    const s = session;
    let creationDate = null
    let modificationDate = null

    let user = null

    let postResponses = []
    let mobile = isDeviceSmallerThan("sm")
    let scrollToPost = 0

    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('note: ', $location)
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'thread');
        if(foundIdx < 0)
            return;

        if(!user)
        {
            reef.get('user?fields=$ref,Name,Email', onErrorShowAlert).then((res) => {
                if(res)
                {
                    user = res.User;
                }
            })
        }

        const taskId = parseInt(segments[segments.length-1])

        const params = new URLSearchParams($querystring);
        if(params.has("res"))
            scrollToPost = parseInt(params.get("res"))
        else
            scrollToPost = 0

        noteRef = `./Note/${taskId}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res
            reloadVisibleTags()
        });

       await reloadData();
    }

    afterUpdate(() => {
        if(scrollToPost)
        {
            const answer = document.getElementById(`__hd_thread_answer_${scrollToPost}`)
            if(answer)
            {
                answer?.scrollIntoView(true)
                scrollToPost = 0
            }
        }
    })

    async function reloadData()
    {
        if(!noteRef)
            return;

        let res = await reef.post(`${noteRef}/query`,
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
                                        },
                                        {
                                            Id: 13,
                                            Association: 'Notes',
                                            Sort: "Order",
                                            Expressions:["Id","Order"],
                                            SubTree:[
                                                {
                                                    Id: 131,
                                                    Association: "Note",
                                                    Recursive: 1
                                                }
                                            ]
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

        postResponses = [];
        if(note.Notes && note.Notes.length > 0)
        {
            note.Notes.forEach(nn => {
                postResponses.push(nn.Note)
            })
        }
        else
            postResponses = [];

    }

    async function onTitleChanged(text)
    {
        note.Title = text;
        await reef.post(`${noteRef}/SetTitle`, {val: text}, onErrorShowAlert)
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
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        note.Tags = tags;
        await reef.post(`${noteRef}/SetTags`, {val: tags}, onErrorShowAlert)
    }

    async function onContentChanged(content)
    {
        note.Content = content;
        await reef.post(`${noteRef}/SetContent`, {val: content}, onErrorShowAlert)
    }


    let tags;
    let tagsPlaceholder = false


    let questionElement;
    let descriptionPlaceholder = false;

    let addOperations = [
        /*{
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
        */
        {
            caption: 'Attachement',
            icon: FaPaperclip,
            action: (f) => runFileAttacher(ATTACH_FILE_DIRECT)
        },
        {
            caption: 'Tag',
            icon: FaTag,
            action: async (f) =>
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
        },

    ];

    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: 'Thread',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: 'Reply',
                            icon: FaCommentPlus,
                            action: (f) => runAnswerEditor(),
                            tbr: 'A',
                            fab: 'M02'

                        },
                        ... !isReadOnly ? [
                            {
                               icon: FaSave,
                                action: (f) => saveCurrentEditable(),
                                tbr: 'A',
                                fab: 'M03'
                            },
                            {
                                icon: FaPen,
                                grid: addOperations,
                                tbr: 'A',
                                fab: 'M03'
                            }
                        ] : [],
                        {
                            caption: 'Follow',
                            icon: FaRegStar,        // FaStar
                            action: (f) => {} ,
                        },
                        {
                            icon: FaCopy,   // MdLibraryAdd
                            caption: 'Add to Clipboard',
                            action: (f) => copyTaskToBasket(),

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
            operations: [
                {
                    caption: 'Thread',
                    preAction: questionElement.preventBlur,
                    operations: [
                        {
                            caption: "Save",
                            icon: FaSave,
                            action: (f) => { questionElement?.save() },
                            tbr: 'A'
                        }
                    ]
                },
                {
                    caption: 'Insert',
                    preAction: questionElement.preventBlur,
                    tbr: 'B',
                    operations: [
                        {
                            caption: 'Image',
                            icon: FaImage,
                            action: (f) => questionElement.setImage(),
                            activeFunc: questionElement.isActiveImage,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Table',
                            icon: FaTable,
                            action: (f) => questionElement.setTable(),
                            activeFunc: questionElement.isActiveTable
                        },
                        {
                            caption: 'Attachement',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(ATTACH_FILE_DIRECT),
                            tbr: 'A'
                        },
                        {
                            caption: 'Tag',
                            icon: FaTag,
                            action: async (f) =>
                                {
                                    if(tags)
                                        tags.show();
                                    else
                                    {
                                        tagsPlaceholder = true;
                                        await tick();
                                        tags?.show(undefined, () => {tagsPlaceholder = false})
                                    }
                                },
                            tbr: 'A'
                        },
                    ]
                },
                {
                    caption: 'Text',
                    tbr: 'B',
                    preAction: questionElement.preventBlur,
                    operations: [
                        {
                            caption: 'Bold',
                            icon: FaBold,
                            action: (f) => questionElement.setBold(),
                            activeFunc: questionElement.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Italic',
                            icon: FaItalic,
                            action: (f) => questionElement.setItalic(),
                            activeFunc: questionElement.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Underline',
                            icon: FaUnderline,
                            action: (f) => questionElement.setUnderline(),
                            activeFunc: questionElement.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Strikethrough',
                            icon: FaStrikethrough,
                            action: (f) => questionElement.setStrikethrough(),
                            activeFunc: questionElement.isActiveStrikethrough,
                        }
                    ]
                },
                {
                    caption: 'Styles',
                    tbr: 'B',
                    preAction: questionElement.preventBlur,
                    operations: [
                        {
                            caption: 'Normal',
                            icon: FaRemoveFormat,
                            action: (f) => questionElement.setNormal(),
                            activeFunc: questionElement.isActiveNormal,
                        },
                        {
                            caption: 'Heading 1',
                            icon: IcH1,
                            action: (f) => questionElement.setHeading(1),
                            activeFunc: questionElement.isActiveH1
                        },
                        {
                            caption: 'Heading 2',
                            icon: IcH2,
                            action: (f) => questionElement.setHeading(2),
                            activeFunc: questionElement.isActiveH2
                        },
                        {
                            caption: 'Heading 3',
                            icon: IcH3,
                            action: (f) => questionElement.setHeading(3),
                            activeFunc: questionElement.isActiveH3
                        },
                        {
                            caption: 'Heading 4',
                            icon: IcH4,
                            action: (f) => questionElement.setHeading(4),
                            activeFunc: questionElement.isActiveH4
                        },
                        {
                            caption: 'Code',
                            icon: FaCode,
                            action: (f) => questionElement.setCode(),
                            activeFunc: questionElement.isActiveCode,
                        },
                        {
                            caption: 'Comment',
                            icon: FaComment,
                            action: (f) => questionElement.setComment(),
                            activeFunc: questionElement.isActiveComment,
                        },
                        {
                            caption: 'Quote',
                            icon: FaQuoteRight,
                            action: (f) => questionElement.setQuote(),
                            activeFunc: questionElement.isActiveQuote,
                        },
                        {
                            caption: 'Warning',
                            icon: FaExclamationTriangle,
                            action: (f) => questionElement.setWarning(),
                            activeFunc: questionElement.isActiveWarning,
                        },
                        {
                            caption: 'Info',
                            icon: FaInfo,
                            action: (f) => questionElement.setInfo(),
                            activeFunc: questionElement.isActiveInfo,
                        },
                        {
                            caption: 'BulletList',
                            icon: FaListUl,
                            action: (f) => questionElement.setBulletList(),
                            activeFunc: questionElement.isActiveBulletList,
                            tbr: 'A'
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


    const SELECT_IMAGE_DIRECT = 0
    const SELECT_IMAGE_TEMPORARY = 1
    let selectImageMode = SELECT_IMAGE_DIRECT

    let selectedImages = []
    let selectedAttachements = []
    let imgInput;
    let attInput;
    let imgEditorActionAfterSuccess;

    function selectImage(finishEditorCb, mode)
    {
        imgEditorActionAfterSuccess = finishEditorCb;
        selectImageMode = mode

        imgInput?.click();
    }

    async function onImageSelected()
    {
        switch(selectImageMode)
        {
        case SELECT_IMAGE_DIRECT:
            return await onImageSelected_Direct();

        case SELECT_IMAGE_TEMPORARY:
            return await onImageSelected_Temporary();
        }
    }

    async function onImageSelected_Temporary()
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

            answerElement.addTemporaryImage(selectedImageInfo.url)

            selectedImages = [...selectedImages, selectedImageInfo];
            pendingResizing = false;
        }
    }

    async function onImageSelected_Direct()
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

    function removeImage(url, mode)
    {
        if(mode == SELECT_IMAGE_TEMPORARY)
        {
            const idx = selectedImages.findIndex(i => i.url == url)
            if(idx >= 0)
                selectedImages.splice(idx, 1)
        }
        else if(mode == SELECT_IMAGE_DIRECT)
        {
            reef.delete(url, onErrorShowAlert)
        }
    }


    const ATTACH_FILE_DIRECT    = 0
    const ATTACH_TEMPORARY_FILE = 1
    let attachFileMode = ATTACH_FILE_DIRECT

    function runFileAttacher(mode = ATTACH_FILE_DIRECT)
    {
        attachFileMode = mode
        attInput?.click();
    }

    function onAttachementSelected()
    {
        switch(attachFileMode)
        {
        case ATTACH_FILE_DIRECT:
            onAttachementSelected_Direct()
            break;

        case ATTACH_TEMPORARY_FILE:
            onAttachementSelected_Temporary()
            break;
        }
    }

    function onAttachementSelected_Temporary()
    {
        if(attInput.files.length > 0)
        {
            selectedAttachements = [...selectedAttachements, ...attInput.files]
        }
    }

    async function onAttachementSelected_Direct()
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

    function onRemoveAttachement(idx)
    {
        selectedAttachements.splice(idx, 1);
    }

    function clearAttachements()
    {
        selectedAttachements = []
    }

    let answerElement;
    let isAnswerEditorLaunched = false;
    let answerNote = {
        Title: '',
        Summary: '',
        Content: '',
        Images: '',
        AttachedFiles: ''
    }

    async function runAnswerEditor()
    {
        if(!isAnswerEditorLaunched)
        {
            answerNote.Title = ''
            answerNote.Summary = ''
            answerNote.Content = ''
            answerNote.Images = ''
            answerNote.AttachedFiles = ''

            selectedImages = []
            selectedAttachements = []

            isAnswerEditorLaunched = true;
        }

        if(answerElement)
        {
            answerElement.run();
            answerElement.scrollIntoView({
                    block: "end"
                })
        }
        else
        {
            isAnswerEditorLaunched = true;
            await tick();
            answerElement?.run();
            answerElement.scrollIntoView({
                    block: "end"
                })
        }
    }


    let leaveModal;
    function askLeaveAnswer()
    {
        leaveModal.show()
    }

    async function leaveAnswer()
    {
        leaveModal.hide();
        isAnswerEditorLaunched = false;
        deactivateAnswerToolsIfNeeded();
    }


    async function postAnswer()
    {
        pendingPosting = true;
        const originalPostContent = answerElement.getInnerHtml()
        answerNote.Content = originalPostContent

        if(selectedImages.length==0 && selectedAttachements.length==0)
        {
            const res = await reef.post(`${noteRef}/AddPost`, {
                    content: answerNote.Content
                }, onErrorShowAlert)

            if(!res)
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

            const answerRef = res.Note.$ref;

            //2. post images
            for(let i=0; i<selectedImages.length; i++)
            {
                let imageInfo = selectedImages[i];

                const res = await reef.post(`${answerRef}/Images/blob?name=${imageInfo.name}&size=${imageInfo.image.size}`, {}, onErrorShowAlert)
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

                        const dataPath = `${answerRef}/Images/blob?key=${newKey}`
                        answerElement.replaceTemporaryImage(imageInfo.url, dataPath)

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

                        answerElement.removeTemporaryImage(imageInfo.url)
                    }
                }
                else
                {
                    answerElement.removeTemporaryImage(imageInfo.url)
                }
            }

            for(let i=0; i<selectedAttachements.length; i++)
            {
                const file = selectedAttachements[i];
                const res = await reef.post(`${answerRef}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
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

            answerNote.Content = answerElement.getInnerHtml()


            const res2 = await reef.post(`${noteRef}/AttachPost`, {
                note: answerRef,
                content: answerNote.Content
            }, onErrorShowAlert)

            if(!res2)
            {
                // can't attach new post with attachements
                // should we show any message to user?

                answerElement.setInnerHtml(originalPostContent)
                answerNote.Content = answerElement.getInnerHtml()
                pendingPosting = false;
                return;
            }
        }

        isAnswerEditorLaunched = false;
        deactivateAnswerToolsIfNeeded();
        pendingPosting = false;
        await reloadData();
    }

    function onAnswerEdit(content)
    {
        answerNote.Content = content
    }

    function activateAnswerTools()
    {
        let operations = {
                opver: 2,
                fab: 'M00',
                operations: [
                    {
                        caption: 'Reply',
                        preAction: answerElement.preventBlur,
                        tbr: 'B',
                        operations:[
                            {
                                caption: 'Publish',
                                icon: FaPaperPlane,
                                action: (f) => { postAnswer() },
                                tbr: 'A'
                            },
                            {
                                caption: 'Cancel answering',
                                icon: FaTimes,
                                action: (f) => { askLeaveAnswer() },
                            }
                        ]
                    },
                    {
                        caption: 'Insert',
                        tbr: 'B',
                        preAction: answerElement.preventBlur,
                        operations: [
                            {
                                caption: 'Image',
                                icon: FaImage,
                                action: (f) => answerElement.setImage(),
                                activeFunc: answerElement.isActiveImage,
                                tbr: 'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: 'Table',
                                icon: FaTable,
                                action: (f) => answerElement.setTable(),
                                activeFunc: answerElement.isActiveTable
                            },
                            {
                                caption: 'Attachement',
                                icon: FaPaperclip,
                                action: (f) => runFileAttacher(ATTACH_TEMPORARY_FILE),
                                tbr: 'A',
                                hideToolbarCaption: true
                            }
                        ]
                    },
                    {
                    caption: 'Text',
                    tbr: 'B',
                    preAction: answerElement.preventBlur,
                    operations: [
                        {
                            caption: 'Bold',
                            icon: FaBold,
                            action: (f) => answerElement.setBold(),
                            activeFunc: answerElement.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Italic',
                            icon: FaItalic,
                            action: (f) => answerElement.setItalic(),
                            activeFunc: answerElement.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Underline',
                            icon: FaUnderline,
                            action: (f) => answerElement.setUnderline(),
                            activeFunc: answerElement.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Strikethrough',
                            icon: FaStrikethrough,
                            action: (f) => answerElement.setStrikethrough(),
                            activeFunc: answerElement.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: 'Styles',
                    tbr: 'B',
                    preAction: answerElement.preventBlur,
                    operations: [
                        {
                            caption: 'Normal',
                            icon: FaRemoveFormat,
                            action: (f) => answerElement.setNormal(),
                            activeFunc: answerElement.isActiveNormal,
                        },
                        {
                            caption: 'Heading 1',
                            icon: IcH1,
                            action: (f) => answerElement.setHeading(1),
                            activeFunc: answerElement.isActiveH1
                        },
                        {
                            caption: 'Heading 2',
                            icon: IcH2,
                            action: (f) => answerElement.setHeading(2),
                            activeFunc: answerElement.isActiveH2
                        },
                        {
                            caption: 'Heading 3',
                            icon: IcH3,
                            action: (f) => answerElement.setHeading(3),
                            activeFunc: answerElement.isActiveH3
                        },
                        {
                            caption: 'Heading 4',
                            icon: IcH4,
                            action: (f) => answerElement.setHeading(4),
                            activeFunc: answerElement.isActiveH4
                        },
                        {
                            caption: 'Code',
                            icon: FaCode,
                            action: (f) => answerElement.setCode(),
                            activeFunc: answerElement.isActiveCode,
                        },
                        {
                            caption: 'Comment',
                            icon: FaComment,
                            action: (f) => answerElement.setComment(),
                            activeFunc: answerElement.isActiveComment,
                        },
                        {
                            caption: 'Quote',
                            icon: FaQuoteRight,
                            action: (f) => answerElement.setQuote(),
                            activeFunc: answerElement.isActiveQuote,
                        },
                        {
                            caption: 'Warning',
                            icon: FaExclamationTriangle,
                            action: (f) => answerElement.setWarning(),
                            activeFunc: answerElement.isActiveWarning,
                        },
                        {
                            caption: 'Info',
                            icon: FaInfo,
                            action: (f) => answerElement.setInfo(),
                            activeFunc: answerElement.isActiveInfo,
                        },
                        {
                            caption: 'BulletList',
                            icon: FaListUl,
                            action: (f) => answerElement.setBulletList(),
                            activeFunc: answerElement.isActiveBulletList,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                    ]
                }
                ]
            }


        activateItem('props', answerNote, operations)
    }

    const extraPaletteCommands = [
        {
            caption: 'Publish',
            icon: FaPaperPlane,
            action: () => postAnswer()
        },
        {
            caption: 'Cancel answering',
            icon: FaTimes,
            action: () => askLeaveAnswer()
        }
    ]

    const extraInsertPaletteCommands = [
         {
            caption: 'Attachement',
            icon: FaPaperclip,
            action: () => runFileAttacher(ATTACH_TEMPORARY_FILE)
        }
    ]

    function deactivateAnswerToolsIfNeeded()
    {
        if(isActive('props', answerNote))
            clearActiveItem('props')
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
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
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
                                {getNiceStringDateTime(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section>

            <h1     class=""
                    use:editable={{
                        action: (text) => onTitleChanged(text),
                        active: true,
                        readonly: isReadOnly}}
                        tabindex="0">
                {note.Title}
            </h1>

            <!--
            {#if note.Summary || summaryPlaceholder}
                {#key note.Summary}
                    <p  class="lead"
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            active: true,
                            readonly: isReadOnly}}
                        tabindex="0"
                        bind:this={summary}>
                        {note.Summary}
                    </p>
                {/key}

           {/if}
           -->

            <section class="w-full flex flex-row flex-wrap justify-between">
                <div class="grow-0">
                    {#if note.CreatedBy}
                        {@const href = note.CreatedBy.href}
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
                        {#key allTags}
                            <Tags class="w-full "
                                a='Tags'
                                s='prose'
                                readOnly={isReadOnly}
                                onSelect={onTagsChanged}
                                getGlobalTags={() => allTags}
                                {onUpdateAllTags}
                                canChangeColor
                                bind:this={tags}/>
                        {/key}
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

                <hr/>
                <Editor     readOnly={isReadOnly}
                            a='Content'
                            compact={true}
                            bind:this={questionElement}
                            onApplyChanges={onContentChanged}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={(editorCB) => selectImage(editorCB, SELECT_IMAGE_DIRECT)}
                            onRemoveImage={(url) => removeImage(url, SELECT_IMAGE_DIRECT)}/>

            {#if postResponses}
                {#each postResponses as post}
                    <hr id="__hd_thread_answer_{post.Id}"/>
                    <AnswerPost note={post}/>
                {/each}
            {/if}

            {#if isAnswerEditorLaunched}
                <hr/>
                <div class="relative left-[-0.5rem] sm:left-[-1rem] pb-1 rounded-lg  bg-stone-50 dark:bg-stone-800">
                    <div class="ml-2 sm:ml-5">
                        <section class="w-full flex flex-row justify-between">
                            <div class="grow-0">
                                {#if user}
                                    <h2 class="font-semibold">
                                        {user.Name}
                                    </h2>
                                {/if}
                            </div>
                            <div>
                                <h4 class="mt-14">
                                    <!--[Not posted] -->
                                </h4>
                            </div>
                        </section>

                        <Editor
                                self={answerNote}
                                a='Content'
                                compact
                                bind:this={answerElement}
                                onApplyChanges={onAnswerEdit}
                                onFocusCb={() => activateAnswerTools()}
                                onBlurCb={() => deactivateAnswerToolsIfNeeded()}
                                onAddImage={(editorCB) => selectImage(editorCB, SELECT_IMAGE_TEMPORARY)}
                                onRemoveImage={(url) => removeImage(url, SELECT_IMAGE_TEMPORARY)}
                                extraFrontPaletteCommands={extraPaletteCommands}
                                extraInsertPaletteCommands={extraInsertPaletteCommands}
                            />

                        <p class="flex flex-row gap-2 flex-wrap">
                            {#if selectedAttachements.length > 0}
                                {#each selectedAttachements as att}
                                    <span class="px-2  text-nowrap
                                                border rounded border-stone-300 dark:border-stone-600
                                                text-xs">
                                        {att.name}
                                    </span>
                                {/each}

                                <button class="w-3 h-3 mt-0.5" on:click={clearAttachements}>
                                    <FaTimes/>
                                </button>

                            {/if}

                        </p>

                        <section class="flex flex-row justify-end mr-2 ml-2 mb-1 gap-2">
                            <button type="button"
                                    class="
                                    py-2.5 px-4
                                    text-sm font-thin text-stone-700 dark:text-stone-300 dark:hover:text-white
                                    hover:bg-stone-200 dark:hover:bg-stone-900 active:bg-stone-200 dark:active:bg-stone-600
                                    border border-stone-300 focus:outline-none dark:border-stone-600
                                    flex items-center rounded"
                                    on:click={(e) => {askLeaveAnswer()}}>
                                <span class="ml-1">Cancel</span>

                            </button>
                            <button type="button"
                                    class="
                                    py-2.5 px-4
                                    text-sm font-thin text-stone-700 dark:text-stone-300 dark:hover:text-white
                                    hover:bg-stone-200 dark:hover:bg-stone-900 active:bg-stone-200 dark:active:bg-stone-600
                                    border border-stone-300 focus:outline-none dark:border-stone-600
                                    flex items-center rounded"
                                    on:click={(e) => {postAnswer()}}>
                                <div class="w-5 h-5 mr-1"><FaPaperPlane/></div>
                                <span class="ml-2">Publish</span>

                            </button>
                        </section>

                    </div>
                </div>
            {:else}
                {#if !mobile}
                    <section class="mt-20 flex flex-row justify-end mr-2 ml-2 mb-1 gap-2">
                        <button type="button"
                                class="
                                py-2.5 px-4
                                text-sm
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-200 dark:hover:bg-stone-800
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded"
                                on:click={(e) => {runAnswerEditor()}}
                                >
                            <div class="w-5 h-5 mr-1"><FaCommentPlus/></div>
                            <span class="ml-2">Reply</span>

                        </button>
                    </section>
                {/if}
            {/if}

        </article>

    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/>
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

<Modal title='Preparing...' bind:open={pendingResizing} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">Your image is preparing</span>
</Modal>

<Modal title='Uploading...' bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">Your file is uploading to the server</span>
</Modal>

<Modal title='Posting...' bind:open={pendingPosting} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">Your post is saved on the server</span>
</Modal>

<Modal  title="Leave"
        content="Are you sure you want to leave the creation of a new post?"
        icon={FaTimes}
        onOkCallback={leaveAnswer}
        bind:this={leaveModal}
        />