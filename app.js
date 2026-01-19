/**
 * NCSSM Rotary Presentation — Navigation & UI Logic
 */

(function() {
  'use strict';

  // ============================================
  // State
  // ============================================

  const state = {
    currentSlide: 1,
    totalSlides: 24,
    sidebarVisible: true,
    chapters: {
      1: { start: 1, end: 2, name: 'Welcome' },
      2: { start: 3, end: 5, name: 'Our Story' },
      3: { start: 6, end: 9, name: 'By the Numbers' },
      4: { start: 10, end: 12, name: 'Programs' },
      5: { start: 13, end: 15, name: 'Success' },
      6: { start: 16, end: 19, name: 'Impact' },
      7: { start: 20, end: 22, name: 'Alumni' },
      8: { start: 23, end: 24, name: 'Close' }
    }
  };

  // ============================================
  // DOM Elements
  // ============================================

  const elements = {
    presentation: document.getElementById('presentation'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    slideCounter: document.getElementById('slide-counter'),
    currentSlideEl: document.getElementById('current-slide'),
    totalSlidesEl: document.getElementById('total-slides'),
    chapterItems: document.querySelectorAll('.chapter-list .nav-item'),
    slides: document.querySelectorAll('.slide')
  };

  // ============================================
  // Navigation Functions
  // ============================================

  function goToSlide(slideNumber) {
    if (slideNumber < 1 || slideNumber > state.totalSlides) return;

    // Update slide visibility
    elements.slides.forEach((slide, index) => {
      const slideNum = index + 1;
      slide.classList.remove('active', 'prev');

      if (slideNum === slideNumber) {
        slide.classList.add('active');
      } else if (slideNum < slideNumber) {
        slide.classList.add('prev');
      }
    });

    state.currentSlide = slideNumber;
    updateCounter();
    updateChapterNav();
  }

  function nextSlide() {
    if (state.currentSlide < state.totalSlides) {
      goToSlide(state.currentSlide + 1);
    }
  }

  function prevSlide() {
    if (state.currentSlide > 1) {
      goToSlide(state.currentSlide - 1);
    }
  }

  function goToChapter(chapterNum) {
    const chapter = state.chapters[chapterNum];
    if (chapter) {
      goToSlide(chapter.start);
    }
  }

  function nextChapter() {
    const currentChapter = getCurrentChapter();
    if (currentChapter < 8) {
      goToChapter(currentChapter + 1);
    }
  }

  function prevChapter() {
    const currentChapter = getCurrentChapter();
    if (currentChapter > 1) {
      goToChapter(currentChapter - 1);
    } else {
      goToSlide(1);
    }
  }

  // ============================================
  // UI Update Functions
  // ============================================

  function updateCounter() {
    elements.currentSlideEl.textContent = state.currentSlide;
    elements.totalSlidesEl.textContent = state.totalSlides;
  }

  function updateChapterNav() {
    const currentChapter = getCurrentChapter();

    elements.chapterItems.forEach(item => {
      const chapterNum = parseInt(item.dataset.chapter);
      item.classList.toggle('active', chapterNum === currentChapter);
    });
  }

  function getCurrentChapter() {
    for (const [num, chapter] of Object.entries(state.chapters)) {
      if (state.currentSlide >= chapter.start && state.currentSlide <= chapter.end) {
        return parseInt(num);
      }
    }
    return 1;
  }

  // ============================================
  // Sidebar Functions
  // ============================================

  function toggleSidebar() {
    state.sidebarVisible = !state.sidebarVisible;
    elements.sidebar.classList.toggle('collapsed', !state.sidebarVisible);
    elements.presentation.classList.toggle('expanded', !state.sidebarVisible);
    elements.sidebarToggle.classList.toggle('visible', !state.sidebarVisible);
  }

  // ============================================
  // Event Handlers
  // ============================================

  function handleKeydown(e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'PageDown':
        e.preventDefault();
        nextChapter();
        break;
      case 'PageUp':
        e.preventDefault();
        prevChapter();
        break;
      case 's':
      case 'S':
        e.preventDefault();
        toggleSidebar();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(state.totalSlides);
        break;
    }

    // Number keys 1-8 for chapters
    const num = parseInt(e.key);
    if (num >= 1 && num <= 8 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      goToChapter(num);
    }
  }

  function handleChapterClick(e) {
    const chapterItem = e.target.closest('.nav-item');
    if (chapterItem && chapterItem.dataset.chapter) {
      const chapterNum = parseInt(chapterItem.dataset.chapter);
      goToChapter(chapterNum);
    }
  }

  function handleSlideClick(e) {
    // Click on slide advances to next (unless clicking on interactive element)
    const target = e.target;
    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a, button')) {
      return;
    }
    nextSlide();
  }

  // ============================================
  // Initialization
  // ============================================

  function init() {
    // Set initial slide
    goToSlide(1);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);

    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', toggleSidebar);

    // Chapter navigation
    elements.chapterItems.forEach(item => {
      item.addEventListener('click', handleChapterClick);
    });

    // Click to advance
    elements.presentation.addEventListener('click', handleSlideClick);

    // Handle URL hash for direct slide access
    if (window.location.hash) {
      const slideNum = parseInt(window.location.hash.slice(1));
      if (slideNum >= 1 && slideNum <= state.totalSlides) {
        goToSlide(slideNum);
      }
    }

    console.log('NCSSM Rotary Presentation initialized');
  }

  // Export state for debugging
  window.presentationState = state;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
