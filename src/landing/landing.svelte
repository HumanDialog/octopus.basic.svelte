<script>
	import { signUpHRef } from '@humandialog/auth.svelte';
    import Header from './header.svelte'
    import Footer  from './footer.svelte';
    import {link} from 'svelte-spa-router'
    import {Accordion, AccordionItem} from 'flowbite-svelte'
    import {i18n, wholeAppReloader} from '@humandialog/forms.svelte'
	
</script>


<svelte:head>
  <title>Octopus | A minimalist workspace for tasks and notes.</title>
  <link rel="canonical" href="https://octopus.objectreef.dev"/>
</svelte:head> 

{#key $wholeAppReloader}

<div class="min-h-screen h-screen overflow-x-hidden">

    <section class="bg-local bg-cover  sm:sticky sm:top-0 sm:z-50" > <!-- style="background-image: url(b-sv1.jpg)"-->
        <Header main light/>
    </section>

    

    <div class="bg-gradient-to-b from-slate-200 via-white to-indigo-100 text-gray-900">
        <section class="bg-local bg-cover">
            <div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 pb-8 sm-pb-16">
                <h1
                    class="px-8 sm:px-20 text-slate-800 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center ">
                    _;
                    Bring order. Calm your mind.;
                    Pon orden. Calma tu mente.;
                    Zaprowadź porządek. Wycisz umysł.
                </h1>
                <h2 class="px-2 sm:px-10 mt-6 pb-10 text-xl sm:text-2xl text-slate-600 text-center max-w-5xl mx-2 ">
                    _;
                    A minimalist workspace for tasks and notes — designed for clarity, focus, and peace of mind. No noise. Just flow.;
                    Un espacio de trabajo minimalista para tareas y notas, diseñado para ofrecer claridad, concentración y tranquilidad. Sin ruidos. Solo fluidez.;
                    Minimalistyczna przestrzeń do wykonywania zadań i sporządzania notatek — zaprojektowana z myślą o przejrzystości i skupieniu. Bez hałasu. Tylko płynność działania.
                </h2>
                
                <div class="flex flex-row justify-center mt-4">
                    <a href={$signUpHRef} use:link
                        class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center 
                                bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-slate-400
                                focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                ">
                    _; Get Started for Free; Empiece gratis; Rozpocznij za darmo
                    </a>
                </div>
            </div>
        </section>

        <section class="bg-local bg-cover py-8 px-4 mx-auto max-w-screen-xl lg:px-6 relative">
            <img src="/landing/new-kanban-md.png" alt="octopus-screen-lg" 
                    class="hidden sm:block rounded-xl shadow-lg 
                            w-full max-w-[1280px] "/>

            <img src="/landing/new-mytasks-sm-sm.jpg" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg hidden sm:block sm:absolute sm:right-[0px] sm:top-[150px]
                            w-full max-w-[320px] " />

            <img src="/landing/new-kanban-sm-sm.png" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg block sm:hidden absolute right-[20px] top-[100px]
                    w-full max-w-[250px] " />

            <img src="/landing/new-mytasks-sm.jpg" alt="octopus-screen-lg" 
                    class="block sm:hidden rounded-xl shadow-lg
                    w-full max-w-[250px] "/>
        </section>

        <section class="mt-20 mb-10" >
            <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
                <div class="text-center mb-12">
                    <h2 class="mt-4 mx-2 text-center text-4xl font-extrabold text-gray-900 ">
                        _; Why Octopus?; ¿Por qué Octopus?; Dlaczego Octopus?</h2>
                    <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg">
                        _; Lightweight. Powerful. Peaceful.; Ligero. Potente. Silencioso.; Lekki. Wydajny. Spokojny.</p>
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
                <h3 class="text-lg font-semibold mb-1">_;Tasks & Notes in One Place; Tareas y notas en un solo lugar; Zadania i notatki w jednym miejscu</h3>
                <p class="text-gray-600">
                    _;
                    Keep your to-dos and notes side by side — organized, linked, and always in sync.;
                    Mantén tus tareas pendientes y tus notas juntas, organizadas, vinculadas y siempre sincronizadas.;
                    Trzymaj swoje zadania i notatki obok siebie — uporządkowane, połączone i zawsze zsynchronizowane.
                </p>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-1">_; Folder-based Structure; Estructura basada en carpetas; Struktura oparta na folderach</h3>
                <p class="text-gray-600">
                    _;
                    Organize everything with a familiar hierarchy. Like a file explorer, but smarter.;
                    Organiza todo con una jerarquía familiar. Como un explorador de archivos, pero más inteligente.;
                    Uporządkuj wszystko według znanej hierarchii. Jak eksplorator plików, ale mądrzejszy.</p>
            </div>

            <div>
            <h3 class="text-lg font-semibold mb-1">_;Smart Tags; Etiquetas inteligentes; Inteligentne tagi</h3>
            <p class="text-gray-600">
                _; 
                Add context to tasks and notes with flexible, lightweight tagging.; 
                Añade contexto a tareas y notas con etiquetas flexibles y ligeras.; 
                Dodaj kontekst do zadań i notatek dzięki elastycznym, lekkim tagom.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Attachments Support; Compatibilidad con adjuntos; Obsługa załączników</h3>
            <p class="text-gray-600">
                _; 
                Attach files to tasks or notes. Everything in one place.; 
                Adjunta archivos a tareas o notas. Todo en un solo lugar.; 
                Dołącz pliki do zadań lub notatek. Wszystko w jednym miejscu.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Tasklists That Actually Work; Listas de tareas que realmente funcionan; Listy zadań, które naprawdę działają</h3>
            <p class="text-gray-600">
                _; 
                Pin active tasks to focused lists and stay in flow — no distractions.; 
                Fija tareas activas en listas enfocadas y mantén el flujo, sin distracciones.; 
                Przypnij aktywne zadania do list i pozostań w skupieniu — bez rozproszeń.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Kanban Boards; Tableros Kanban; Tablice Kanban</h3>
            <p class="text-gray-600">
                _; 
                Visualize your workflow with flexible, customizable columns.; 
                Visualiza tu flujo de trabajo con columnas flexibles y personalizables.; 
                Wizualizuj swój przepływ pracy za pomocą elastycznych, konfigurowalnych kolumn.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Team-ready by Design; Listo para equipos por diseño; Gotowe dla zespołów od podstaw</h3>
            <p class="text-gray-600">
                _; 
                Assign tasks, set due dates, and collaborate without friction.; 
                Asigna tareas, establece fechas límite y colabora sin fricciones.; 
                Przypisuj zadania, ustawiaj terminy i współpracuj bez przeszkód.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Flat or Structured Views; Vistas planas o estructuradas; Widoki płaskie lub strukturalne</h3>
            <p class="text-gray-600">
                _; 
                View tasks as a list or within folders — your choice, your flow.; 
                Ve las tareas como lista o dentro de carpetas — tu elección, tu flujo.; 
                Przeglądaj zadania jako listę lub w folderach — twój wybór, twój rytm pracy.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Built-in Messaging; Mensajería integrada; Wbudowane wiadomości</h3>
            <p class="text-gray-600">
                _; 
                Group channels and private chats — all inside the workspace.; 
                Canales de grupo y chats privados — todo dentro del espacio de trabajo.; 
                Kanały grupowe i czaty prywatne — wszystko w jednym miejscu pracy.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Mobile + Desktop Ready; Listo para móvil y escritorio; Gotowe na mobile i desktop</h3>
            <p class="text-gray-600">
                _; 
                Octopus adapts beautifully to any screen. Work wherever you are.; 
                Octopus se adapta perfectamente a cualquier pantalla. Trabaja donde estés.; 
                Octopus pięknie dopasowuje się do każdego ekranu. Pracuj, gdziekolwiek jesteś.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Cloud-native and Secure; Nativo en la nube y seguro; W chmurze i bezpiecznie</h3>
            <p class="text-gray-600">
                _; 
                No installs. Always available. Your data stays safe in the cloud.; 
                Sin instalaciones. Siempre disponible. Tus datos permanecen seguros en la nube.; 
                Bez instalacji. Zawsze dostępne. Twoje dane pozostają bezpieczne w chmurze.
            </p>
        </div>

        <div>
            <h3 class="text-lg font-semibold mb-1">_;Minimalist UI; Interfaz minimalista; Minimalistyczny interfejs</h3>
            <p class="text-gray-600">
                _; 
                Designed to disappear when you’re focused — just the essentials.; 
                Diseñado para desaparecer cuando te concentras — solo lo esencial.; 
                Zaprojektowany, by znikać, gdy się skupiasz — tylko to, co niezbędne.
            </p>
        </div>

            </div>
        </div>
        </section>



        <!-- How It Works -->
         <section class="mt-20 mb-10" >
            <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
      
              
        <div class="text-center mb-12">
            <h2 class="x-2 text-center text-4xl font-extrabold text-gray-900">_;How it works; Cómo funciona; Jak to działa</h2>
            <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">
                _; 
                From scattered thoughts to structured clarity.; 
                De pensamientos dispersos a una claridad estructurada.; 
                Od rozproszonych myśli do uporządkowanej przejrzystości.
            </p>
        </div>

        <div class="grid md:grid-cols-3 gap-12 text-center text-gray-800">

          <!-- Step 1 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Target -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-semibold mb-2">_;Capture everything; Captura todo; Zapisz wszystko</h3>
            <p class="text-gray-600">
                _; 
                Quickly write down tasks or notes as they come — from any device.; 
                Escribe rápidamente tareas o notas a medida que surgen — desde cualquier dispositivo.; 
                Szybko zapisuj zadania lub notatki, gdy się pojawią — z dowolnego urządzenia.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Folder -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
                <h3 class="text-lg font-semibold mb-2">_;Organize your way; Organiza a tu manera; Organizuj po swojemu</h3>
                <p class="text-gray-600">
                    _; 
                    Use folders, tags, and boards to create the structure that fits your brain.; 
                    Usa carpetas, etiquetas y tableros para crear la estructura que se ajuste a tu mente.; 
                    Używaj folderów, tagów i tablic, aby stworzyć strukturę dopasowaną do twojego sposobu myślenia.
                </p>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center">
            <!-- SVG: Checklist -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 8h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
                <h3 class="text-lg font-semibold mb-2">_;Focus and get things done; Concéntrate y haz las cosas; Skup się i zrealizuj zadania</h3>
                <p class="text-gray-600">
                    _; 
                    Pin key tasks to your tasklist or kanban — and work with peace of mind.; 
                    Fija las tareas clave en tu lista o kanban — y trabaja con tranquilidad.; 
                    Przypnij kluczowe zadania do listy lub tablicy kanban — i pracuj ze spokojem.
                </p>
          </div>

        </div>
      
            </div>
      </section>


    <!-- FAQ -->
    <section class="mt-20 mb-10" >
        <div class="mx-auto px-4 max-w-screen-xl sm:py-16 lg:px-6 
                        sm:bg-gray-50 sm:rounded-xl sm:shadow-xl sm:border">
      
              
            <div class="text-center mb-12">
                <h2 class="x-2 text-center text-4xl font-extrabold text-gray-900">_;Frequently Asked Questions; Preguntas frecuentes; Najczęściej zadawane pytania</h2>
                <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">
                    _; 
                    Still wondering? We’ve got you covered.; 
                    ¿Aún tienes dudas? Te tenemos cubierto.; 
                    Nadal się zastanawiasz? Mamy to ogarnięte.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-10 text-left text-gray-800">

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;Is Octopus free to use?; ¿Es Octopus gratis de usar?; Czy Octopus jest darmowy?</h3>
                    <p class="text-gray-600">
                        _; 
                        Yes! You can start using Octopus for free — no credit card required.; 
                        ¡Sí! Puedes empezar a usar Octopus gratis — no se requiere tarjeta de crédito.; 
                        Tak! Możesz zacząć korzystać z Octopusa za darmo — bez karty kredytowej.
                    </p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;Do I need to install anything?; ¿Necesito instalar algo?; Czy muszę coś instalować?</h3>
                    <p class="text-gray-600">
                        _; 
                        Nope. Octopus works entirely in your browser — on desktop and mobile.; 
                        No. Octopus funciona completamente en tu navegador — en escritorio y móvil.; 
                        Nie. Octopus działa całkowicie w przeglądarce — na komputerze i telefonie.
                    </p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;Can I use Octopus with my team?; ¿Puedo usar Octopus con mi equipo?; Czy mogę używać Octopusa z zespołem?</h3>
                    <p class="text-gray-600">
                        _; 
                        Absolutely. You can assign tasks, share boards, and chat in real-time.; 
                        Por supuesto. Puedes asignar tareas, compartir tableros y chatear en tiempo real.; 
                        Oczywiście. Możesz przypisywać zadania, udostępniać tablice i rozmawiać w czasie rzeczywistym.
                    </p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;Does Octopus work on mobile?; ¿Funciona Octopus en el móvil?; Czy Octopus działa na telefonie?</h3>
                    <p class="text-gray-600">
                        _; 
                        Yes. Octopus is fully responsive and works smoothly on any screen size.; 
                        Sí. Octopus es totalmente adaptable y funciona sin problemas en cualquier pantalla.; 
                        Tak. Octopus jest w pełni responsywny i działa płynnie na każdym ekranie.
                    </p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;What kind of tasks and notes can I create?; ¿Qué tipo de tareas y notas puedo crear?; Jakie zadania i notatki mogę tworzyć?</h3>
                    <p class="text-gray-600">
                        _; 
                        Anything — from simple to-dos to structured folders with files and tags.; 
                        Cualquier cosa — desde simples pendientes hasta carpetas estructuradas con archivos y etiquetas.; 
                        Wszystko — od prostych zadań do uporządkowanych folderów z plikami i tagami.
                    </p>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">_;Is my data safe?; ¿Mis datos están seguros?; Czy moje dane są bezpieczne?</h3>
                    <p class="text-gray-600">
                        _; 
                        Yes. Octopus runs in the cloud with modern security standards and encryption. All data are stored in EU.; 
                        Sí. Octopus funciona en la nube con estándares modernos de seguridad y cifrado. Todos los datos se almacenan en la UE.; 
                        Tak. Octopus działa w chmurze z nowoczesnymi standardami bezpieczeństwa i szyfrowaniem. Wszystkie dane są przechowywane w UE.
                    </p>
                </div>

            </div>
                

        </div>
    </section>



        <div class="max-w-5xl mx-auto mt-20">
            <h2 class="mx-2 text-center text-4xl font-extrabold text-gray-900 ">
                _;Ready to simplify your workday?; ¿Listo para simplificar tu jornada laboral?; Gotowy uprościć swój dzień pracy?
            </h2>
            <p class="text-center mx-2 mb-4 font-normal text-gray-500 sm:text-lg ">
                _; 
                Try Octopus for free. No setup, no stress.; 
                Prueba Octopus gratis. Sin configuración, sin estrés.; 
                Wypróbuj Octopusa za darmo. Bez konfiguracji, bez stresu.
            </p>

            <div class="flex flex-row justify-center mt-10">
                <a href={$signUpHRef} use:link
                    class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center 
                            bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-slate-400
                            focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                            ">
                    _;Get Started; Empezar; Rozpocznij
                </a>
            </div>
        </div>

        <section class="bg-local bg-cover mt-20"> <!-- style="background-image: url(b-sv1.jpg)" -->
            <Footer />
        </section>
    </div>
</div>

{/key}

<style>
    li::before {
        content: "☑️";
        padding-inline: 1ch;
        margin-inline-end: 1ch;
    }
</style>