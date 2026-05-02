const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loading = document.getElementById('loading');

// Basic Local Dataset
const localDataset = [
    {
        keywords: ["fir", "first information report"],
        answer: "An FIR (First Information Report) is a written document prepared by the police when they receive information about the commission of a cognizable offence. It is generally a complaint lodged with the police by the victim of a cognizable offence or by someone on their behalf."
    },
    {
        keywords: ["bail"],
        answer: "Bail is the conditional release of a defendant with the promise to appear in court when required. In Pakistan, bail can be pre-arrest, post-arrest, or protective bail."
    },
    {
        keywords: ["pakistan penal code", "ppc"],
        answer: "The Pakistan Penal Code (PPC) is the principal substantive criminal law of Pakistan. It was drafted originally by Lord Macaulay in 1860 as the Indian Penal Code, and adopted by Pakistan upon independence in 1947."
    },
    {
        keywords: ["divorce", "khula", "talaq"],
        answer: "Under Pakistani family law (Muslim Family Laws Ordinance 1961), a man can pronounce Talaq (divorce) subject to specific procedures including notice to the Union Council. A woman can seek Khula (dissolution of marriage) through the family courts."
    }
];

// Conversation Memory for the URL-based free API
let chatHistory = [];

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight < 100 ? this.scrollHeight : 100) + 'px';
});

// Handle Enter key
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

function searchDataset(query) {
    const q = query.toLowerCase();
    for (let item of localDataset) {
        for (let keyword of item.keywords) {
            if (q.includes(keyword)) {
                return item.answer;
            }
        }
    }
    return null;
}

// Replaced Gemini with a 100% Free AI (Pollinations.ai text generation API)
async function callFreeAPI(userText) {
    chatHistory.push(`User: ${userText}`);
    
    // Keep only last 2 turns (4 messages max) to avoid URL length limit issues
    if (chatHistory.length > 4) {
        chatHistory = chatHistory.slice(chatHistory.length - 4);
    }

    const systemPrompt = "System Instruction: You are a helpful assistant specialized in Pakistan law. Give clear, simple, and accurate answers. Avoid complex legal jargon unless necessary.";
    
    // Construct the prompt with context
    const fullPrompt = systemPrompt + "\n\n" + chatHistory.join("\n") + "\nAssistant:";
    
    // Encode for the URL request
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const url = `https://text.pollinations.ai/${encodedPrompt}?model=openai`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const modelAnswer = await response.text();

    // Add to history
    chatHistory.push(`Assistant: ${modelAnswer}`);

    return modelAnswer;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto';

    addMessage(text, 'user');
    loading.style.display = 'flex';

    // 1. Check local dataset first
    const datasetAnswer = searchDataset(text);
    if (datasetAnswer) {
        setTimeout(() => { // small delay to simulate processing
            loading.style.display = 'none';
            addMessage(datasetAnswer, 'bot', 'Dataset');
        }, 500);
        return;
    }

    // 2. Fallback to Free AI API
    try {
        const aiAnswer = await callFreeAPI(text);
        loading.style.display = 'none';
        addMessage(aiAnswer, 'bot', 'Free AI');
    } catch (error) {
        loading.style.display = 'none';
        addMessage('Sorry, there was an error connecting to the Free AI. ' + error.message, 'bot', 'Error');
        console.error('API Error:', error);
    }
}

function addMessage(text, sender, source = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Formatting newlines and simple markdown bold
    let formattedText = text.replace(/\n/g, '<br>');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);

    if (source) {
        const badge = document.createElement('div');
        badge.classList.add('source-badge');
        if (source === 'Dataset') {
            badge.classList.add('source-dataset');
            badge.innerText = '⚡ Local Dataset';
        } else if (source === 'Free AI') {
            badge.classList.add('source-ai');
            badge.innerText = '🤖 Free AI';
        } else {
            badge.innerText = source;
            badge.style.color = '#e74c3c';
        }
        messageDiv.appendChild(badge);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
