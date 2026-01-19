/**
 * NCSSM Rotary Presentation — Narration System
 * Plays pre-generated audio files from audio/ directory
 * Press 'V' to toggle narration mode with auto-advance
 *
 * To regenerate audio: node generate-audio.js
 * To regenerate single slide: node generate-audio.js --slide 5
 */

(function() {
  'use strict';

  // State
  let isNarrating = false;
  let currentAudio = null;
  let autoAdvanceEnabled = false;
  let isAutoAdvancing = false; // Flag to prevent double-narration

  // ============================================
  // Audio Playback (Local Files)
  // ============================================

  function playAudio(filename, onComplete) {
    // Stop any current audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    currentAudio = new Audio(filename);

    currentAudio.onended = () => {
      currentAudio = null;
      if (onComplete) onComplete();
    };

    currentAudio.onerror = (e) => {
      console.error(`Error loading audio: ${filename}`, e);
      currentAudio = null;
      if (onComplete) onComplete();
    };

    currentAudio.play().catch(err => {
      console.error(`Error playing audio: ${filename}`, err);
      currentAudio = null;
      if (onComplete) onComplete();
    });
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  // ============================================
  // Main Slide Narration
  // ============================================

  function narrateSlide(slideNumber, onComplete) {
    const filename = `audio/slide-${slideNumber}.mp3`;
    console.log(`Narrating slide ${slideNumber}`);
    playAudio(filename, onComplete);
  }

  // ============================================
  // Auto-Advance Logic
  // ============================================

  function getState() {
    // Get state from presentation module
    if (typeof window.Presentation !== 'undefined' && window.Presentation.getState) {
      return window.Presentation.getState();
    }
    return null;
  }

  function startAutoNarration() {
    if (isNarrating) return;

    const state = getState();
    if (!state) {
      console.error('Presentation state not available');
      return;
    }

    isNarrating = true;
    autoAdvanceEnabled = true;

    showNarrationIndicator(true);
    narrateCurrentSlide();
  }

  function narrateCurrentSlide() {
    const state = getState();
    if (!state || !isNarrating || !autoAdvanceEnabled) return;

    narrateSlide(state.currentSlide, () => {
      // After narration completes, auto-advance if still enabled
      if (isNarrating && autoAdvanceEnabled) {
        // Check if we're at the last slide
        if (state.currentSlide < state.totalSlides) {
          // Small delay before advancing
          setTimeout(() => {
            if (isNarrating && autoAdvanceEnabled) {
              advanceToNextSlide();
            }
          }, 500);
        } else {
          // Reached end of presentation
          console.log('Reached end of presentation');
          stopNarration();
          showNarrationIndicator(false);
        }
      }
    });
  }

  function advanceToNextSlide() {
    const state = getState();
    if (!state) return;

    // Set flag to prevent onSlideChange from double-triggering narration
    isAutoAdvancing = true;

    // Directly call the presentation's goToSlide function
    if (typeof window.Presentation !== 'undefined' && window.Presentation.goToSlide) {
      window.Presentation.goToSlide(state.currentSlide + 1);
    }

    // Wait for slide transition, then narrate
    setTimeout(() => {
      isAutoAdvancing = false;
      const newState = getState();
      if (isNarrating && autoAdvanceEnabled && newState) {
        narrateCurrentSlide();
      }
    }, 300);
  }

  function stopNarration() {
    stopAudio();
    isNarrating = false;
    autoAdvanceEnabled = false;
  }

  // ============================================
  // UI Indicator
  // ============================================

  function showNarrationIndicator(show) {
    let indicator = document.getElementById('narration-indicator');

    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'narration-indicator';
        indicator.innerHTML = '🎙️ Narration Active';
        indicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 51, 102, 0.95);
          color: #fff;
          padding: 10px 18px;
          border-radius: 24px;
          font-size: 1rem;
          font-weight: 500;
          z-index: 10000;
          pointer-events: none;
          transition: opacity 0.3s;
          border: 1px solid rgba(74, 144, 217, 0.5);
          font-family: 'Montserrat', sans-serif;
        `;
        document.body.appendChild(indicator);
      }
      indicator.style.opacity = '1';
    } else {
      if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 300);
      }
    }
  }

  // ============================================
  // Toggle Function
  // ============================================

  function toggleNarration() {
    if (isNarrating) {
      console.log('Narration disabled');
      stopNarration();
      showNarrationIndicator(false);
      return false;
    } else {
      console.log('Narration enabled');
      startAutoNarration();
      return true;
    }
  }

  // ============================================
  // Public API
  // ============================================

  window.Narration = {
    // Toggle narration mode (called by 'V' key)
    toggle: toggleNarration,

    // Stop narration
    stop: stopNarration,

    // Check if narrating
    isActive: function() {
      return isNarrating;
    },

    // Play specific audio file
    playAudio: playAudio,

    // Narrate a specific slide (manual trigger)
    narrateSlide: narrateSlide,

    // Called when user manually navigates to a slide
    onSlideChange: function(slideNumber) {
      // Skip if this is an auto-advance (already handled)
      if (isAutoAdvancing) return;

      // If narration is active, narrate the new slide
      if (isNarrating) {
        // Stop current audio and narrate new slide
        stopAudio();
        setTimeout(() => narrateCurrentSlide(), 100);
      }
    }
  };

  console.log('Narration system ready. Press V to toggle narration.');

})();
