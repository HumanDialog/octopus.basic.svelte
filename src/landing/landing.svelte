<script>
	import { signUpHRef } from '@humandialog/auth.svelte';
    import Header from './header.svelte'
    import Footer  from './footer.svelte';
    import {link} from 'svelte-spa-router'
    import {Accordion, AccordionItem} from 'flowbite-svelte'
	
</script>

<svelte:head>
  <title>Octopus | A minimalist workspace for tasks and notes.</title>
  <link rel="canonical" href="https://octopus.objectreef.dev"/>
</svelte:head> 

<div class="min-h-screen h-screen overflow-x-hidden">

    <section class="bg-local bg-cover  sm:sticky sm:top-0 sm:z-50" > <!-- style="background-image: url(b-sv1.jpg)"-->
        <Header main light/>
    </section>


    <div class="bg-gradient-to-b from-slate-200 via-white to-indigo-100 text-gray-900">
        <section class="bg-local bg-cover">
            <div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 pb-8 sm-pb-16">
                <h1
                    class="px-8 sm:px-20 text-slate-800 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center ">
                    Bring order. Calm your mind.
                </h1>
                <h2 class="px-2 sm:px-10 mt-6 pb-10 text-xl sm:text-2xl text-slate-600 text-center max-w-5xl mx-2 ">
                    A minimalist workspace for tasks and notes — designed for clarity, focus, and peace of mind. No noise. Just flow.
                </h2>
                
                <div class="flex flex-row justify-center mt-4">
                    <a href={$signUpHRef} use:link
                        class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center 
                                bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-slate-400
                                focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                ">
                    Get Started for Free
                    </a>
                </div>
            </div>
        </section>

        <section class="bg-local bg-cover py-8 px-4 mx-auto max-w-screen-xl lg:px-6 relative">
            <img src="/landing/octopus-screen-md.png" alt="octopus-screen-lg" 
                    class="hidden sm:block rounded-xl shadow-lg "/>

            <img src="/landing/octopus-screen-sm.png" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg hidden sm:block sm:absolute sm:right-[0px] sm:top-[200px]" />

            <img src="/landing/octopus-kanban-sm.png" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg block sm:hidden absolute right-[0px] top-[100px]" />

            <img src="/landing/octopus-screen-sm.png" alt="octopus-screen-lg" 
                    class="block sm:hidden rounded-xl shadow-lg "/>
        </section>

        <section class="mt-20 mb-10" >
            <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
                <div class="text-center mb-12">
                    <h2 class="mt-4 mx-2 text-center text-4xl font-extrabold text-gray-900 ">
                        Why Octopus?</h2>
                    <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg">
                        Lightweight. Powerful. Peaceful.</p>
                </div>
                <!--div class="flex flex-col sm:flex-row justify-center gap-6 md:gap-12 text-lg font-normal">
                    <div>
                        <ul class="text-gray-500 ">
                            <li>Minimalist design</li>
                            <li>Convenient kanban boards </li>
                            <li>Intuitive interface</li>
                            <li>Pinned tags for tasks</li>
                        </ul>
                    </div>

                    <div>
                        <ul class="text-gray-500 ">
                            <li>Work with the whole team</li>
                            <li>As many lists as you need</li>
                            <li>Task steps</li>
                            <li>Formatable descriptions</li>
                        </ul>
                    </div>
                </div-->

            
            <div class="grid md:grid-cols-3 gap-10 text-left text-gray-800">
            <div>
                <h3 class="text-lg font-semibold mb-1">Tasks & Notes in One Place</h3>
                <p class="text-gray-600">Keep your to-dos and notes side by side — organized, linked, and always in sync.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Folder-based Structure</h3>
                <p class="text-gray-600">Organize everything with a familiar hierarchy. Like a file explorer, but smarter.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Smart Tags</h3>
                <p class="text-gray-600">Add context to tasks and notes with flexible, lightweight tagging.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Attachments Support</h3>
                <p class="text-gray-600">Attach files to tasks or notes. Everything in one place.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Tasklists That Actually Work</h3>
                <p class="text-gray-600">Pin active tasks to focused lists and stay in flow — no distractions.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Kanban Boards</h3>
                <p class="text-gray-600">Visualize your workflow with flexible, customizable columns.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Team-ready by Design</h3>
                <p class="text-gray-600">Assign tasks, set due dates, and collaborate without friction.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Flat or Structured Views</h3>
                <p class="text-gray-600">View tasks as a list or within folders — your choice, your flow.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Built-in Messaging</h3>
                <p class="text-gray-600">Group channels and private chats — all inside the workspace.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Mobile + Desktop Ready</h3>
                <p class="text-gray-600">Octopus adapts beautifully to any screen. Work wherever you are.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Cloud-native and Secure</h3>
                <p class="text-gray-600">No installs. Always available. Your data stays safe in the cloud.</p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">Minimalist UI</h3>
                <p class="text-gray-600">Designed to disappear when you’re focused — just the essentials.</p>
            </div>

            </div>
        </div>
        </section>



        <!-- How It Works -->
         <section class="mt-20 mb-10" >
            <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
      
              
        <div class="text-center mb-12">
          <h2 class="x-2 text-center text-4xl font-extrabold text-gray-900">How it works</h2>
          <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">From scattered thoughts to structured clarity.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-12 text-center text-gray-800">

          <!-- Step 1 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Target -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-semibold mb-2">Capture everything</h3>
            <p class="text-gray-600">Quickly write down tasks or notes as they come — from any device.</p>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Folder -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <h3 class="text-lg font-semibold mb-2">Organize your way</h3>
            <p class="text-gray-600">Use folders, tags, and boards to create the structure that fits your brain.</p>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Checklist -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 8h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 class="text-lg font-semibold mb-2">Focus and get things done</h3>
            <p class="text-gray-600">Pin key tasks to your tasklist or kanban — and work with peace of mind.</p>
          </div>

        </div>
      
            </div>
      </section>


    <!-- FAQ -->
    <section class="mt-20 mb-10" >
        <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
      
              
            <div class="text-center mb-12">
                <h2 class="x-2 text-center text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
                <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">Still wondering? We’ve got you covered.</p>
            </div>


            <div class="grid md:grid-cols-3 gap-10 text-left text-gray-800">
            
                <div>
                    <h3 class="text-lg font-semibold mb-2">Is Octopus free to use?</h3>
                    <p class="text-gray-600">Yes! You can start using Octopus for free — no credit card required.</p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">Do I need to install anything?</h3>
                    <p class="text-gray-600">Nope. Octopus works entirely in your browser — on desktop and mobile.</p>
                </div>
         
                <div>
                    <h3 class="text-lg font-semibold mb-2">Can I use Octopus with my team?</h3>
                    <p class="text-gray-600">Absolutely. You can assign tasks, share boards, and chat in real-time.</p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">Does Octopus work on mobile?</h3>
                    <p class="text-gray-600">Yes. Octopus is fully responsive and works smoothly on any screen size.</p>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-2">What kind of tasks and notes can I create?</h3>
                    <p class="text-gray-600">Anything — from simple to-dos to structured folders with files and tags.</p>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-2">Is my data safe?</h3>
                    <p class="text-gray-600">Yes. Octopus runs in the cloud with modern security standards and encryption. All data are stored in EU.</p>
                </div>

            </div>
                

        </div>
    </section>



        <div class="max-w-5xl mx-auto mt-20">
            <h2 class="mx-2 text-center text-4xl font-extrabold text-gray-900 ">
                Ready to simplify your workday?
            </h2>
            <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">
                Try Octopus for free. No setup, no stress.
            </p>
        
            <div class="flex flex-row justify-center mt-10">
                <a href={$signUpHRef} use:link
                    class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center 
                            bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-slate-400
                            focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                            ">
                Get Started
                </a>
            </div>
        </div>

        <section class="bg-local bg-cover mt-20"> <!-- style="background-image: url(b-sv1.jpg)" -->
            <Footer />
        </section>
    </div>
</div>

<style>
    li::before {
        content: "☑️";
        padding-inline: 1ch;
        margin-inline-end: 1ch;
    }
</style>