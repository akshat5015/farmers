document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT REFERENCES ---
    const uploadScreen = document.getElementById('upload-screen');
    const chatScreen = document.getElementById('chat-screen');
    const uploadForm = document.getElementById('upload-form');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');
    const loader = document.getElementById('loader');
    const newChatBtn = document.getElementById('new-chat-btn');
    const micBtn = document.getElementById('mic-btn');
    const voiceUnlockOverlay = document.getElementById('voice-unlock-overlay');
    const startVoiceBtn = document.getElementById('start-voice-btn');

    // --- STATE VARIABLES ---
    let currentMode = 'text';
    let currentLanguage = 'en';
    let lastUserMessageTicks = null;
    let areVoicesLoaded = false;
    let initialAssistantMessage = '';

    // --- SPEECH RECOGNITION ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            micBtn.classList.add('is-listening');
            micBtn.innerHTML = '<i class="fas fa-stop-circle"></i>';
        };

        recognition.onend = () => {
            micBtn.classList.remove('is-listening');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
        };

        recognition.onresult = (event) => {
            messageInput.value = Array.from(event.results).map(r => r[0].transcript).join('');
            if (event.results[event.results.length - 1].isFinal) {
                messageForm.dispatchEvent(new Event('submit'));
            }
        };
    } else {
        micBtn.disabled = true;
        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        console.warn("Speech Recognition not supported in this browser.");
    }

    // --- SPEECH SYNTHESIS ---
    const synth = window.speechSynthesis;

    function loadVoices() {
        const voices = synth.getVoices();
        if (voices.length) {
            console.log("Voices successfully loaded.");
            areVoicesLoaded = true;
        }
    }

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    function speakText(text, lang) {
        if (!areVoicesLoaded) {
            console.error("Voices not loaded. Cannot speak.");
            return;
        }

        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const langCode = lang === 'hi' ? 'hi-IN' : 'en-US';
        const voices = synth.getVoices();
        let voice = voices.find(v => v.lang === langCode);

        if (voice) {
            utterance.voice = voice;
        } else {
            console.warn(`Voice for lang '${langCode}' not found. Using browser default.`);
        }

        utterance.lang = langCode;
        utterance.rate = 0.95;
        utterance.onerror = (event) => console.error("SpeechSynthesis Error:", event);
        synth.speak(utterance);
    }

    // --- EVENT LISTENERS ---
    uploadForm.addEventListener('submit', handleImageUpload);
    messageForm.addEventListener('submit', handleSendMessage);
    newChatBtn.addEventListener('click', () => location.reload());
    micBtn.addEventListener('click', toggleVoiceInput);
    startVoiceBtn.addEventListener('click', handleVoiceUnlock);

    // --- CORE FUNCTIONS ---
    async function handleImageUpload(e) {
        e.preventDefault();
        const imageFile = document.getElementById('image-upload').files[0];
        if (!imageFile) {
            alert('Please select an image file.');
            return;
        }

        currentLanguage = document.getElementById('language-select').value;
        currentMode = document.getElementById('mode-select').value;
        if (recognition) recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';

        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
            uploadForm.classList.add('hidden');
            loader.classList.remove('hidden');
            try {
                const response = await fetch('/process-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result, language: currentLanguage })
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();

                uploadScreen.classList.add('hidden');
                chatScreen.classList.remove('hidden');

                if (currentMode === 'voice') {
                    initialAssistantMessage = data.response;
                    voiceUnlockOverlay.classList.remove('hidden');
                } else {
                    addMessageToChat('assistant', data.response);
                }
            } catch (error) {
                console.error('Error processing image:', error);
                alert('An error occurred during analysis. Please check the console and try again.');
                uploadForm.classList.remove('hidden');
                loader.classList.add('hidden');
            }
        };
    }

    function handleVoiceUnlock() {
        const initUtterance = new SpeechSynthesisUtterance(" ");
        initUtterance.volume = 0;
        synth.speak(initUtterance);

        voiceUnlockOverlay.classList.add('hidden');
        addMessageToChat('assistant', initialAssistantMessage);
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        const question = messageInput.value.trim();
        if (!question) return;

        addMessageToChat('user', question);
        messageInput.value = '';
        showTypingIndicator();

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            hideTypingIndicator();
            addMessageToChat('assistant', data.response);
            if (lastUserMessageTicks) lastUserMessageTicks.classList.add('read');
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            addMessageToChat('assistant', 'Sorry, an error occurred. Please try again.');
        }
    }

    function toggleVoiceInput() {
        if (!recognition) return;
        try {
            if (micBtn.classList.contains('is-listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        } catch (e) {
            console.error("Recognition start failed:", e);
        }
    }

    function addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'timestamp';
        timestampSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        metaDiv.appendChild(timestampSpan);

        if (sender === 'user') {
            const ticksSpan = document.createElement('span');
            ticksSpan.className = 'ticks';
            ticksSpan.innerHTML = '&#10003;&#10003;';
            metaDiv.appendChild(ticksSpan);
            lastUserMessageTicks = ticksSpan;
        }

        bubbleDiv.appendChild(contentDiv);
        bubbleDiv.appendChild(metaDiv);
        messageDiv.appendChild(bubbleDiv);
        chatWindow.appendChild(messageDiv);

        setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 0);

        if (sender === 'assistant' && currentMode === 'voice') {
            speakText(text, currentLanguage);
        }
    }

    function showTypingIndicator() {
        if (chatWindow.querySelector('.typing-indicator')) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant typing-indicator';
        messageDiv.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = chatWindow.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
});
