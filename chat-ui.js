/**
 * Chat Interface Controller
 * Manages the iPhone mockup chat interface for intro questions and MBTI Q&A
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * ChatUI class manages the iPhone-style chat interface
   */
  class ChatUI {
    /**
     * Creates a new ChatUI instance
     * @param {string} containerId - ID of the container element
     * @param {Function} onWorkflowChange - Callback when workflow changes (BEGIN_QA or BEGIN_SELF)
     * @param {Function} onMBTIUpdate - Callback when MBTI scores are updated
     */
    constructor(containerId, onWorkflowChange, onMBTIUpdate) {
      this.container = document.getElementById(containerId);
      this.onWorkflowChange = onWorkflowChange;
      this.onMBTIUpdate = onMBTIUpdate;

      // Chat state
      this.currentNode = 'start';
      this.conversationHistory = [];
      this.isTyping = false;
      this.mbtiScores = [0, 0, 0, 0]; // [e_i, s_n, t_f, j_p]
      this.currentQuestionIndex = 0;

      // Data
      this.introData = null;
      this.mbtiQuestions = null;
      this.mode = 'intro'; // 'intro' or 'mbti'

      // Phone interface state
      this.phoneShowingSliders = false;
      this.currentWorkflowMode = 'chat'; // 'chat', 'qa', 'self'

      // UI elements
      this.iphoneElement = null;
      this.chatArea = null;
      this.choicesContainer = null;
      this.flipToggle = null;
      this.phoneSlidersContainer = null;

      this.init();
    }

    /**
     * Initialize the chat interface
     */
    async init() {
      console.log('ChatUI init started');
      await this.loadData();
      console.log('Data loaded, creating interface');
      this.createInterface();
      console.log('Interface created, starting conversation');
      this.startConversation();
    }

    /**
     * Load intro and MBTI question data
     */
    async loadData() {
      try {
        // Load intro YAML data
        const introResponse = await fetch(CONFIG.CHAT.FILES.INTRO_YAML);
        const introText = await introResponse.text();
        this.introData = this.parseYAML(introText);

        // Load MBTI questions
        const mbtiResponse = await fetch(CONFIG.CHAT.FILES.MBTI_QUESTIONS);
        this.mbtiQuestions = await mbtiResponse.json();

        console.log('Chat data loaded:', {
          intro: this.introData,
          mbti: this.mbtiQuestions.length,
          introRoot: this.introData?.root,
          introNodes: Object.keys(this.introData?.nodes || {})
        });
      } catch (error) {
        console.error('Failed to load chat data:', error);
      }
    }

    /**
     * Simple YAML parser for intro data
     */
    parseYAML(yamlText) {
      const lines = yamlText.split('\n');
      const data = { nodes: {} };
      let currentNode = null;
      let currentChoices = [];
      let indentLevel = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        // Count indentation
        const indent = line.length - line.trimStart().length;

        if (trimmed.startsWith('root:')) {
          data.root = trimmed.split(':')[1].trim();
        } else if (trimmed.startsWith('nodes:')) {
          continue;
        } else if (indent === 2 && trimmed.endsWith(':')) {
          // New node (2 spaces indented)
          if (currentNode) {
            if (currentChoices.length > 0) {
              data.nodes[currentNode.name].choices = currentChoices;
            }
          }
          currentNode = { name: trimmed.replace(':', '') };
          currentChoices = [];
          data.nodes[currentNode.name] = {};
        } else if (indent === 4 && trimmed.startsWith('text:')) {
          // Text property (4 spaces indented)
          const text = trimmed.substring(5).trim().replace(/^"(.*)"$/, '$1');
          data.nodes[currentNode.name].text = text;
        } else if (indent === 4 && trimmed.startsWith('next:')) {
          // Next property (4 spaces indented)
          const next = trimmed.substring(5).trim();
          data.nodes[currentNode.name].next = next;
        } else if (indent === 4 && trimmed.startsWith('choices:')) {
          // Choices property (4 spaces indented)
          continue;
        } else if (indent === 6 && trimmed.startsWith('- {')) {
          // Choice item (6 spaces indented)
          const choiceMatch = trimmed.match(/label:\s*"([^"]+)",\s*next:\s*(\w+)/);
          if (choiceMatch) {
            currentChoices.push({
              label: choiceMatch[1],
              next: choiceMatch[2]
            });
          }
        }
      }

      // Add last node's choices
      if (currentNode) {
        if (currentChoices.length > 0) {
          data.nodes[currentNode.name].choices = currentChoices;
        }
      }

      console.log('Parsed YAML data:', data);
      return data;
    }

    /**
     * Create the iPhone interface elements
     */
    createInterface() {
      this.container.innerHTML = '';

      // Create iPhone container
      this.iphoneElement = document.createElement('div');
      this.iphoneElement.style.cssText = `
        position: fixed;
        right: ${CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN}px;
        top: calc(50% + ${CONFIG.CHAT.IPHONE.POSITION.VERTICAL_CENTER_OFFSET}px);
        transform: translateY(-50%);
        width: ${CONFIG.CHAT.IPHONE.WIDTH}px;
        height: ${CONFIG.CHAT.IPHONE.HEIGHT}px;
        background-image: url('${CONFIG.CHAT.FILES.IPHONE_IMAGE}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;

        z-index: 10;
      `;

      console.log('iPhone element created with style:', this.iphoneElement.style.cssText);



      // Calculate screen area dimensions
      const screenWidth = CONFIG.CHAT.IPHONE.WIDTH - CONFIG.CHAT.IPHONE.SCREEN_INSET.LEFT - CONFIG.CHAT.IPHONE.SCREEN_INSET.RIGHT;
      const screenHeight = CONFIG.CHAT.IPHONE.HEIGHT - CONFIG.CHAT.IPHONE.SCREEN_INSET.TOP - CONFIG.CHAT.IPHONE.SCREEN_INSET.BOTTOM;

      // Create chat area within screen
      this.chatArea = document.createElement('div');
      this.chatArea.style.cssText = `
        position: absolute;
        left: ${CONFIG.CHAT.IPHONE.SCREEN_INSET.LEFT}px;
        top: ${CONFIG.CHAT.IPHONE.SCREEN_INSET.TOP}px;
        width: ${screenWidth}px;
        height: ${screenHeight}px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: ${CONFIG.CHAT.CHAT_AREA.PADDING.TOP}px ${CONFIG.CHAT.CHAT_AREA.PADDING.RIGHT}px ${CONFIG.CHAT.CHAT_AREA.PADDING.BOTTOM}px ${CONFIG.CHAT.CHAT_AREA.PADDING.LEFT}px;
        box-sizing: border-box;
        scrollbar-width: none;
        -ms-overflow-style: none;
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        mask: linear-gradient(to bottom, 
          transparent 0px,
          black 20px,
          black calc(100% - 20px),
          transparent 100%
        );
        -webkit-mask: linear-gradient(to bottom, 
          transparent 0px,
          black 20px,
          black calc(100% - 20px),
          transparent 100%
        );
      `;
      this.chatArea.style.setProperty('-webkit-scrollbar', 'none');

      console.log('Chat area created with dimensions:', screenWidth, 'x', screenHeight);



      this.iphoneElement.appendChild(this.chatArea);
      this.container.appendChild(this.iphoneElement);

      // Create flip phone toggle text
      this.createFlipToggle();
    }

    /**
     * Create the flip phone toggle text
     */
    createFlipToggle() {
      this.flipToggle = document.createElement('div');
      this.flipToggle.textContent = 'flip the phone →';
      this.flipToggle.style.cssText = `
        position: fixed;
        right: ${CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN + CONFIG.CHAT.IPHONE.WIDTH / 2}px;
        top: calc(50% + ${CONFIG.CHAT.IPHONE.POSITION.VERTICAL_CENTER_OFFSET + CONFIG.CHAT.IPHONE.HEIGHT / 2 + 10}px);
        transform: translate(50%, -50%);
        font-size: 12px;
        color: #666;
        cursor: pointer;
        z-index: 10;
        user-select: none;
        transition: color 0.2s ease;
        display: none;
        text-align: center;
      `;

      // Add hover effect
      this.flipToggle.addEventListener('mouseenter', () => {
        this.flipToggle.style.color = '#000';
      });

      this.flipToggle.addEventListener('mouseleave', () => {
        this.flipToggle.style.color = '#666';
      });

      // Add click handler
      this.flipToggle.addEventListener('click', () => {
        this.togglePhoneInterface();
      });

      this.container.appendChild(this.flipToggle);
    }

    /**
     * Show or hide the flip toggle based on current mode
     */
    updateFlipToggleVisibility() {
      if (this.flipToggle) {
        if (this.currentWorkflowMode === 'qa' || this.currentWorkflowMode === 'self') {
          this.flipToggle.style.display = 'block';
        } else {
          this.flipToggle.style.display = 'none';
        }
      }
    }

    /**
     * Toggle between chat interface and slider interface on the phone
     */
    togglePhoneInterface() {
      this.phoneShowingSliders = !this.phoneShowingSliders;

      if (this.phoneShowingSliders) {
        // Hide chat, show sliders
        this.iphoneElement.style.visibility = 'hidden';
        this.showPhoneSliders();
        this.flipToggle.textContent = 'flip the phone ←';
      } else {
        // Hide sliders, show chat
        this.hidePhoneSliders();
        this.iphoneElement.style.visibility = 'visible';
        this.flipToggle.textContent = 'flip the phone →';
      }
    }

    /**
     * Start the conversation with the intro flow
     */
    startConversation() {
      if (!this.introData) {
        console.error('No intro data available for chat - showing fallback message');
        // Fallback: show a basic test message
        this.addMessage('Pablo', 'Hello! I\'m having trouble loading the conversation data.', 'pablo');
        return;
      }
      console.log('Starting conversation with root node:', this.introData.root);
      console.log('Intro data:', this.introData);
      this.currentNode = this.introData.root;
      this.showNextMessage();
    }

    /**
     * Show the next message in the conversation
     */
    async showNextMessage() {
      console.log('showNextMessage - mode:', this.mode);

      if (this.mode === 'intro') {
        await this.showIntroMessage();
      } else if (this.mode === 'mbti') {
        await this.showMBTIQuestion();
      }
    }

    /**
     * Show intro conversation message
     */
    async showIntroMessage() {
      const node = this.introData.nodes[this.currentNode];
      console.log('showIntroMessage - currentNode:', this.currentNode, 'node:', node);

      if (!node) {
        console.error('No node found for:', this.currentNode);
        return;
      }

      // Show typing indicator
      await this.showTypingIndicator(node.text);

      // Show Pablo's message
      this.addMessage('Pablo', node.text, 'pablo');

      // Handle next action
      if (node.next === 'BEGIN_QA') {
        // Switch to MBTI Q&A mode
        this.mode = 'mbti';
        this.currentQuestionIndex = 0;
        setTimeout(() => {
          this.showNextMessage();
        }, 1000);

        // Update workflow mode and show flip toggle
        this.currentWorkflowMode = 'qa';
        this.updateFlipToggleVisibility();

        // Notify parent about workflow change
        if (this.onWorkflowChange) {
          this.onWorkflowChange('qa');
        }
      } else if (node.next === 'BEGIN_SELF') {
        // Switch to self-adjustment mode
        // Update workflow mode and show flip toggle
        this.currentWorkflowMode = 'self';
        this.updateFlipToggleVisibility();

        // Notify parent about workflow change
        if (this.onWorkflowChange) {
          this.onWorkflowChange('self');
        }
      } else if (node.choices && node.choices.length > 0) {
        // Show choices
        this.showChoices(node.choices);
      } else if (node.next) {
        // Auto-advance to next node
        this.currentNode = node.next;
        setTimeout(() => {
          this.showNextMessage();
        }, 1500);
      }
    }

    /**
     * Show MBTI question
     */
    async showMBTIQuestion() {
      if (this.currentQuestionIndex >= this.mbtiQuestions.length) {
        // Finished all questions
        await this.showTypingIndicator('Done!');
        this.addMessage('Pablo', 'Done!', 'pablo');
        return;
      }

      const question = this.mbtiQuestions[this.currentQuestionIndex];

      // Show typing indicator
      await this.showTypingIndicator(question.question);

      // Show question
      this.addMessage('Pablo', question.question, 'pablo');

      // Show answer choices
      const choices = question.answers.map((answer, index) => ({
        label: answer,
        action: () => this.selectMBTIAnswer(index)
      }));

      this.showChoices(choices);
    }

    /**
     * Handle MBTI answer selection
     */
    selectMBTIAnswer(answerIndex) {
      const question = this.mbtiQuestions[this.currentQuestionIndex];
      const answer = question.answers[answerIndex];
      const scores = question.scores[answerIndex];

      // Add user's answer to chat
      this.addMessage('You', answer, 'user');

      // Update MBTI scores
      if (scores.e_i !== undefined) this.mbtiScores[0] += scores.e_i;
      if (scores.s_n !== undefined) this.mbtiScores[1] += scores.s_n;
      if (scores.t_f !== undefined) this.mbtiScores[2] += scores.t_f;
      if (scores.j_p !== undefined) this.mbtiScores[3] += scores.j_p;

      // Notify parent about MBTI update
      if (this.onMBTIUpdate) {
        this.onMBTIUpdate([...this.mbtiScores]);
      }

      // Move to next question
      this.currentQuestionIndex++;

      // Continue after a brief pause
      setTimeout(() => {
        this.showNextMessage();
      }, 1000);
    }

    /**
     * Show typing indicator for a specified duration
     */
    async showTypingIndicator(text) {
      // Calculate typing duration based on text length
      const baseDuration = text.length * CONFIG.CHAT.ANIMATION.TYPING_PAUSE_PER_CHAR * 1000;
      const duration = Math.max(
        Math.min(baseDuration, CONFIG.CHAT.ANIMATION.MAX_TYPING_TIME * 1000),
        CONFIG.CHAT.ANIMATION.MIN_TYPING_TIME * 1000
      );

      // Create typing bubble
      const typingBubble = this.createTypingBubble();
      this.chatArea.appendChild(typingBubble);
      this.scrollToBottom();

      // Wait for typing duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Remove typing bubble
      if (typingBubble.parentNode) {
        typingBubble.parentNode.removeChild(typingBubble);
      }
    }

    /**
     * Create animated typing indicator bubble
     */
    createTypingBubble() {
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        margin: ${CONFIG.CHAT.BUBBLES.TYPING.MARGIN.TOP}px ${CONFIG.CHAT.BUBBLES.TYPING.MARGIN.RIGHT}px ${CONFIG.CHAT.BUBBLES.TYPING.MARGIN.BOTTOM}px ${CONFIG.CHAT.BUBBLES.TYPING.MARGIN.LEFT}px;
        align-self: flex-start;
        display: flex;
        gap: ${CONFIG.CHAT.BUBBLES.TYPING.DOT_SPACING}px;
        align-items: center;
        animation: fadeIn ${CONFIG.CHAT.ANIMATION.BUBBLE_APPEAR_DURATION}s ease-out;
        padding: ${CONFIG.CHAT.BUBBLES.PABLO.PADDING.Y}px ${CONFIG.CHAT.BUBBLES.PABLO.PADDING.X}px;
      `;

      // Create three animated dots
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          width: ${CONFIG.CHAT.BUBBLES.TYPING.DOT_SIZE}px;
          height: ${CONFIG.CHAT.BUBBLES.TYPING.DOT_SIZE}px;
          background: #666666;
          border-radius: 50%;
          animation: typing-dot ${CONFIG.CHAT.BUBBLES.TYPING.ANIMATION_DURATION}ms infinite ease-in-out;
          animation-delay: ${i * 200}ms;
        `;
        bubble.appendChild(dot);
      }

      return bubble;
    }

    /**
     * Add a message to the chat
     */
    addMessage(speaker, text, type) {
      console.log('Adding message:', speaker, text, type);

      if (!this.chatArea) {
        console.error('No chat area available for message');
        return;
      }

      const messageContainer = document.createElement('div');
      messageContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        margin: ${CONFIG.CHAT.BUBBLES.PABLO.MARGIN.Y}px 0;
        align-items: ${type === 'pablo' ? 'flex-start' : 'flex-end'};
        animation: fadeIn ${CONFIG.CHAT.ANIMATION.BUBBLE_APPEAR_DURATION}s ease-out;
      `;

      // Create bubble
      const bubble = document.createElement('div');
      const bubbleConfig = type === 'pablo' ? CONFIG.CHAT.BUBBLES.PABLO : CONFIG.CHAT.BUBBLES.USER;

      bubble.style.cssText = `
        background: ${bubbleConfig.BACKGROUND};
        color: ${bubbleConfig.TEXT_COLOR};
        border-radius: ${bubbleConfig.BORDER_RADIUS}px;
        padding: ${bubbleConfig.PADDING.Y}px ${bubbleConfig.PADDING.X}px;
        max-width: ${bubbleConfig.MAX_WIDTH}px;
        font-family: ${CONFIG.CHAT.TEXT.FONT_FAMILY};
        font-size: ${CONFIG.CHAT.TEXT.FONT_SIZE}px;
        line-height: ${CONFIG.CHAT.TEXT.LINE_HEIGHT};
        word-wrap: break-word;
        margin: 0 ${bubbleConfig.MARGIN.X}px;
      `;

      bubble.textContent = text;
      messageContainer.appendChild(bubble);

      this.chatArea.appendChild(messageContainer);
      this.scrollToBottom();

      // Add to conversation history
      this.conversationHistory.push({ speaker, text, type });

      console.log('Message added to chat area');
    }

    /**
     * Show choice buttons
     */
    showChoices(choices) {
      // Create a container for all choice buttons that will be added to chat area
      const choicesContainer = document.createElement('div');
      choicesContainer.className = 'choices-container';
      choicesContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: ${CONFIG.CHAT.BUBBLES.USER.MARGIN.Y}px;
        align-items: flex-end;
        margin: ${CONFIG.CHAT.BUBBLES.USER.MARGIN.Y}px 0;
      `;

      // Add empty container to chat area first
      this.chatArea.appendChild(choicesContainer);

      // Add each choice button one by one with delays
      choices.forEach((choice, index) => {
        setTimeout(() => {
          const button = document.createElement('button');
          button.className = 'choice-button';
          button.style.cssText = `
            background: ${CONFIG.CHAT.BUBBLES.USER.BACKGROUND};
            color: ${CONFIG.CHAT.BUBBLES.USER.TEXT_COLOR};
            border: none;
            border-radius: ${CONFIG.CHAT.BUBBLES.USER.BORDER_RADIUS}px;
            padding: ${CONFIG.CHAT.BUBBLES.USER.PADDING.Y}px ${CONFIG.CHAT.BUBBLES.USER.PADDING.X}px;
            font-family: ${CONFIG.CHAT.TEXT.FONT_FAMILY};
            font-size: ${CONFIG.CHAT.TEXT.FONT_SIZE}px;
            line-height: ${CONFIG.CHAT.TEXT.LINE_HEIGHT};
            cursor: pointer;
            transition: background-color ${CONFIG.CHAT.ANIMATION.CHOICE_HOVER_DURATION}s ease;
            max-width: ${CONFIG.CHAT.BUBBLES.USER.MAX_WIDTH}px;
            word-wrap: break-word;
            text-align: left;
            margin: 0 ${CONFIG.CHAT.BUBBLES.USER.MARGIN.X}px;
            animation: fadeIn ${CONFIG.CHAT.ANIMATION.BUBBLE_APPEAR_DURATION}s ease-out;
            opacity: 0;
            animation-fill-mode: forwards;
          `;

          button.textContent = choice.label;

          // Hover effect
          button.addEventListener('mouseenter', () => {
            button.style.background = CONFIG.CHAT.BUBBLES.USER.HOVER_BACKGROUND;
          });

          button.addEventListener('mouseleave', () => {
            button.style.background = CONFIG.CHAT.BUBBLES.USER.BACKGROUND;
          });

          // Click handler
          button.addEventListener('click', () => {
            // Remove all choice buttons and replace with selected choice as regular message
            this.hideChoices();

            if (choice.action) {
              choice.action();
            } else {
              this.addMessage('You', choice.label, 'user');
              this.currentNode = choice.next;
              setTimeout(() => {
                this.showNextMessage();
              }, 500);
            }
          });

          // Add button to container (this causes the gradual push-up effect)
          choicesContainer.appendChild(button);
          this.scrollToBottom();
        }, CONFIG.CHAT.ANIMATION.CHOICE_INITIAL_DELAY * 1000 + (index * CONFIG.CHAT.ANIMATION.CHOICE_STAGGER_DELAY * 1000));
      });
    }

    /**
     * Hide choice buttons
     */
    hideChoices() {
      // Remove all choice containers from chat area
      const choiceContainers = this.chatArea.querySelectorAll('.choices-container');
      choiceContainers.forEach(container => container.remove());
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
      setTimeout(() => {
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
      }, 50);
    }

    /**
     * Get current MBTI scores
     */
    getMBTIScores() {
      return [...this.mbtiScores];
    }

    /**
     * Show phone sliders interface
     */
    showPhoneSliders() {
      // Remove existing phone sliders
      this.hidePhoneSliders();

      // Create phone sliders container with iPhone mockup background
      this.phoneSlidersContainer = document.createElement('div');
      this.phoneSlidersContainer.id = 'phoneSlidersContainer';
      this.phoneSlidersContainer.style.cssText = `
        position: fixed;
        right: ${CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN}px;
        top: calc(50% + ${CONFIG.CHAT.IPHONE.POSITION.VERTICAL_CENTER_OFFSET}px);
        transform: translateY(-50%);
        width: ${CONFIG.CHAT.IPHONE.WIDTH}px;
        height: ${CONFIG.CHAT.IPHONE.HEIGHT}px;
        background-image: url('${CONFIG.CHAT.FILES.IPHONE_IMAGE}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        z-index: 10;
      `;

      // Calculate screen area dimensions to fit within phone screen
      const screenWidth = CONFIG.CHAT.IPHONE.WIDTH - CONFIG.CHAT.IPHONE.SCREEN_INSET.LEFT - CONFIG.CHAT.IPHONE.SCREEN_INSET.RIGHT;
      const screenHeight = CONFIG.CHAT.IPHONE.HEIGHT - CONFIG.CHAT.IPHONE.SCREEN_INSET.TOP - CONFIG.CHAT.IPHONE.SCREEN_INSET.BOTTOM;

      // Create inner slider area that fits within the phone screen
      const slidersArea = document.createElement('div');
      slidersArea.style.cssText = `
        position: absolute;
        left: ${CONFIG.CHAT.IPHONE.SCREEN_INSET.LEFT}px;
        top: ${CONFIG.CHAT.IPHONE.SCREEN_INSET.TOP}px;
        width: ${screenWidth}px;
        height: ${screenHeight}px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: ${CONFIG.CHAT.CHAT_AREA.PADDING.TOP}px 15px 15px 15px;
        box-sizing: border-box;
        overflow-y: auto;
        overflow-x: hidden;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      `;

      // Get current values for display
      const getCurrentMBTIValues = () => {
        if (window.FaceApp && window.FaceApp.currentMBTIValues) {
          return [...window.FaceApp.currentMBTIValues];
        }
        return [0, 0, 0, 0];
      };
      const currentValues = getCurrentMBTIValues();

      // Create a container for centering the sliders
      const slidersContainer = document.createElement('div');
      slidersContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        gap: 20px;
      `;

      // Create sliders for each MBTI dimension (simplified)
      CONFIG.MBTI.DIMENSIONS.forEach((dimension, index) => {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';

        // Simple label
        const label = document.createElement('div');
        label.textContent = `${dimension.left} / ${dimension.right}`;
        label.style.cssText = 'font-size: 11px; color: #666; margin-bottom: 8px; text-align: center;';
        sliderContainer.appendChild(label);

        // Minimal slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-1';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = currentValues[index] || 0;

        const isReadOnly = this.currentWorkflowMode === 'qa';

        // Minimal slider styling - just a line with a dot
        slider.style.cssText = `
          width: 80%;
          height: 2px;
          background: #ddd;
          outline: none;
          border-radius: 1px;
          appearance: none;
          -webkit-appearance: none;
          ${isReadOnly ? 'pointer-events: none; opacity: 0.6;' : ''}
        `;

        // Style the slider thumb (the dot)
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          #phone-slider-${index}::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #000;
            cursor: ${isReadOnly ? 'default' : 'pointer'};
          }
          #phone-slider-${index}::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #000;
            cursor: ${isReadOnly ? 'default' : 'pointer'};
            border: none;
          }
        `;
        document.head.appendChild(styleSheet);

        slider.id = `phone-slider-${index}`;
        sliderContainer.appendChild(slider);

        // Add event listener (only if not read-only)
        if (!isReadOnly) {
          slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            // Notify parent app of the change
            if (window.FaceApp && window.handleMBTIChange) {
              const newValues = getCurrentMBTIValues();
              newValues[index] = value;
              window.handleMBTIChange(newValues);
            }
          });
        }

        slidersContainer.appendChild(sliderContainer);
      });

      slidersArea.appendChild(slidersContainer);

      // Add save hint at bottom of phone sliders
      const saveHint = document.createElement('div');
      saveHint.textContent = 'press s to save png';
      saveHint.style.cssText = `
        position: absolute;
        bottom: 15px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: #666;
        pointer-events: none;
      `;
      slidersArea.appendChild(saveHint);

      this.phoneSlidersContainer.appendChild(slidersArea);
      this.container.appendChild(this.phoneSlidersContainer);
    }

    /**
     * Hide phone sliders interface
     */
    hidePhoneSliders() {
      if (this.phoneSlidersContainer) {
        this.phoneSlidersContainer.remove();
        this.phoneSlidersContainer = null;
      }
    }





    /**
     * Reset the chat interface
     */
    reset() {
      this.currentNode = this.introData?.root || 'start';
      this.conversationHistory = [];
      this.mbtiScores = [0, 0, 0, 0];
      this.currentQuestionIndex = 0;
      this.mode = 'intro';
      this.phoneShowingSliders = false;
      this.currentWorkflowMode = 'chat';

      if (this.chatArea) {
        this.chatArea.innerHTML = '';
      }

      this.hideChoices();
      this.hidePhoneSliders();
      this.updateFlipToggleVisibility();
      this.startConversation();
    }
  }

  // Add CSS animations
  if (!document.getElementById('chat-animations')) {
    const style = document.createElement('style');
    style.id = 'chat-animations';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes typing-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-10px); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  FaceApp.ChatUI = ChatUI;
})(window);
