const input = document.getElementById('messageInput');
const wordCount = document.getElementById('wordCount');
const sendBtn = document.getElementById('sendBtn');
const messageList = document.getElementById('messageList');

input.addEventListener('input', () => {
    const words = input.value.trim().split(/\s+/).filter(Boolean);
    wordCount.textContent = words.length;
    sendBtn.disabled = words.length === 0 || words.length > 5;
});

sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    const li = document.createElement('li');
    li.textContent = text;
    messageList.appendChild(li);
    input.value = '';
    wordCount.textContent = '0';
    sendBtn.disabled = true;
});
