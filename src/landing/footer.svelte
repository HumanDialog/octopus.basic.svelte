<script lang="ts">
    import { link } from 'svelte-spa-router';
    import FaCookieBite from 'svelte-icons/fa/FaCookieBite.svelte'
    import {cookies_valid_until} from './cookie.preferences'
    import AppIcon from '../appicon.svelte'

    let classes = $$props.class ?? '';

    function setup_cookies()
    {
        $cookies_valid_until='';
    }
    
</script>

<footer class="p-4 sm:p-6  mt-auto mb-0 {classes}">
    <div class="mx-auto max-w-screen-xl">
        <div class="md:flex md:justify-between">
            <div class="mb-6 md:mb-0">
                <a href="/" class="flex items-center text-slate-700 " aria-label="Home page">

                    <div class="h-6 sm:h-8"><AppIcon /></div>
                </a>
            </div>
            <div class="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3 text-xs sm:text-base">
                <div>
                    <h2 class="mb-3 sm:mb-6  text-xs sm:text-sm font-semibold text-gray-900 uppercase ">Follow us
                    </h2>
                    <ul class="text-gray-600 ">
                        <li class="mb-2 sm:mb-4">
                            <a href="https://www.linkedin.com/company/human-dialog" class="hover:underline ">LinkedIn</a>
                        </li>
                        <li class="mb-2 sm:mb-4">
                            <a href="https://twitter.com/ObjectReef" class="hover:underline ">X (Twitter)</a>
                        </li>
                        <li class="mb-2 sm:mb-4">
                            <a href="https://github.com/HumanDialog/octopus.basic.reef" class="hover:underline ">GitHub</a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 class="mb-3 sm:mb-6 text-xs sm:text-sm font-semibold text-gray-900 uppercase ">Company</h2>
                    <ul class="text-gray-600">
                        <li class="mb-2 sm:mb-4">
                            <a href="/contact" use:link  class="hover:underline">Contact us</a>
                        </li>
                        <li class="mb-2 sm:mb-4">
                            <a href="/privacy-policy" use:link  class="hover:underline">Privacy Policy</a>
                        </li>
                        <li>
                            <a href="/terms-and-conditions" use:link class="hover:underline">Terms &amp; Conditions</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <hr class="my-6 border-gray-200 sm:mx-auto lg:my-8" />
        <div class="flex items-center justify-between">
            <span class="text-xs sm:text-sm text-gray-500 text-center ">© 2025 <a href="https://humandialog.com/"
                    class="hover:underline">Human Dialog</a>.
            </span>
            <div class="flex space-x-6 justify-center mt-0">
                <!--a href="#" class="text-gray-500 hover:text-gray-900 " aria-label="facebook">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill-rule="evenodd"
                            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                            clip-rule="evenodd" /></svg>
                </a-->
                
                <a href="https://twitter.com/ObjectReef" class="text-gray-500 hover:text-gray-900 " aria-label="twitter">
                    <svg class="w-4 h-5" fill="currentColor" viewBox="0 0 300 300"  version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>
                    </svg>
                    
                </a>
                <a href="https://github.com/HumanDialog/octopus.basic.svelte" class="text-gray-500 hover:text-gray-900 " aria-label="github">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill-rule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                            clip-rule="evenodd" /></svg>
                </a>
                <button class="w-4 h-5 text-gray-500 hover:text-gray-900 " on:click={setup_cookies} aria-label="cookies"><FaCookieBite/></button>
               
            </div>
        </div>
    </div>
</footer>