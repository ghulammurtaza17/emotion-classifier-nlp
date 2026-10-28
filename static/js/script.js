/**
 * Emotion Classifier - Frontend Script
 * Handles input validation, dynamic word/character counting,
 * UI state transitions (empty, loading, result, error), and
 * API interaction with the upcoming Flask backend.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('classifier-form');
  const textInput = document.getElementById('text-input');
  const textareaWrapper = document.getElementById('textarea-wrapper');
  const quickClearBtn = document.getElementById('quick-clear-btn');
  const clearBtn = document.getElementById('clear-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnIcon = analyzeBtn.querySelector('.btn-icon');
  const btnText = analyzeBtn.querySelector('.btn-text');
  const inputFeedback = document.getElementById('input-feedback');

  // Counter Elements
  const wordCountSpan = document.getElementById('word-count');
  const charCountSpan = document.getElementById('char-count');
  const charCountParent = charCountSpan.closest('.stat-badge');

  // State Containers
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const resultCard = document.getElementById('result-card');
  const errorState = document.getElementById('error-state');
  const dismissErrorBtn = document.getElementById('dismiss-error-btn');

  // Result Elements
  const emotionNameEl = document.getElementById('emotion-name');
  const emotionAvatarEl = document.getElementById('emotion-avatar');
  const confidencePillEl = document.getElementById('confidence-pill');
  const emotionDescriptionEl = document.getElementById('emotion-description');
  const meterValEl = document.getElementById('meter-val');
  const meterFillEl = document.getElementById('meter-fill');
  const resultTimeEl = document.getElementById('result-time');
  const probabilitiesSection = document.getElementById('probabilities-section');
  const probGrid = document.getElementById('prob-grid');

  // Error Elements
  const errorTitleEl = document.getElementById('error-title');
  const errorMessageEl = document.getElementById('error-message');

  // Sample Chips
  const sampleChips = document.querySelectorAll('.sample-chip');

  // 3D Emoji Companion Elements
  const emojiOrb = document.getElementById('emoji-orb');
  const orbFloatWrap = document.getElementById('orb-float-wrap');
  const orbSpecular = document.getElementById('orb-specular');
  const orbFace = document.getElementById('orb-face');
  const orbGroundShadow = document.getElementById('orb-ground-shadow');
  const orbAura = document.getElementById('orb-aura');
  const companionStage = document.getElementById('companion-stage');
  const companionSection = document.getElementById('companion-section');
  const companionEmotionName = document.getElementById('companion-emotion-name');
  const emotionBtns = document.querySelectorAll('.emotion-btn');

  // Companion Emotion Configurations
  const COMPANION_EMOTIONS = {
    joy: { name: 'Joy 😄', class: 'orb--joy' },
    sadness: { name: 'Sadness 😢', class: 'orb--sadness' },
    anger: { name: 'Anger 😠', class: 'orb--anger' },
    fear: { name: 'Fear 😨', class: 'orb--fear' },
    love: { name: 'Love 🥰', class: 'orb--love' },
    surprise: { name: 'Surprise 😲', class: 'orb--surprise' }
  };

  let activeCompanionEmotion = 'joy';

  // Max characters
  const MAX_CHARS = 2000;

  // Emotion Metadata definitions for rendering real model predictions
  const EMOTION_META = {
    joy: {
      emoji: '😊',
      label: 'Joy',
      themeClass: 'theme-joy',
      description: 'Expression of happiness, delight, celebration, or positive fulfillment.'
    },
    sadness: {
      emoji: '😢',
      label: 'Sadness',
      themeClass: 'theme-sadness',
      description: 'Expression of grief, sorrow, disappointment, or feeling overwhelmed.'
    },
    anger: {
      emoji: '😠',
      label: 'Anger',
      themeClass: 'theme-anger',
      description: 'Expression of annoyance, frustration, outrage, or resentment.'
    },
    fear: {
      emoji: '😨',
      label: 'Fear',
      themeClass: 'theme-fear',
      description: 'Expression of anxiety, terror, apprehension, or feeling vulnerable.'
    },
    love: {
      emoji: '❤️',
      label: 'Love',
      themeClass: 'theme-love',
      description: 'Expression of deep affection, tenderness, nostalgia, or romance.'
    },
    surprise: {
      emoji: '😲',
      label: 'Surprise',
      themeClass: 'theme-surprise',
      description: 'Expression of amazement, sudden shock, astonishment, or wonder.'
    }
  };

  /**
   * Update character and word counters based on textarea content.
   */
  function updateCounters() {
    const rawText = textInput.value;
    const charCount = rawText.length;
    charCountSpan.textContent = charCount.toLocaleString();

    // Word count calculation
    const trimmed = rawText.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    wordCountSpan.textContent = wordCount.toLocaleString();

    // Visual warning when approaching or reaching limit
    if (charCount >= MAX_CHARS) {
      charCountParent.classList.add('limit-warning');
    } else {
      charCountParent.classList.remove('limit-warning');
    }

    // Toggle quick clear button inside textarea
    if (rawText.length > 0) {
      quickClearBtn.hidden = false;
    } else {
      quickClearBtn.hidden = true;
    }
  }

  /**
   * Switch the 3D companion's emotion appearance.
   * Purely visual; does not simulate predictions.
   * @param {string} emotionKey - 'joy' | 'sadness' | 'anger' | 'fear' | 'love' | 'surprise'
   * @param {boolean} isPreview - If true, temporarily shows mood without changing locked selection
   */
  function setCompanionEmotion(emotionKey, isPreview = false) {
    const key = String(emotionKey).toLowerCase().trim();
    const config = COMPANION_EMOTIONS[key];
    if (!config || !emojiOrb) return;

    // Remove all emotion modifier classes from the orb
    emojiOrb.classList.remove(
      'orb--joy', 'orb--sadness', 'orb--anger',
      'orb--fear', 'orb--love', 'orb--surprise'
    );
    emojiOrb.classList.add(config.class);

    // Update the companion mood status label
    if (companionEmotionName) {
      companionEmotionName.textContent = config.name;
    }

    if (!isPreview) {
      activeCompanionEmotion = key;
      // Update aria-pressed and active classes on emotion buttons
      emotionBtns.forEach(btn => {
        const isMatch = btn.getAttribute('data-emotion') === key;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });
    }
  }

  /**
   * Clear any validation errors and input warning styling.
   */
  function clearValidation() {
    textareaWrapper.classList.remove('has-error');
    inputFeedback.hidden = true;
    inputFeedback.textContent = '';
  }

  /**
   * Show inline input validation error.
   * @param {string} message - Validation message to display
   */
  function showValidationError(message) {
    textareaWrapper.classList.add('has-error');
    inputFeedback.textContent = message;
    inputFeedback.hidden = false;
    textInput.focus();
  }

  /**
   * Show exactly one result state (empty, loading, result, or error).
   * Enforces strict mutual exclusivity by setting hidden attribute, aria-hidden, and style.display.
   * @param {'empty' | 'loading' | 'result' | 'error'} state
   */
  function setViewState(state) {
    const states = [
      { key: 'empty', el: emptyState },
      { key: 'loading', el: loadingState },
      { key: 'result', el: resultCard },
      { key: 'error', el: errorState }
    ];

    states.forEach(({ key, el }) => {
      if (!el) return;
      if (key === state) {
        el.hidden = false;
        el.removeAttribute('hidden');
        el.style.display = 'flex';
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.hidden = true;
        el.setAttribute('hidden', '');
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /**
   * Reset form and view state to initial pristine condition.
   */
  function resetAll() {
    textInput.value = '';
    updateCounters();
    clearValidation();
    if (errorTitleEl) errorTitleEl.textContent = '';
    if (errorMessageEl) errorMessageEl.textContent = '';
    setViewState('empty');
    setLoadingState(false);
    textInput.focus();
  }

  /**
   * Toggle button loading state and spinner.
   * @param {boolean} isLoading
   */
  function setLoadingState(isLoading) {
    analyzeBtn.disabled = isLoading;
    clearBtn.disabled = isLoading;
    textInput.disabled = isLoading;

    if (isLoading) {
      btnSpinner.hidden = false;
      btnSpinner.removeAttribute('hidden');
      btnSpinner.style.display = 'inline-block';
      btnIcon.hidden = true;
      btnIcon.setAttribute('hidden', '');
      btnIcon.style.display = 'none';
      btnText.textContent = 'Analyzing...';
      setViewState('loading');
    } else {
      btnSpinner.hidden = true;
      btnSpinner.setAttribute('hidden', '');
      btnSpinner.style.display = 'none';
      btnIcon.hidden = false;
      btnIcon.removeAttribute('hidden');
      btnIcon.style.display = '';
      btnText.textContent = 'Analyze Emotion';
    }
  }

  /**
   * Show friendly error state with custom title and message.
   * Explicitly hides loading and result states.
   * @param {string} title 
   * @param {string} message 
   */
  function showError(title, message) {
    if (errorTitleEl) errorTitleEl.textContent = title || 'Classification Error';
    if (errorMessageEl) errorMessageEl.textContent = message;
    setViewState('error');
  }

  /**
   * Render real prediction response returned by the backend model.
   * Note: No fake or simulated predictions are created here.
   * @param {Object} data - Prediction payload { emotion: string, confidence: number, probabilities?: Object }
   */
  function renderPredictionResult(data) {
    if (!data || !data.emotion) {
      showError('Unexpected Response', 'The model server returned an invalid prediction format.');
      return;
    }

    // Clear any stale connection or prediction errors
    if (errorTitleEl) errorTitleEl.textContent = '';
    if (errorMessageEl) errorMessageEl.textContent = '';

    // Hide loading and error states, and show ONLY the real prediction result
    setViewState('result');

    const rawEmotion = String(data.emotion).toLowerCase().trim();
    const meta = EMOTION_META[rawEmotion] || {
      emoji: '🎭',
      label: data.emotion,
      themeClass: 'theme-joy',
      description: 'Predicted emotional tone based on linguistic classification.'
    };

    // Remove old theme classes from resultCard
    resultCard.classList.remove(
      'theme-joy', 'theme-sadness', 'theme-anger', 
      'theme-fear', 'theme-love', 'theme-surprise'
    );
    resultCard.classList.add(meta.themeClass);

    // Sync 3D companion with the real predicted emotion
    if (COMPANION_EMOTIONS[rawEmotion]) {
      setCompanionEmotion(rawEmotion, false);
    }

    // Populate emotion info
    emotionAvatarEl.textContent = meta.emoji;
    emotionNameEl.textContent = meta.label;
    emotionDescriptionEl.textContent = meta.description;

    // Calculate confidence percentage
    let confidencePercent = 0;
    if (typeof data.confidence === 'number') {
      confidencePercent = data.confidence > 1 ? data.confidence : data.confidence * 100;
    }
    const formattedConfidence = confidencePercent.toFixed(1) + '%';
    
    confidencePillEl.textContent = `${formattedConfidence} Confidence`;
    meterValEl.textContent = formattedConfidence;
    meterFillEl.style.width = `${Math.min(100, Math.max(0, confidencePercent))}%`;

    // Timestamp
    const now = new Date();
    resultTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Multi-class probabilities breakdown (if provided)
    if (data.probabilities && typeof data.probabilities === 'object') {
      probGrid.innerHTML = '';
      Object.entries(data.probabilities).forEach(([cls, prob]) => {
        const clsMeta = EMOTION_META[cls.toLowerCase()] || { emoji: '•', label: cls };
        const probVal = (typeof prob === 'number') ? (prob > 1 ? prob : prob * 100).toFixed(1) : 0;
        
        const item = document.createElement('div');
        item.className = 'prob-item';
        item.innerHTML = `
          <div class="prob-item-header">
            <span>${clsMeta.emoji} ${clsMeta.label}</span>
            <span>${probVal}%</span>
          </div>
          <div class="prob-item-bar">
            <div class="prob-item-fill" style="width: ${probVal}%"></div>
          </div>
        `;
        probGrid.appendChild(item);
      });
      probabilitiesSection.hidden = false;
    } else {
      probabilitiesSection.hidden = true;
    }

    setViewState('result');
  }

  /**
   * Submit text to the Flask backend endpoint for classification.
   * Real endpoint will be hooked to the trained .joblib model.
   * Does NOT simulate fake predictions.
   */
  async function handleAnalyze(e) {
    if (e) e.preventDefault();

    const text = textInput.value.trim();

    // Input Validation
    if (!text) {
      showValidationError('Please enter some text before analyzing.');
      return;
    }

    if (text.length < 3) {
      showValidationError('Please enter at least 3 characters for accurate emotion analysis.');
      return;
    }

    clearValidation();
    if (errorTitleEl) errorTitleEl.textContent = '';
    if (errorMessageEl) errorMessageEl.textContent = '';
    setLoadingState(true);

    try {
      // Connect to the Flask prediction API route
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not found (404). The Flask backend routing /predict is not yet deployed.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status code ${response.status}.`);
      }

      const result = await response.json();
      renderPredictionResult(result);

    } catch (err) {
      // Graceful error state handling
      // Informs the user clearly without inventing fake predictions
      const isConnectionError = err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('Failed to fetch');
      
      if (isConnectionError) {
        showError(
          'Flask Backend Not Connected',
          'The prediction service is not reachable (POST /predict). When you run the Flask server with the model pipeline, real emotion predictions and confidence scores will appear here.'
        );
      } else {
        showError('Analysis Notice', err.message);
      }
    } finally {
      setLoadingState(false);
    }
  }

  // --- Event Listeners ---

  // Live counter & validation cleanup on input
  textInput.addEventListener('input', () => {
    updateCounters();
    clearValidation();
  });

  // Quick clear button (inside textarea)
  quickClearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateCounters();
    clearValidation();
    textInput.focus();
  });

  // Main Clear button
  clearBtn.addEventListener('click', resetAll);

  // Form Submission
  form.addEventListener('submit', handleAnalyze);

  // Keyboard shortcut: Ctrl + Enter or Cmd + Enter
  textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  });

  // --- 3D Cursor Tilt & Responsive Parallax Physics ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let targetRotX = 0;
  let targetRotY = 0;
  let targetTransX = 0;
  let targetTransY = 0;

  let currentRotX = 0;
  let currentRotY = 0;
  let currentTransX = 0;
  let currentTransY = 0;

  function handleMouseMove(e) {
    if (prefersReducedMotion.matches || !emojiOrb) return;

    const rect = emojiOrb.getBoundingClientRect();
    const orbCenterX = rect.left + rect.width / 2;
    const orbCenterY = rect.top + rect.height / 2;

    // Viewport-relative calculation for smooth, broad interactive zone
    const maxRangeX = Math.max(window.innerWidth / 2, 320);
    const maxRangeY = Math.max(window.innerHeight / 2, 320);

    const normX = Math.max(-1, Math.min(1, (e.clientX - orbCenterX) / maxRangeX));
    const normY = Math.max(-1, Math.min(1, (e.clientY - orbCenterY) / maxRangeY));

    // Gentle tilt angles (degrees) and translations (pixels)
    targetRotX = -normY * 16;
    targetRotY = normX * 20;
    targetTransX = normX * 12;
    targetTransY = normY * 8;
  }

  function handleMouseLeave() {
    targetRotX = 0;
    targetRotY = 0;
    targetTransX = 0;
    targetTransY = 0;
  }

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);

  function animateTiltLoop() {
    if (prefersReducedMotion.matches) {
      if (emojiOrb) emojiOrb.style.transform = '';
      if (orbSpecular) orbSpecular.style.transform = '';
      if (orbFace) orbFace.style.transform = '';
      if (orbGroundShadow) orbGroundShadow.style.transform = '';
      return;
    }

    // Smooth linear interpolation (lerp factor ~0.08)
    const lerp = 0.08;
    currentRotX += (targetRotX - currentRotX) * lerp;
    currentRotY += (targetRotY - currentRotY) * lerp;
    currentTransX += (targetTransX - currentTransX) * lerp;
    currentTransY += (targetTransY - currentTransY) * lerp;

    if (emojiOrb) {
      emojiOrb.style.transform = `perspective(850px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) translate3d(${currentTransX.toFixed(2)}px, ${currentTransY.toFixed(2)}px, 0)`;
    }

    if (orbSpecular) {
      // Counter-shift specular reflection for optical depth
      orbSpecular.style.transform = `translate3d(${(-currentTransX * 1.3).toFixed(2)}px, ${(-currentTransY * 1.3).toFixed(2)}px, 0) rotate(-24deg)`;
    }

    if (orbFace) {
      // Shift face forward in 3D space with slight parallax
      orbFace.style.transform = `translate3d(${(currentTransX * 0.7).toFixed(2)}px, ${(currentTransY * 0.7).toFixed(2)}px, 25px)`;
    }

    if (orbGroundShadow) {
      // Counter-shift shadow to maintain grounded contact
      orbGroundShadow.style.transform = `translate3d(${(-currentTransX * 0.85).toFixed(2)}px, 0, 0)`;
    }

    requestAnimationFrame(animateTiltLoop);
  }

  requestAnimationFrame(animateTiltLoop);

  // --- Emotion Controls & Sample Chips Listeners ---
  emotionBtns.forEach(btn => {
    const emotion = btn.getAttribute('data-emotion');

    // Hover previews the emotion
    btn.addEventListener('mouseenter', () => {
      setCompanionEmotion(emotion, true);
    });

    // Keyboard focus previews the emotion
    btn.addEventListener('focus', () => {
      setCompanionEmotion(emotion, true);
    });

    // Click or tap locks the emotion
    btn.addEventListener('click', () => {
      setCompanionEmotion(emotion, false);
    });
  });

  const emotionControlsToolbar = document.querySelector('.emotion-controls');
  if (emotionControlsToolbar) {
    emotionControlsToolbar.addEventListener('mouseleave', () => {
      setCompanionEmotion(activeCompanionEmotion, false);
    });
  }

  // Sample prompt chips: hover switches companion to chip's emotion
  sampleChips.forEach(chip => {
    const chipEmotion = chip.getAttribute('data-emotion');

    if (chipEmotion) {
      chip.addEventListener('mouseenter', () => {
        setCompanionEmotion(chipEmotion, true);
      });

      chip.addEventListener('mouseleave', () => {
        setCompanionEmotion(activeCompanionEmotion, false);
      });
    }

    chip.addEventListener('click', () => {
      const sampleText = chip.getAttribute('data-sample');
      if (sampleText) {
        textInput.value = sampleText;
        updateCounters();
        clearValidation();
        textInput.focus();
        // Smooth animation focus
        textareaWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (chipEmotion) {
        setCompanionEmotion(chipEmotion, false);
      }
    });
  });

  // Dismiss Error Button
  dismissErrorBtn.addEventListener('click', () => {
    if (errorTitleEl) errorTitleEl.textContent = '';
    if (errorMessageEl) errorMessageEl.textContent = '';
    setViewState('empty');
  });

  // Initial setup
  updateCounters();
  setCompanionEmotion('joy', false);
});
