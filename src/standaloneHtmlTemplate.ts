/**
 * Complete, self-contained single-file HTML version of the
 * Grade 1 Khmer Alphabet & Vowels Quiz Game (រៀនអក្សរខ្មែរថ្នាក់ទី១)
 * featuring:
 *   1. Smooth 4-Screen Flow: Home -> Lesson Selection -> Quiz -> Results Celebration
 *   2. Dynamic Question Filtering by `lessonId` (4 Lessons + Mixed Mode)
 *   3. Web Speech API (`km-KH`) + Web Audio API Chimes + Graceful Unsupported Speech Fallback
 *   4. Double-click / Rapid-tap Lock, Timer Cleanup, and Empty-State Safeguards
 *
 * Can be saved directly as `index.html` and opened in any modern browser.
 */
export const STANDALONE_HTML_CODE = `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <script>
    // Safeguard against third-party browser extensions attempting to overwrite getter-only window.fetch
    (function () {
      try {
        var currentFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined;
        function ensureWritableFetch(target) {
          if (!target) return;
          try {
            var desc = Object.getOwnPropertyDescriptor(target, 'fetch');
            if (!desc || desc.configurable !== false) {
              Object.defineProperty(target, 'fetch', {
                configurable: true,
                enumerable: true,
                get: function () { return currentFetch; },
                set: function (fn) { if (typeof fn === 'function') currentFetch = fn; }
              });
            }
          } catch (_) {}
        }
        if (typeof Window !== 'undefined' && Window.prototype) ensureWritableFetch(Window.prototype);
        ensureWritableFetch(window);
      } catch (_) {}
    })();
  </script>
  <title>រៀនអក្សរខ្មែរថ្នាក់ទី១ — Grade 1 Khmer Alphabet & Vowels Quiz</title>
  <meta name="theme-color" content="#F59E0B" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="រៀនអក្សរខ្មែរ" />

  <!-- 1. Load Khmer Unicode Google Fonts (Kantumruy Pro & Moul) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=Moul&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">

  <!-- 2. Load Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    /* =========================================================================
       KHMER UNICODE TYPOGRAPHY & SMOOTH SCREEN ANIMATIONS
       ========================================================================= */
    body {
      font-family: 'Kantumruy Pro', 'Plus Jakarta Sans', sans-serif;
      background-color: #FFFDF7;
      color: #1E293B;
      line-height: 1.65;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .font-khmer-title {
      font-family: 'Moul', 'Kantumruy Pro', serif;
      line-height: 1.75;
    }

    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    @keyframes screenTransitionIn {
      0% { opacity: 0; transform: translateY(12px) scale(0.99); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes popIn {
      0% { transform: scale(0.92); opacity: 0; }
      70% { transform: scale(1.03); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes gentleShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }

    .animate-float {
      animation: floatSlow 3s ease-in-out infinite;
    }
    .animate-screen {
      animation: screenTransitionIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-pop {
      animation: popIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .animate-shake {
      animation: gentleShake 0.35s ease-in-out;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between bg-[#FFFDF7] text-slate-900">

  <!-- =========================================================================
       TOP HEADER BAR (Responsive & Kid-Friendly)
       ========================================================================= -->
  <header class="w-full bg-white/95 border-b border-amber-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-xs">
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
      <button
        type="button"
        onclick="navigateToScreen('HOME')"
        class="font-khmer-title text-lg sm:text-2xl text-slate-900 whitespace-nowrap hover:text-amber-700 transition-colors cursor-pointer text-left"
      >
        🐘 រៀនអក្សរខ្មែរថ្នាក់ទី១
      </button>

      <div class="flex items-center gap-3 sm:gap-5 text-sm sm:text-base font-bold text-slate-700 tabular-nums">
        <button
          type="button"
          onclick="navigateToScreen('LESSON_SELECT')"
          class="hidden sm:inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <span>📚 មេរៀនទាំងអស់</span>
        </button>
        <span class="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
        <span class="flex items-center gap-1.5 text-amber-600 text-base sm:text-lg">
          <span>⭐</span>
          <span id="headerTotalStarsLabel">ផ្កាយសរុប៖ ០</span>
        </span>
      </div>
    </div>
  </header>

  <!-- =========================================================================
       MAIN VIEWPORT CONTAINER (4 Screens: HOME -> LESSON_SELECT -> QUIZ -> RESULTS)
       ========================================================================= -->
  <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col justify-center">

    <!-- Audio Visual Reading Toast (Appears when speaking or if TTS is unsupported) -->
    <div id="audioToastBanner" class="hidden mb-4 rounded-2xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-sky-900 flex items-center justify-between gap-3 animate-pop">
      <span id="audioToastText">🔊 កំពុងអានសំឡេង...</span>
      <span id="audioSupportBadge" class="text-xs font-semibold text-sky-700">Web Speech + Chime</span>
    </div>

    <!-- =======================================================================
         SCREEN 1: HOME WELCOME SCREEN (អេក្រង់ដើម)
         ======================================================================= -->
    <section id="homeScreen" class="animate-screen">
      <div class="bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-6 sm:p-12 text-center max-w-3xl mx-auto">
        <div class="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-6xl sm:text-7xl mx-auto mb-5 animate-float">
          🐘
        </div>

        <p class="text-xs sm:text-sm font-bold text-amber-700 mb-2">
          កម្មវិធីសិក្សាភាសាខ្មែរកុមារតូច · Grade 1 Khmer Alphabet &amp; Vowels
        </p>

        <h1 class="font-khmer-title text-2xl sm:text-4xl text-slate-900 mb-3">
          សួស្តីកូនៗថ្នាក់ទី១! តោះរៀនព្យញ្ជនៈ និងស្រៈខ្មែរ!
        </h1>

        <p class="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
          រៀនសម្គាល់តួអក្សរខ្មែរ ស្តាប់សំឡេងអានច្បាស់ៗ និងឆ្លើយសំណួរតាមមេរៀននីមួយៗដើម្បីសន្សំផ្កាយមាស ⭐!
        </p>

        <!-- Kid-friendly Feature Highlights -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
          <div class="rounded-2xl bg-amber-50/80 border border-amber-200 p-4">
            <div class="text-2xl mb-1">📚</div>
            <div class="font-bold text-slate-900 text-sm">៤ មេរៀនគ្រឹះថ្នាក់ទី១</div>
            <div class="text-xs text-slate-600 mt-0.5">ព្យញ្ជនៈជួរ ក, ច-ស, ស្រៈនិស្ស័យ និងស្រៈពេញតួ</div>
          </div>
          <div class="rounded-2xl bg-sky-50/80 border border-sky-200 p-4">
            <div class="text-2xl mb-1">🔊</div>
            <div class="font-bold text-slate-900 text-sm">សំឡេងអានភាសាខ្មែរ</div>
            <div class="text-xs text-slate-600 mt-0.5">ចុចលើរូបភាព ឬតួអក្សរដើម្បីស្តាប់ការបញ្ចេញសំឡេង</div>
          </div>
          <div class="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4">
            <div class="text-2xl mb-1">⭐</div>
            <div class="font-bold text-slate-900 text-sm">រង្វាន់ផ្កាយមាស</div>
            <div class="text-xs text-slate-600 mt-0.5">ឆ្លើយត្រូវទទួលបានផ្កាយ និងសំឡេងអបអរសាទរ</div>
          </div>
        </div>

        <!-- Primary & Secondary Home CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onclick="navigateToScreen('LESSON_SELECT')"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:translate-y-1 text-white font-bold text-base sm:text-lg shadow-[0_5px_0_#047857] transition-all cursor-pointer"
          >
            🚀 ចាប់ផ្តើមជ្រើសរើសមេរៀន (Choose a Lesson)
          </button>

          <button
            type="button"
            onclick="startLessonQuiz('ALL')"
            class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:translate-y-1 text-slate-950 font-bold text-base sm:text-lg shadow-[0_5px_0_#b45309] transition-all cursor-pointer"
          >
            🎯 លេងគ្រប់មេរៀន (Play All 16)
          </button>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         SCREEN 2: LESSON SELECTION SCREEN (ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន)
         ======================================================================= -->
    <section id="lessonSelectScreen" class="hidden space-y-6 animate-screen">
      <div class="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p class="text-xs sm:text-sm font-bold text-emerald-700 mb-1">
            ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន · Lesson-Based Quiz Selection
          </p>
          <h2 class="text-xl sm:text-3xl font-bold text-slate-900">
            📚 សូមជ្រើសរើសមេរៀនដើម្បីចាប់ផ្តើមឆ្លើយសំណួរ
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            ចុចលើមេរៀនណាមួយខាងក្រោម ដើម្បីផ្ទុកសំណួរសម្រាប់តែមេរៀននោះ!
          </p>
        </div>

        <div class="flex items-center gap-3 self-start shrink-0">
          <button
            type="button"
            onclick="navigateToScreen('HOME')"
            class="px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            🏠 ទំព័រដើម
          </button>
          <button
            type="button"
            onclick="startLessonQuiz('ALL')"
            class="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            🎯 លេងគ្រប់មេរៀនទាំងអស់
          </button>
        </div>
      </div>

      <!-- Dynamic Lesson Selection Grid -->
      <div id="lessonCardsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Populated dynamically via renderLessonCards() -->
      </div>
    </section>

    <!-- =======================================================================
         SCREEN 3: ACTIVE LESSON QUIZ SCREEN (អេក្រង់ឆ្លើយសំណួរ)
         ======================================================================= -->
    <section id="quizScreen" class="hidden animate-screen">
      <!-- Top Navigation Bar inside Quiz with "Back to Lessons (ត្រឡប់ក្រោយ)" -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-amber-200/80">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onclick="returnToLessonSelect()"
            class="px-4 py-2.5 rounded-xl bg-white border-2 border-amber-300 hover:bg-amber-50 active:translate-y-0.5 text-slate-900 font-bold text-xs sm:text-sm shadow-xs inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>⬅️ ត្រឡប់ក្រោយ (Back to Lessons)</span>
          </button>

          <div>
            <p id="activeLessonBadge" class="text-xs sm:text-sm font-bold text-amber-800">
              មេរៀនទី ១
            </p>
            <p id="questionCounterText" class="text-xs text-slate-500 tabular-nums">
              សំណួរទី ១ នៃ ៤
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-amber-600 font-bold text-base sm:text-lg tabular-nums">
          <span>⭐</span>
          <span id="lessonScoreLabel">ពិន្ទុមេរៀន៖ ០ / ៤</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full h-4 bg-amber-100 rounded-full overflow-hidden border border-amber-200/80 mb-6">
        <div
          id="progressBarFill"
          class="h-full bg-emerald-500 transition-all duration-300 rounded-full"
          style="width: 25%"
        ></div>
      </div>

      <!-- Empty Lesson Safeguard View (if filteredQuestions.length === 0) -->
      <div id="emptyLessonFallback" class="hidden bg-white rounded-3xl border-2 border-amber-300 p-8 text-center">
        <div class="text-5xl mb-3">📭</div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">មិនទាន់មានសំណួរក្នុងមេរៀននេះទេ</h3>
        <p class="text-sm text-slate-600 mb-6">សូមត្រឡប់ទៅជ្រើសរើសមេរៀនផ្សេងទៀត។</p>
        <button
          type="button"
          onclick="returnToLessonSelect()"
          class="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm cursor-pointer"
        >
          ⬅️ ត្រឡប់ទៅជ្រើសរើសមេរៀន
        </button>
      </div>

      <!-- Active Question Card -->
      <div id="quizCardContent" class="bg-white rounded-3xl border border-amber-200/90 shadow-sm p-6 sm:p-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          <!-- Left Column: Visual Clue & Audio Pronunciation Button -->
          <div class="lg:col-span-5 flex flex-col items-center justify-between bg-amber-50/70 rounded-3xl border border-amber-200/80 p-6 sm:p-8 text-center">
            <div class="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>រូបភាពជំនួយ · Visual Clue</span>
              <span id="categoryBadge">ព្យញ្ជនៈ</span>
            </div>

            <button
              type="button"
              onclick="speakCurrentQuestion()"
              aria-label="Tap to hear Khmer pronunciation"
              class="my-4 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white border-2 border-amber-200 shadow-sm flex items-center justify-center text-7xl sm:text-8xl animate-float cursor-pointer hover:scale-105 transition-transform"
            >
              <span id="clueIcon">🦀</span>
            </button>

            <div class="my-2">
              <div id="clueWordKhmer" class="text-3xl sm:text-4xl font-bold text-slate-900 py-1">
                ក្តាម
              </div>
              <p id="clueWordEnglish" class="text-sm font-semibold text-slate-600">
                Crab (Kdaam)
              </p>
              <p id="phoneticHint" class="text-xs sm:text-sm font-bold text-amber-800 mt-1">
                សំឡេងអាន៖ «ក» (Ka)
              </p>
            </div>

            <button
              type="button"
              onclick="speakCurrentQuestion()"
              class="mt-5 w-full py-4 px-5 rounded-2xl bg-sky-500 hover:bg-sky-600 active:translate-y-1 text-white font-bold text-base sm:text-lg shadow-[0_4px_0_#0369a1] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>🔊</span>
              <span class="whitespace-nowrap">ចុចស្តាប់សំឡេង (Listen Aloud)</span>
            </button>
          </div>

          <!-- Right Column: Question Prompt, 3 Multiple-Choice Options & Instant Feedback -->
          <div class="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p id="questionEnglish" class="text-xs sm:text-sm font-bold text-slate-500 mb-1">
                Which Khmer consonant starts the word for Crab?
              </p>
              <h2 id="questionKhmer" class="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-relaxed">
                តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?
              </h2>

              <!-- 3 Multiple Choice Option Buttons -->
              <div id="optionsContainer" class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
                <!-- Populated dynamically by JavaScript -->
              </div>
            </div>

            <!-- Instant Feedback Banner -->
            <div
              id="feedbackBanner"
              class="rounded-2xl p-4 border border-dashed border-amber-300 bg-amber-50/40 text-center text-sm font-semibold text-slate-600"
            >
              👆 ចុចលើប៊ូតុងអក្សរណាមួយខាងលើ ដើម្បីឆ្លើយ និងស្តាប់សំឡេង!
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- =======================================================================
         SCREEN 4: RESULTS SUMMARY & CELEBRATION SCREEN (អេក្រង់លទ្ធផល)
         ======================================================================= -->
    <section
      id="celebrationScreen"
      class="hidden bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-8 sm:p-12 text-center animate-screen max-w-3xl mx-auto"
    >
      <div class="text-7xl sm:text-8xl mb-3 select-none">🏆</div>
      <p id="completedLessonLabel" class="text-xs sm:text-sm font-bold text-amber-700 mb-1">
        មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក
      </p>
      <h2 class="font-khmer-title text-2xl sm:text-4xl text-slate-900 mb-2">
        អបអរសាទរ! កូនបញ្ចប់មេរៀនហើយ!
      </h2>
      <p id="celebrationMessageText" class="text-sm sm:text-base text-slate-600 font-semibold mb-6">
        Congratulations! You completed this lesson!
      </p>

      <div id="earnedStarsRow" class="flex items-center justify-center gap-2 sm:gap-3 my-5 flex-wrap text-3xl sm:text-4xl">
        <!-- Stars injected by JS -->
      </div>

      <div class="max-w-md mx-auto bg-amber-50/90 rounded-3xl border border-amber-200 p-6 mb-8">
        <p class="text-xs sm:text-sm font-bold text-slate-500 mb-1">ពិន្ទុក្នុងមេរៀននេះ · Lesson Score</p>
        <p id="finalScoreText" class="text-3xl sm:text-5xl font-extrabold text-emerald-700 tabular-nums py-1">
          ៤ / ៤ ⭐
        </p>
      </div>

      <!-- Post-Quiz Action Buttons: "Play Again" OR "Choose Another Lesson" -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onclick="restartCurrentLessonQuiz()"
          class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-white font-bold text-base sm:text-lg shadow-[0_5px_0_#047857] inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <span>🔄 លេងម្តងទៀត (Play Again)</span>
        </button>

        <button
          type="button"
          onclick="returnToLessonSelect()"
          class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:translate-y-0.5 text-slate-950 font-bold text-base sm:text-lg shadow-[0_5px_0_#b45309] inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <span>📚 ជ្រើសរើសមេរៀនផ្សេង (Choose Another Lesson)</span>
        </button>
      </div>
    </section>

  </main>

  <footer class="w-full border-t border-amber-200/70 bg-white/70 py-4 px-4 sm:px-8 text-xs text-slate-500 text-center">
    កម្មវិធីសិក្សាភាសាខ្មែរថ្នាក់ទី១ · ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន (Lesson-Based Quiz Selection)
  </footer>

  <!-- =========================================================================
       3. EMBEDDED JAVASCRIPT: LESSON DATA, FILTERING, AUDIO & SAFEGUARDS
       ========================================================================= -->
  <script>
    /**
     * A. LESSON CATALOG (មេរៀនទាំង ៤ សម្រាប់ថ្នាក់ទី ១)
     * Each lesson has a unique \`id\` used to filter questions dynamically.
     */
    const QUIZ_LESSONS = [
      {
        id: 'lesson-1',
        numberLabel: 'មេរៀនទី ១ · Lesson 1',
        titleKhmer: 'ព្យញ្ជនៈ ជួរ ក (ក ខ គ ឃ ង)',
        titleEnglish: 'Velar Consonants — Series Ka',
        description: 'រៀនសម្គាល់ និងស្តាប់សំឡេងព្យញ្ជនៈជួរទី១ (ក ខ គ ឃ ង) ជាមួយរូបភាពសត្វគួរឱ្យស្រឡាញ់។',
        icon: '🦀',
        sampleLetters: 'ក · ខ · គ · ឃ'
      },
      {
        id: 'lesson-2',
        numberLabel: 'មេរៀនទី ២ · Lesson 2',
        titleKhmer: 'ព្យញ្ជនៈ ជួរ ច និង ដ-ស',
        titleEnglish: 'Common Consonants — Series Cha to Sa',
        description: 'រៀនព្យញ្ជនៈពេញនិយមសម្រាប់ថ្នាក់ទី១ (ច ឆ ដ ស) តាមរយៈពាក្យ ចេក ឆ្មា ដំរី និងសេះ។',
        icon: '🐘',
        sampleLetters: 'ច · ឆ · ដ · ស'
      },
      {
        id: 'lesson-3',
        numberLabel: 'មេរៀនទី ៣ · Lesson 3',
        titleKhmer: 'ស្រៈនិស្ស័យ (ា ិ ី ោ ៅ)',
        titleEnglish: 'Dependent Vowels — Sra Nissay',
        description: 'រៀនផ្សំប្រកបស្រៈនិស្ស័យ (ស្រៈ អា, អី, អោ, អៅ) ដែលភ្ជាប់ជាមួយព្យញ្ជនៈខ្មែរ។',
        icon: '📖',
        sampleLetters: 'ា · ី · ោ · ៅ'
      },
      {
        id: 'lesson-4',
        numberLabel: 'មេរៀនទី ៤ · Lesson 4',
        titleKhmer: 'ស្រៈពេញតួ (ឥ ឧ ឯ ឪ)',
        titleEnglish: 'Independent Vowels — Sra Penh Tuo',
        description: 'រៀនសម្គាល់ស្រៈពេញតួខ្មែរ (ឥ ឧ ឯ ឪ) ក្នុងពាក្យ ឥសី ឧសភា ឯកសណ្ឋាន និងឪឡឹក។',
        icon: '🍉',
        sampleLetters: 'ឥ · ឧ · ឯ · ឪ'
      }
    ];

    /**
     * B. QUESTION DATASET TAGGED BY \`lessonId\`
     * Every question object includes \`lessonId\` ('lesson-1' .. 'lesson-4').
     */
    const QUIZ_DATA = [
      // ---------------- LESSON 1: ព្យញ្ជនៈ ជួរ ក (lesson-1) ----------------
      {
        id: 101,
        lessonId: 'lesson-1',
        categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
        icon: '🦀',
        clueWordKhmer: 'ក្តាម',
        clueWordEnglish: 'Crab (Kdaam)',
        phoneticHint: 'សំឡេងអាន៖ «ក» (Ka) — ក ក្តាម',
        speechText: 'ក... ក ក្តាម',
        questionKhmer: 'តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Crab (ក្តាម)?',
        options: [
          { letter: 'ក', label: 'ក (Ka)', speech: 'ក' },
          { letter: 'ខ', label: 'ខ (Kha)', speech: 'ខ' },
          { letter: 'គ', label: 'គ (Ko)', speech: 'គ' }
        ],
        correctLetter: 'ក',
        explanation: 'ត្រឹមត្រូវហើយ! «ក» គឺ ក ក្តាម (Ka for Crab)!'
      },
      {
        id: 102,
        lessonId: 'lesson-1',
        categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
        icon: '🐯',
        clueWordKhmer: 'ខ្លា',
        clueWordEnglish: 'Tiger (Khlaa)',
        phoneticHint: 'សំឡេងអាន៖ «ខ» (Kha) — ខ ខ្លា',
        speechText: 'ខ... ខ ខ្លា',
        questionKhmer: 'តើពាក្យ «ខ្លា» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Tiger (ខ្លា)?',
        options: [
          { letter: 'ក', label: 'ក (Ka)', speech: 'ក' },
          { letter: 'ខ', label: 'ខ (Kha)', speech: 'ខ' },
          { letter: 'ង', label: 'ង (Ngo)', speech: 'ង' }
        ],
        correctLetter: 'ខ',
        explanation: 'ពូកែណាស់! «ខ» គឺ ខ ខ្លា (Kha for Tiger)!'
      },
      {
        id: 103,
        lessonId: 'lesson-1',
        categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
        icon: '🐄',
        clueWordKhmer: 'គោ',
        clueWordEnglish: 'Cow (Ko)',
        phoneticHint: 'សំឡេងអាន៖ «គ» (Ko) — គ គោ',
        speechText: 'គ... គ គោ',
        questionKhmer: 'តើពាក្យ «គោ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Cow (គោ)?',
        options: [
          { letter: 'ឃ', label: 'ឃ (Kho)', speech: 'ឃ' },
          { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
          { letter: 'ក', label: 'ក (Ka)', speech: 'ក' }
        ],
        correctLetter: 'គ',
        explanation: 'អស្ចារ្យណាស់! «គ» គឺ គ គោ (Ko for Cow)!'
      },
      {
        id: 104,
        lessonId: 'lesson-1',
        categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
        icon: '🐝',
        clueWordKhmer: 'ឃ្មុំ',
        clueWordEnglish: 'Bee (Khmum)',
        phoneticHint: 'សំឡេងអាន៖ «ឃ» (Kho) — ឃ ឃ្មុំ',
        speechText: 'ឃ... ឃ ឃ្មុំ',
        questionKhmer: 'តើពាក្យ «ឃ្មុំ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Bee (ឃ្មុំ)?',
        options: [
          { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
          { letter: 'ឃ', label: 'ឃ (Kho)', speech: 'ឃ' },
          { letter: 'ង', label: 'ង (Ngo)', speech: 'ង' }
        ],
        correctLetter: 'ឃ',
        explanation: 'ត្រឹមត្រូវ! «ឃ» គឺ ឃ ឃ្មុំ (Kho for Bee)!'
      },

      // ---------------- LESSON 2: ព្យញ្ជនៈ ជួរ ច និង ដ-ស (lesson-2) ----------------
      {
        id: 201,
        lessonId: 'lesson-2',
        categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
        icon: '🍌',
        clueWordKhmer: 'ចេក',
        clueWordEnglish: 'Banana (Chek)',
        phoneticHint: 'សំឡេងអាន៖ «ច» (Cha) — ច ចេក',
        speechText: 'ច... ច ចេក',
        questionKhmer: 'តើពាក្យ «ចេក» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Banana (ចេក)?',
        options: [
          { letter: 'ឆ', label: 'ឆ (Chha)', speech: 'ឆ' },
          { letter: 'ជ', label: 'ជ (Cho)', speech: 'ជ' },
          { letter: 'ច', label: 'ច (Cha)', speech: 'ច' }
        ],
        correctLetter: 'ច',
        explanation: 'ត្រឹមត្រូវហើយ! «ច» គឺ ច ចេក (Cha for Banana)!'
      },
      {
        id: 202,
        lessonId: 'lesson-2',
        categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
        icon: '🐱',
        clueWordKhmer: 'ឆ្មា',
        clueWordEnglish: 'Cat (Chhmaa)',
        phoneticHint: 'សំឡេងអាន៖ «ឆ» (Chha) — ឆ ឆ្មា',
        speechText: 'ឆ... ឆ ឆ្មា',
        questionKhmer: 'តើពាក្យ «ឆ្មា» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Cat (ឆ្មា)?',
        options: [
          { letter: 'ច', label: 'ច (Cha)', speech: 'ច' },
          { letter: 'ឆ', label: 'ឆ (Chha)', speech: 'ឆ' },
          { letter: 'ញ', label: 'ញ (Nho)', speech: 'ញ' }
        ],
        correctLetter: 'ឆ',
        explanation: 'ពូកែណាស់! «ឆ» គឺ ឆ ឆ្មា (Chha for Cat)!'
      },
      {
        id: 203,
        lessonId: 'lesson-2',
        categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
        icon: '🐘',
        clueWordKhmer: 'ដំរី',
        clueWordEnglish: 'Elephant (Damrei)',
        phoneticHint: 'សំឡេងអាន៖ «ដ» (Da) — ដ ដំរី',
        speechText: 'ដ... ដ ដំរី',
        questionKhmer: 'តើពាក្យ «ដំរី» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Elephant (ដំរី)?',
        options: [
          { letter: 'ដ', label: 'ដ (Da)', speech: 'ដ' },
          { letter: 'ថ', label: 'ថ (Tha)', speech: 'ថ' },
          { letter: 'ត', label: 'ត (Ta)', speech: 'ត' }
        ],
        correctLetter: 'ដ',
        explanation: 'ឆ្លាតណាស់! «ដ» គឺ ដ ដំរី (Da for Elephant)!'
      },
      {
        id: 204,
        lessonId: 'lesson-2',
        categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
        icon: '🐴',
        clueWordKhmer: 'សេះ',
        clueWordEnglish: 'Horse (Seh)',
        phoneticHint: 'សំឡេងអាន៖ «ស» (Sa) — ស សេះ',
        speechText: 'ស... ស សេះ',
        questionKhmer: 'តើពាក្យ «សេះ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
        questionEnglish: 'Which Khmer consonant starts the word for Horse (សេះ)?',
        options: [
          { letter: 'ហ', label: 'ហ (Ha)', speech: 'ហ' },
          { letter: 'ស', label: 'ស (Sa)', speech: 'ស' },
          { letter: 'អ', label: 'អ (Qa)', speech: 'អ' }
        ],
        correctLetter: 'ស',
        explanation: 'ល្អណាស់! «ស» គឺ ស សេះ (Sa for Horse)!'
      },

      // ---------------- LESSON 3: ស្រៈនិស្ស័យ (lesson-3) ----------------
      {
        id: 301,
        lessonId: 'lesson-3',
        categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
        icon: '📖',
        clueWordKhmer: 'ក + ា = កា',
        clueWordEnglish: 'Vowel Sra Aa (ា)',
        phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អា» (Sra Aa)',
        speechText: 'ស្រៈ អា... ក អា កា',
        questionKhmer: 'តើមួយណាជា «ស្រៈ អា» (ា) ក្នុងពាក្យ «កា»?',
        questionEnglish: 'Which vowel is "Sra Aa" (ា) as in កា?',
        options: [
          { letter: 'ា', label: 'ា (ស្រៈ អា)', speech: 'ស្រៈ អា' },
          { letter: 'ិ', label: 'ិ (ស្រៈ អិ)', speech: 'ស្រៈ អិ' },
          { letter: 'ុ', label: 'ុ (ស្រៈ អុ)', speech: 'ស្រៈ អុ' }
        ],
        correctLetter: 'ា',
        explanation: 'ត្រឹមត្រូវ! «ា» អានថា ស្រៈ អា (Sra Aa)!'
      },
      {
        id: 302,
        lessonId: 'lesson-3',
        categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
        icon: '🐟',
        clueWordKhmer: 'ត្រី',
        clueWordEnglish: 'Fish (Trei — uses ី)',
        phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អី» (Sra Ei)',
        speechText: 'ស្រៈ អី... ត្រី',
        questionKhmer: 'តើពាក្យ «ត្រី» ប្រើស្រៈមួយណានៅខាងលើ?',
        questionEnglish: 'Which top vowel is used in the word ត្រី (Fish)?',
        options: [
          { letter: 'ិ', label: 'ិ (ស្រៈ អិ)', speech: 'ស្រៈ អិ' },
          { letter: 'ី', label: 'ី (ស្រៈ អី)', speech: 'ស្រៈ អី' },
          { letter: 'ឹ', label: 'ឹ (ស្រៈ អឹ)', speech: 'ស្រៈ អឹ' }
        ],
        correctLetter: 'ី',
        explanation: 'ពូកែណាស់! «ី» អានថា ស្រៈ អី (Sra Ei)!'
      },
      {
        id: 303,
        lessonId: 'lesson-3',
        categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
        icon: '🐄',
        clueWordKhmer: 'គ + ោ = គោ',
        clueWordEnglish: 'Vowel Sra Ao (ោ)',
        phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អោ» (Sra Ao)',
        speechText: 'ស្រៈ អោ... គ អោ គោ',
        questionKhmer: 'តើពាក្យ «គោ» (Cow) ផ្សំជាមួយស្រៈមួយណា?',
        questionEnglish: 'Which vowel combines with គ to spell គោ (Cow)?',
        options: [
          { letter: 'េ', label: 'េ (ស្រៈ អេ)', speech: 'ស្រៈ អេ' },
          { letter: 'ែ', label: 'ែ (ស្រៈ អែ)', speech: 'ស្រៈ អែ' },
          { letter: 'ោ', label: 'ោ (ស្រៈ អោ)', speech: 'ស្រៈ អោ' }
        ],
        correctLetter: 'ោ',
        explanation: 'អស្ចារ្យណាស់! «ោ» អានថា ស្រៈ អោ (Sra Ao)!'
      },
      {
        id: 304,
        lessonId: 'lesson-3',
        categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
        icon: '🦋',
        clueWordKhmer: 'មេអំបៅ',
        clueWordEnglish: 'Butterfly (Me-Am-Bau)',
        phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អៅ» (Sra Au)',
        speechText: 'ស្រៈ អៅ... ប អៅ បៅ',
        questionKhmer: 'តើមួយណាជា «ស្រៈ អៅ» (ៅ) ក្នុងពាក្យ «មេអំបៅ»?',
        questionEnglish: 'Which vowel is "Sra Au" (ៅ) in មេអំបៅ (Butterfly)?',
        options: [
          { letter: 'ៅ', label: 'ៅ (ស្រៈ អៅ)', speech: 'ស្រៈ អៅ' },
          { letter: 'ោ', label: 'ោ (ស្រៈ អោ)', speech: 'ស្រៈ អោ' },
          { letter: 'ាំ', label: 'ាំ (ស្រៈ អាំ)', speech: 'ស្រៈ អាំ' }
        ],
        correctLetter: 'ៅ',
        explanation: 'ត្រឹមត្រូវហើយ! «ៅ» អានថា ស្រៈ អៅ (Sra Au)!'
      },

      // ---------------- LESSON 4: ស្រៈពេញតួ (lesson-4) ----------------
      {
        id: 401,
        lessonId: 'lesson-4',
        categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
        icon: '🧙‍♂️',
        clueWordKhmer: 'ឥសី',
        clueWordEnglish: 'Hermit / Sage (Eysei)',
        phoneticHint: 'សំឡេងអាន៖ «ឥ» (Sra E) — ឥ ឥសី',
        speechText: 'ឥ... ឥ ឥសី',
        questionKhmer: 'តើពាក្យ «ឥសី» ផ្តើមដោយស្រៈពេញតួមួយណា?',
        questionEnglish: 'Which independent vowel starts the word ឥសី (Hermit)?',
        options: [
          { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
          { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
          { letter: 'ឯ', label: 'ឯ (ស្រៈ ឯ)', speech: 'ឯ' }
        ],
        correctLetter: 'ឥ',
        explanation: 'ត្រឹមត្រូវ! «ឥ» គឺស្រៈពេញតួក្នុងពាក្យ ឥសី!'
      },
      {
        id: 402,
        lessonId: 'lesson-4',
        categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
        icon: '📅',
        clueWordKhmer: 'ឧសភា',
        clueWordEnglish: 'May (Usaphea)',
        phoneticHint: 'សំឡេងអាន៖ «ឧ» (Sra O) — ឧ ឧសភា',
        speechText: 'ឧ... ឧ ឧសភា',
        questionKhmer: 'តើពាក្យ «ឧសភា» ផ្តើមដោយស្រៈពេញតួមួយណា?',
        questionEnglish: 'Which independent vowel starts the word ឧសភា (May)?',
        options: [
          { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
          { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
          { letter: 'ឱ', label: 'ឱ (ស្រៈ ឱ)', speech: 'ឱ' }
        ],
        correctLetter: 'ឧ',
        explanation: 'ពូកែណាស់! «ឧ» គឺស្រៈពេញតួក្នុងពាក្យ ឧសភា!'
      },
      {
        id: 403,
        lessonId: 'lesson-4',
        categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
        icon: '👕',
        clueWordKhmer: 'ឯកសណ្ឋាន',
        clueWordEnglish: 'Uniform (Aekasanthan)',
        phoneticHint: 'សំឡេងអាន៖ «ឯ» (Sra Ae) — ឯ ឯកសណ្ឋាន',
        speechText: 'ឯ... ឯ ឯកសណ្ឋាន',
        questionKhmer: 'តើមួយណាជាស្រៈពេញតួ «ឯ» ក្នុងពាក្យ «ឯកសណ្ឋាន»?',
        questionEnglish: 'Which independent vowel is "ឯ" (Sra Ae)?',
        options: [
          { letter: 'ឯ', label: 'ឯ (ស្រៈ ឯ)', speech: 'ឯ' },
          { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
          { letter: 'ឪ', label: 'ឪ (ស្រៈ ឪ)', speech: 'ឪ' }
        ],
        correctLetter: 'ឯ',
        explanation: 'អស្ចារ្យណាស់! «ឯ» គឺស្រៈពេញតួក្នុងពាក្យ ឯកសណ្ឋាន!'
      },
      {
        id: 404,
        lessonId: 'lesson-4',
        categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
        icon: '🍉',
        clueWordKhmer: 'ឪឡឹក',
        clueWordEnglish: 'Watermelon (Ouvloek)',
        phoneticHint: 'សំឡេងអាន៖ «ឪ» (Sra Au) — ឪ ឪឡឹក',
        speechText: 'ឪ... ឪ ឪឡឹក',
        questionKhmer: 'តើពាក្យ «ឪឡឹក» (Watermelon) ផ្តើមដោយស្រៈពេញតួមួយណា?',
        questionEnglish: 'Which independent vowel starts the word ឪឡឹក (Watermelon)?',
        options: [
          { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
          { letter: 'ឪ', label: 'ឪ (ស្រៈ ឪ)', speech: 'ឪ' },
          { letter: 'ឱ', label: 'ឱ (ស្រៈ ឱ)', speech: 'ឱ' }
        ],
        correctLetter: 'ឪ',
        explanation: 'ត្រឹមត្រូវហើយ! «ឪ» គឺ ឪ ឪឡឹក (Watermelon)!'
      }
    ];

    /**
     * C. APPLICATION STATE & SAFEGUARDS
     */
    let selectedLessonId = null;     // 'lesson-1' | 'lesson-2' | 'lesson-3' | 'lesson-4' | 'ALL' | null
    let filteredQuestions = [];      // Dynamically filtered subset of QUIZ_DATA
    let currentIndex = 0;            // Current question index within filteredQuestions
    let score = 0;                   // Current lesson score
    let totalStarsEarned = 0;        // Cumulative stars across sessions
    let lessonBestStars = {};        // Saved best stars per lessonId
    let isQuestionSolved = false;    // Prevents multiple score increments on the same question
    let isTransitioning = false;     // Double-click / rapid-tap lock during question transitions
    let wrongAttempts = [];          // Tracks wrong option letters tapped on the current question
    let toastTimerId = null;         // Timer handle for audio reading toast

    // Load saved progress from localStorage safely
    try {
      const savedTotal = localStorage.getItem('khmer_quiz_total_stars');
      if (savedTotal) totalStarsEarned = parseInt(savedTotal, 10) || 0;
      const savedBest = localStorage.getItem('khmer_quiz_lesson_best');
      if (savedBest) lessonBestStars = JSON.parse(savedBest) || {};
    } catch (_) {}

    function toKhmerNumeral(num) {
      const digits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      return String(num).split('').map(d => digits[Number(d)] ?? d).join('');
    }

    function updateHeaderStars() {
      const el = document.getElementById('headerTotalStarsLabel');
      if (el) el.textContent = 'ផ្កាយសរុប៖ ' + toKhmerNumeral(totalStarsEarned);
    }

    /**
     * D. WEB AUDIO SYNTHESIZER & WEB SPEECH API (GUARANTEED SOUND ON EVERY CLICK)
     */
    let audioCtx = null;
    let activeSpeechUtterance = null;
    let speechTimeoutId = null;

    const KHMER_PHONETIC_MAP = {
      'ក... ក ក្តាម': 'Kah... Kah, Kdaam',
      'ខ... ខ ខ្លា': 'Khah... Khah, Khlaa',
      'គ... គ គោ': 'Koh... Koh, Ko',
      'ឃ... ឃ ឃ្មុំ': 'Khoh... Khoh, Khmum',
      'ច... ច ចេក': 'Chah... Chah, Chek',
      'ឆ... ឆ ឆ្មា': 'Chhah... Chhah, Chhmaa',
      'ដ... ដ ដំរី': 'Dah... Dah, Dam-rei',
      'ស... ស សេះ': 'Sah... Sah, Seh',
      'ស្រៈ អា... ក អា កា': 'Srah Aah... Kah Aah, Kaa',
      'ស្រៈ អី... ត្រី': 'Srah Ei... Trei',
      'ស្រៈ អោ... គ អោ គោ': 'Srah Ao... Koh Ao, Ko',
      'ស្រៈ អៅ... ប អៅ បៅ': 'Srah Au... Bah Au, Bau',
      'ឥ... ឥ ឥសី': 'Srah E... Ey-sei',
      'ឧ... ឧ ឧសភា': 'Srah Oh... U-sa-phea',
      'ឯ... ឯ ឯកសណ្ឋាន': 'Srah Ae... Ae-ka-san-than',
      'ឪ... ឪ ឪឡឹក': 'Srah Au... Ouv-loek',
      'ក': 'Kah', 'ខ': 'Khah', 'គ': 'Koh', 'ឃ': 'Khoh', 'ង': 'Ngoh',
      'ច': 'Chah', 'ឆ': 'Chhah', 'ជ': 'Choh', 'ឈ': 'Chhoh', 'ញ': 'Nhoh',
      'ដ': 'Dah', 'ឋ': 'Thah', 'ឌ': 'Doh', 'ឍ': 'Thoh', 'ណ': 'Nah',
      'ត': 'Tah', 'ថ': 'Thah', 'ទ': 'Toh', 'ធ': 'Thoh', 'ន': 'Noh',
      'ប': 'Bah', 'ផ': 'Phah', 'ព': 'Poh', 'ភ': 'Phoh', 'ម': 'Moh',
      'យ': 'Yoh', 'រ': 'Roh', 'ល': 'Loh', 'វ': 'Voh', 'ស': 'Sah',
      'ហ': 'Hah', 'ឡ': 'Lah', 'អ': 'Ah',
      'ស្រៈ អា': 'Srah Aah', 'ា': 'Srah Aah',
      'ស្រៈ អិ': 'Srah Eh', 'ិ': 'Srah Eh',
      'ស្រៈ អី': 'Srah Ei', 'ី': 'Srah Ei',
      'ស្រៈ អឹ': 'Srah Oe', 'ឹ': 'Srah Oe',
      'ស្រៈ អឺ': 'Srah Oeu', 'ឺ': 'Srah Oeu',
      'ស្រៈ អុ': 'Srah Oh', 'ុ': 'Srah Oh',
      'ស្រៈ អូ': 'Srah Ou', 'ូ': 'Srah Ou',
      'ស្រៈ អេ': 'Srah Ey', 'េ': 'Srah Ey',
      'ស្រៈ អែ': 'Srah Ae', 'ែ': 'Srah Ae',
      'ស្រៈ អោ': 'Srah Ao', 'ោ': 'Srah Ao',
      'ស្រៈ អៅ': 'Srah Au', 'ៅ': 'Srah Au',
      'ស្រៈ អាំ': 'Srah Am', 'ាំ': 'Srah Am',
      'ឥ': 'Srah E', 'ឧ': 'Srah Oh', 'ឯ': 'Srah Ae', 'ឪ': 'Srah Au', 'ឱ': 'Srah Ao'
    };

    function toKhmerPhonetic(text) {
      const trimmed = String(text || '').trim();
      if (KHMER_PHONETIC_MAP[trimmed]) return KHMER_PHONETIC_MAP[trimmed];
      return 'Kah';
    }

    function withUnlockedAudioCtx(callback) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx) audioCtx = new AudioContextClass();

        // Play 1-sample silent buffer synchronously to unlock audio on click/touch
        try {
          const silentBuffer = audioCtx.createBuffer(1, 1, 22050);
          const source = audioCtx.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(audioCtx.destination);
          source.start(0);
        } catch (_) {}

        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(() => callback(audioCtx)).catch(() => {});
        } else {
          callback(audioCtx);
        }
      } catch (_) {}
    }

    function playChime(type) {
      withUnlockedAudioCtx(ctx => {
        const now = ctx.currentTime + 0.01;
        function playTone(freq, startTime, duration, wave, peakGain) {
          const osc = ctx.createOscillator();
          const subOsc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = wave || 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(freq * 2, startTime);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(peakGain || 0.32, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);
          osc.connect(gain);
          subOsc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          subOsc.start(startTime);
          osc.stop(startTime + duration + 0.02);
          subOsc.stop(startTime + duration + 0.02);
        }

        if (type === 'correct') {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            playTone(freq, now + idx * 0.08, 0.28, 'triangle', 0.35);
          });
        } else if (type === 'tryAgain') {
          [392.0, 329.63].forEach((freq, idx) => {
            playTone(freq, now + idx * 0.12, 0.25, 'sine', 0.28);
          });
        } else if (type === 'speak') {
          playTone(587.33, now, 0.14, 'triangle', 0.26);
          playTone(880.0, now + 0.07, 0.18, 'sine', 0.24);
        } else if (type === 'tap') {
          playTone(659.25, now, 0.12, 'triangle', 0.28);
        } else if (type === 'victory') {
          [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((freq, idx) => {
            playTone(freq, now + idx * 0.1, 0.34, 'triangle', 0.36);
          });
        }
      });
    }

    function showAudioToast(text, phoneticText, hasKhmerVoice) {
      const banner = document.getElementById('audioToastBanner');
      const label = document.getElementById('audioToastText');
      const badge = document.getElementById('audioSupportBadge');
      if (!banner || !label || !badge) return;

      label.textContent = '🔊 អានថា៖ «' + text + '» (' + phoneticText + ')';
      badge.textContent = hasKhmerVoice ? 'Khmer Voice (km-KH)' : 'Phonetic Voice + Chime';
      banner.classList.remove('hidden');

      if (toastTimerId) clearTimeout(toastTimerId);
      toastTimerId = setTimeout(() => {
        banner.classList.add('hidden');
      }, 2800);
    }

    function speakKhmer(text) {
      playChime('speak');
      const phoneticText = toKhmerPhonetic(text);
      const hasSpeechSupport = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

      if (!hasSpeechSupport) {
        showAudioToast(text, phoneticText, false);
        return;
      }

      function startSpeech() {
        try {
          const synth = window.speechSynthesis;
          if (synth.paused) synth.resume();

          const voices = synth.getVoices ? synth.getVoices() : [];
          const khmerVoice = voices.find(v =>
            (v.lang && v.lang.toLowerCase().includes('km')) ||
            (v.name && v.name.toLowerCase().includes('khmer')) ||
            (v.name && v.name.toLowerCase().includes('cambodia'))
          );

          showAudioToast(text, phoneticText, !!khmerVoice);

          const spokenString = khmerVoice ? text : phoneticText;
          const utterance = new SpeechSynthesisUtterance(spokenString);
          activeSpeechUtterance = utterance;

          if (khmerVoice) {
            utterance.voice = khmerVoice;
            utterance.lang = khmerVoice.lang || 'km-KH';
            utterance.rate = 0.85;
            utterance.pitch = 1.08;
          } else {
            const enVoice =
              voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en') && v.default) ||
              voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) ||
              voices[0];
            if (enVoice) {
              utterance.voice = enVoice;
              utterance.lang = enVoice.lang || 'en-US';
            } else {
              utterance.lang = 'en-US';
            }
            utterance.rate = 0.82;
            utterance.pitch = 1.05;
          }

          utterance.volume = 1.0;
          synth.speak(utterance);
        } catch (_) {}
      }

      try {
        if (speechTimeoutId) clearTimeout(speechTimeoutId);
        const synth = window.speechSynthesis;
        if (synth.speaking || synth.pending) {
          synth.cancel();
          speechTimeoutId = setTimeout(startSpeech, 35);
        } else {
          startSpeech();
        }
      } catch (_) {}
    }

    function speakCurrentQuestion() {
      const q = filteredQuestions[currentIndex];
      if (q) speakKhmer(q.speechText);
    }

    /**
     * E. SCREEN NAVIGATION CONTROLLER (HOME -> LESSON_SELECT -> QUIZ -> RESULTS)
     */
    function retriggerScreenAnimation(el) {
      if (!el) return;
      el.classList.remove('animate-screen');
      void el.offsetWidth; // Force reflow for smooth CSS animation replay
      el.classList.add('animate-screen');
    }

    function navigateToScreen(screenName) {
      // Cancel any ongoing speech when switching screens
      try {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      } catch (_) {}

      const homeEl = document.getElementById('homeScreen');
      const lessonEl = document.getElementById('lessonSelectScreen');
      const quizEl = document.getElementById('quizScreen');
      const resultEl = document.getElementById('celebrationScreen');

      homeEl.classList.add('hidden');
      lessonEl.classList.add('hidden');
      quizEl.classList.add('hidden');
      resultEl.classList.add('hidden');

      if (screenName === 'HOME') {
        homeEl.classList.remove('hidden');
        retriggerScreenAnimation(homeEl);
      } else if (screenName === 'LESSON_SELECT') {
        renderLessonCards();
        lessonEl.classList.remove('hidden');
        retriggerScreenAnimation(lessonEl);
      } else if (screenName === 'QUIZ') {
        quizEl.classList.remove('hidden');
        retriggerScreenAnimation(quizEl);
      } else if (screenName === 'RESULTS') {
        resultEl.classList.remove('hidden');
        retriggerScreenAnimation(resultEl);
      }
    }

    /**
     * F. RENDER LESSON SELECTION CARDS & DYNAMIC QUESTION FILTERING
     */
    function renderLessonCards() {
      const grid = document.getElementById('lessonCardsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      QUIZ_LESSONS.forEach(lesson => {
        const count = QUIZ_DATA.filter(q => q.lessonId === lesson.id).length;
        const bestStars = lessonBestStars[lesson.id] || 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'group text-left bg-white hover:bg-amber-50/70 rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-[0_5px_0_#fcd34d] active:translate-y-1 transition-all flex flex-col justify-between cursor-pointer';
        btn.onclick = () => startLessonQuiz(lesson.id);

        btn.innerHTML = \`
          <div>
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-105 transition-transform">
                \${lesson.icon}
              </div>
              <div class="text-right tabular-nums">
                <span class="text-xs sm:text-sm font-bold text-slate-600 block">
                  ចំនួនសំណួរ៖ \${toKhmerNumeral(count)} សំណួរ
                </span>
                <span class="text-xs font-bold text-amber-600 mt-1 block">
                  ⭐ ពិន្ទុខ្ពស់បំផុត៖ \${toKhmerNumeral(bestStars)} / \${toKhmerNumeral(count)}
                </span>
              </div>
            </div>
            <p class="text-xs sm:text-sm font-bold text-amber-700 mb-1">\${lesson.numberLabel}</p>
            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-1">\${lesson.titleKhmer}</h3>
            <p class="text-xs sm:text-sm font-semibold text-slate-500 mb-3">\${lesson.titleEnglish}</p>
            <p class="text-sm text-slate-600 mb-5 leading-relaxed">\${lesson.description}</p>
          </div>
          <div class="pt-4 border-t border-amber-200/80 flex items-center justify-between gap-3">
            <span class="text-base sm:text-lg font-bold text-slate-800">តួអក្សរ៖ \${lesson.sampleLetters}</span>
            <span class="text-sm sm:text-base font-bold text-emerald-700 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              ចាប់ផ្តើមមេរៀន &rarr;
            </span>
          </div>
        \`;
        grid.appendChild(btn);
      });
    }

    /**
     * Filter QUIZ_DATA by \`lessonId\` and start the quiz cleanly
     */
    function startLessonQuiz(lessonId) {
      playChime('tap');
      selectedLessonId = lessonId;
      filteredQuestions = QUIZ_DATA.filter(q => lessonId === 'ALL' ? true : q.lessonId === lessonId);

      // Reset all quiz gameplay states completely
      currentIndex = 0;
      score = 0;
      isQuestionSolved = false;
      isTransitioning = false;
      wrongAttempts = [];

      navigateToScreen('QUIZ');

      // Safeguard for empty lesson edge case
      const emptyEl = document.getElementById('emptyLessonFallback');
      const contentEl = document.getElementById('quizCardContent');
      if (filteredQuestions.length === 0) {
        emptyEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        return;
      }

      emptyEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      renderQuestion();
    }

    function returnToLessonSelect() {
      playChime('tap');
      selectedLessonId = null;
      currentIndex = 0;
      score = 0;
      isQuestionSolved = false;
      isTransitioning = false;
      wrongAttempts = [];
      navigateToScreen('LESSON_SELECT');
    }

    /**
     * G. RENDER CURRENT QUESTION & MULTIPLE-CHOICE OPTIONS
     */
    function renderQuestion() {
      const q = filteredQuestions[currentIndex];
      if (!q) return;

      isTransitioning = false;
      const lessonMeta = QUIZ_LESSONS.find(l => l.id === selectedLessonId);

      document.getElementById('activeLessonBadge').textContent = lessonMeta
        ? \`\${lessonMeta.numberLabel} · \${lessonMeta.titleKhmer}\`
        : 'គ្រប់មេរៀនទាំងអស់ (All Lessons Mixed)';

      document.getElementById('questionCounterText').textContent =
        \`សំណួរទី \${toKhmerNumeral(currentIndex + 1)} នៃ \${toKhmerNumeral(filteredQuestions.length)} · Question \${currentIndex + 1} of \${filteredQuestions.length}\`;

      document.getElementById('lessonScoreLabel').textContent =
        \`ពិន្ទុមេរៀន៖ \${toKhmerNumeral(score)} / \${toKhmerNumeral(filteredQuestions.length)}\`;

      document.getElementById('progressBarFill').style.width =
        \`\${((currentIndex + 1) / filteredQuestions.length) * 100}%\`;

      document.getElementById('categoryBadge').textContent = q.categoryLabel;
      document.getElementById('clueIcon').textContent = q.icon;
      document.getElementById('clueWordKhmer').textContent = q.clueWordKhmer;
      document.getElementById('clueWordEnglish').textContent = q.clueWordEnglish;
      document.getElementById('phoneticHint').textContent = q.phoneticHint;
      document.getElementById('questionEnglish').textContent = q.questionEnglish;
      document.getElementById('questionKhmer').textContent = q.questionKhmer;

      const optionsContainer = document.getElementById('optionsContainer');
      optionsContainer.innerHTML = '';

      q.options.forEach(opt => {
        const isCorrect = isQuestionSolved && opt.letter === q.correctLetter;
        const isWrong = wrongAttempts.includes(opt.letter);

        let classes = 'border-amber-300 bg-amber-50/50 hover:bg-amber-100/80 text-slate-900 shadow-[0_5px_0_#fcd34d]';
        if (isCorrect) {
          classes = 'border-emerald-600 bg-emerald-500 text-white shadow-[0_5px_0_#047857] animate-pop';
        } else if (isWrong) {
          classes = 'border-rose-300 bg-rose-50/80 text-slate-400 shadow-none animate-shake';
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = \`relative min-h-[140px] sm:min-h-[165px] p-5 rounded-3xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer active:translate-y-1 \${classes}\`;
        btn.onclick = () => selectOption(opt);

        btn.innerHTML = \`
          <span class="absolute top-3 right-3 text-xs opacity-75">🔊</span>
          <span class="text-5xl sm:text-6xl font-bold mb-3 py-1">\${opt.letter}</span>
          <span class="text-sm sm:text-base font-bold whitespace-nowrap">\${opt.label}</span>
          \${isCorrect ? '<span class="mt-2 text-xs font-extrabold">✓ ត្រឹមត្រូវ!</span>' : ''}
        \`;
        optionsContainer.appendChild(btn);
      });
    }

    function selectOption(opt) {
      // Prevent rapid double-clicks during transition
      if (isTransitioning) return;

      const q = filteredQuestions[currentIndex];
      if (!q) return;

      speakKhmer(opt.speech);
      if (isQuestionSolved) return;

      const banner = document.getElementById('feedbackBanner');

      if (opt.letter === q.correctLetter) {
        isQuestionSolved = true;
        score += 1;
        totalStarsEarned += 1;

        try {
          localStorage.setItem('khmer_quiz_total_stars', String(totalStarsEarned));
        } catch (_) {}
        updateHeaderStars();

        playChime('correct');
        renderQuestion();

        const isLast = currentIndex + 1 >= filteredQuestions.length;
        banner.className = 'rounded-2xl p-5 border-2 border-emerald-400 bg-emerald-50/90 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pop';
        banner.innerHTML = \`
          <div class="text-left">
            <p class="font-bold text-base sm:text-lg text-slate-900">🌟 អស្ចារ្យណាស់! ចម្លើយត្រឹមត្រូវ! (+១ ផ្កាយ)</p>
            <p class="text-sm text-slate-700">\${q.explanation}</p>
          </div>
          <button
            type="button"
            onclick="nextQuestion()"
            class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-[0_4px_0_#065f46] whitespace-nowrap cursor-pointer"
          >
            \${isLast ? 'មើលលទ្ធផលមេរៀន (Finish) 🏆' : 'សំណួរបន្ទាប់ (Next) ➔'}
          </button>
        \`;
      } else {
        playChime('tryAgain');
        if (!wrongAttempts.includes(opt.letter)) wrongAttempts.push(opt.letter);
        renderQuestion();

        banner.className = 'rounded-2xl p-5 border-2 border-amber-300 bg-amber-50/90 text-left';
        banner.innerHTML = \`
          <p class="font-bold text-base sm:text-lg text-slate-900">💪 សាកល្បងម្តងទៀតកូន! (Good try!)</p>
          <p class="text-sm text-slate-700">កូនបានជ្រើសរើស «\${opt.letter}»។ ចុចស្តាប់សំឡេង ហើយជ្រើសរើសម្តងទៀតណា!</p>
        \`;
      }
    }

    function nextQuestion() {
      // Prevent double-clicking the Next button
      if (isTransitioning) return;
      isTransitioning = true;

      if (currentIndex + 1 < filteredQuestions.length) {
        currentIndex += 1;
        isQuestionSolved = false;
        wrongAttempts = [];
        const banner = document.getElementById('feedbackBanner');
        banner.className = 'rounded-2xl p-4 border border-dashed border-amber-300 bg-amber-50/40 text-center text-sm font-semibold text-slate-600';
        banner.textContent = '👆 ចុចលើប៊ូតុងអក្សរណាមួយខាងលើ ដើម្បីឆ្លើយ និងស្តាប់សំឡេង!';
        renderQuestion();
      } else {
        // Save best score for this lesson
        if (selectedLessonId) {
          const prevBest = lessonBestStars[selectedLessonId] || 0;
          if (score > prevBest) {
            lessonBestStars[selectedLessonId] = score;
            try {
              localStorage.setItem('khmer_quiz_lesson_best', JSON.stringify(lessonBestStars));
            } catch (_) {}
          }
        }

        playChime('victory');
        const lessonMeta = QUIZ_LESSONS.find(l => l.id === selectedLessonId);
        document.getElementById('completedLessonLabel').textContent = lessonMeta
          ? \`\${lessonMeta.numberLabel} · \${lessonMeta.titleKhmer}\`
          : 'គ្រប់មេរៀនទាំងអស់ (All Lessons)';

        document.getElementById('finalScoreText').textContent =
          \`\${toKhmerNumeral(score)} / \${toKhmerNumeral(filteredQuestions.length)} ⭐\`;

        document.getElementById('celebrationMessageText').textContent =
          score === filteredQuestions.length
            ? 'ពូកែណាស់កូន! កូនឆ្លើយត្រូវគ្រប់សំណួរទាំងអស់ក្នុងមេរៀននេះ!'
            : 'ល្អណាស់កូន! បន្តហ្វឹកហាត់អាន និងឆ្លើយសំណួរដើម្បីទទួលបានផ្កាយពេញ!';

        const starsRow = document.getElementById('earnedStarsRow');
        starsRow.innerHTML = '';
        for (let i = 0; i < filteredQuestions.length; i++) {
          const span = document.createElement('span');
          span.textContent = i < score ? '⭐' : '☆';
          span.className = 'animate-float';
          span.style.animationDelay = \`\${i * 90}ms\`;
          starsRow.appendChild(span);
        }

        navigateToScreen('RESULTS');
        isTransitioning = false;
      }
    }

    function restartCurrentLessonQuiz() {
      startLessonQuiz(selectedLessonId || 'lesson-1');
    }

    // Initialize app on load
    updateHeaderStars();
    renderLessonCards();
  </script>
</body>
</html>`;
