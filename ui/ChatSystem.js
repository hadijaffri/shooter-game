export class ChatSystem {
  constructor(container, networkManager) {
    this.container = container;
    this.network = networkManager;
    this.messages = [];
    this.maxMessages = 50;
    this.visible = false;
    this.element = null;
    this.inputElement = null;
    this.messagesElement = null;

    this.createUI();
  }

  createUI() {
    this.element = document.createElement('div');
    this.element.className = 'chat-container';
    this.element.innerHTML = `
      <div class="chat-messages" id="chatMessages"></div>
      <input type="text" class="chat-input" id="chatInput" placeholder="Press Enter to chat..." maxlength="200" style="display:none" />
    `;
    this.container.appendChild(this.element);

    this.messagesElement = this.element.querySelector('#chatMessages');
    this.inputElement = this.element.querySelector('#chatInput');

    this.inputElement.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.sendMessage();
      }
      if (e.key === 'Escape') {
        this.hideInput();
      }
    });
  }

  toggle() {
    if (this.visible) {
      this.hideInput();
    } else {
      this.showInput();
    }
  }

  showInput() {
    this.visible = true;
    this.inputElement.style.display = 'block';
    this.inputElement.focus();
  }

  hideInput() {
    this.visible = false;
    this.inputElement.style.display = 'none';
    this.inputElement.value = '';
    this.inputElement.blur();
  }

  sendMessage() {
    const text = this.inputElement.value.trim();
    if (!text) {
      this.hideInput();
      return;
    }

    this.addMessage('You', text, '#4ECDC4');
    if (this.network && this.network.isOnline) {
      this.network.broadcast('chat', { text, name: this.network.playerName });
    }
    this.hideInput();
  }

  addMessage(name, text, color = '#FFF') {
    this.messages.push({ name, text, color, time: Date.now() });
    if (this.messages.length > this.maxMessages) this.messages.shift();
    this.renderMessages();
  }

  renderMessages() {
    const now = Date.now();
    const recent = this.messages.filter(m => now - m.time < 10000);

    this.messagesElement.innerHTML = recent.map(m =>
      `<div class="chat-msg" style="color:${m.color}">
        <span class="chat-name">${m.name}:</span> ${this.escapeHtml(m.text)}
      </div>`
    ).join('');

    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  isActive() {
    return this.visible;
  }

  destroy() {
    if (this.element) this.element.remove();
  }
}
