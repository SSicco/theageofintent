(function () {
  var chatArea = document.getElementById('chat-area');
  var messageInput = document.getElementById('message-input');
  var sendBtn = document.getElementById('send-btn');
  var inputBar = document.getElementById('input-bar');
  var exchangeCountdown = document.getElementById('exchange-countdown');
  var timeoutCountdown = document.getElementById('timeout-countdown');

  if (!chatArea || !messageInput) return;

  var conceptSlug = document.body.getAttribute('data-concept-slug') || '';

  var state = {
    sessionId: null,
    exchanges: [],
    exchangeCount: 0,
    lastMessageTime: null,
    isStreaming: false,
    sessionEnded: false,
    waitingForReady: false
  };

  var autoScrollEnabled = true;
  var timeoutIntervalId = null;

  var ERROR_MESSAGE = "I'm sorry, but there are technical difficulties with the website and I can't continue the conversation at this time.";

  function renderInlineMarkdown(text) {
    var html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  function scrollToBottom() {
    if (autoScrollEnabled) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }

  chatArea.addEventListener('scroll', function () {
    var atBottom = chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 40;
    autoScrollEnabled = atBottom;
  });

  function appendReaderMessage(text) {
    if (!text) return;
    var el = document.createElement('div');
    el.className = 'chat-message reader';
    el.innerHTML = renderInlineMarkdown(text);
    chatArea.appendChild(el);
    scrollToBottom();
  }

  function createAgentMessage() {
    var el = document.createElement('div');
    el.className = 'chat-message agent streaming-cursor';
    el.id = 'current-agent-message';
    chatArea.appendChild(el);
    scrollToBottom();
    return el;
  }

  function appendTokenToAgent(token) {
    var el = document.getElementById('current-agent-message');
    if (!el) return;
    el._rawText = (el._rawText || '') + token;
    el.innerHTML = renderInlineMarkdown(el._rawText);
    el.classList.add('streaming-cursor');
    scrollToBottom();
  }

  function finalizeAgentMessage() {
    var el = document.getElementById('current-agent-message');
    if (el) {
      el.classList.remove('streaming-cursor');
      el.removeAttribute('id');
    }
  }

  function appendErrorMessage() {
    var current = document.getElementById('current-agent-message');
    if (current) {
      current.classList.remove('streaming-cursor');
      current.removeAttribute('id');
    }
    var el = document.createElement('div');
    el.className = 'chat-message agent error-message';
    el.innerHTML = renderInlineMarkdown(ERROR_MESSAGE);
    chatArea.appendChild(el);
    scrollToBottom();
  }

  function showLoadingIndicator() {
    var el = document.createElement('div');
    el.className = 'loading-indicator';
    el.id = 'loading-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    chatArea.appendChild(el);
    scrollToBottom();
  }

  function removeLoadingIndicator() {
    var el = document.getElementById('loading-indicator');
    if (el) el.remove();
  }

  function disableInput() {
    inputBar.classList.add('disabled');
    sendBtn.disabled = true;
    messageInput.setAttribute('readonly', '');
  }

  function enableInput() {
    if (state.sessionEnded) return;
    inputBar.classList.remove('disabled');
    sendBtn.disabled = false;
    messageInput.removeAttribute('readonly');
    messageInput.focus();
  }

  function endSession(reason) {
    state.sessionEnded = true;
    stopTimeoutCountdown();
    var msg = reason === 'timeout'
      ? 'This session has expired. Refresh the page to start a new one.'
      : 'This conversation has reached its limit. Refresh the page to start a new one.';
    inputBar.innerHTML = '<div class="session-ended-message">' + msg + '</div>';
  }

  function updateExchangeCountdown() {
    if (state.exchangeCount >= 25) {
      endSession('limit');
      return;
    }
    if (state.exchangeCount >= 21) {
      var remaining = 25 - state.exchangeCount;
      exchangeCountdown.textContent = remaining + ' exchange' + (remaining === 1 ? '' : 's') + ' remaining';
      exchangeCountdown.hidden = false;
    }
  }

  function startTimeoutCountdown() {
    stopTimeoutCountdown();
    timeoutIntervalId = setInterval(function () {
      if (!state.lastMessageTime || state.sessionEnded) return;
      var elapsed = Date.now() - state.lastMessageTime;
      var elapsedMin = elapsed / 60000;
      if (elapsedMin >= 60) {
        endSession('timeout');
        return;
      }
      if (elapsedMin >= 40) {
        var remainingMin = Math.floor((60 - elapsedMin) / 5) * 5;
        if (remainingMin < 1) remainingMin = 1;
        timeoutCountdown.textContent = 'Session expires in ~' + remainingMin + ' minutes.';
        timeoutCountdown.hidden = false;
      } else {
        timeoutCountdown.hidden = true;
      }
    }, 30000);
  }

  function stopTimeoutCountdown() {
    if (timeoutIntervalId) {
      clearInterval(timeoutIntervalId);
      timeoutIntervalId = null;
    }
    if (timeoutCountdown) timeoutCountdown.hidden = true;
  }

  function resetTimeout() {
    state.lastMessageTime = Date.now();
    if (timeoutCountdown) timeoutCountdown.hidden = true;
  }

  async function sendMessage(message) {
    if (state.sessionEnded || state.isStreaming || state.waitingForReady) return;

    if (state.exchangeCount >= 25) {
      endSession('limit');
      return;
    }

    state.isStreaming = true;
    state.waitingForReady = true;
    disableInput();

    if (message !== '') {
      appendReaderMessage(message);
    }

    if (!state.sessionId) {
      state.sessionId = crypto.randomUUID();
    }

    removeLoadingIndicator();
    createAgentMessage();

    try {
      var response = await fetch('/.netlify/functions/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          conceptSlug: conceptSlug,
          message: message
        })
      });

      if (!response.ok) throw new Error('API error');

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      while (true) {
        var result = await reader.read();
        if (result.done) {
          break;
        }

        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line.startsWith('data: ')) continue;
          var jsonStr = line.slice(6);
          try {
            var event = JSON.parse(jsonStr);
            if (event.error) {
              console.error('Server error:', event.error);
            } else if (event.token !== undefined) {
              appendTokenToAgent(event.token);
            } else if (event.done) {
              finalizeAgentMessage();
              state.isStreaming = false;
            } else if (event.ready) {
              state.waitingForReady = false;
              state.exchangeCount++;
              state.exchanges.push({ reader: message });
              resetTimeout();
              startTimeoutCountdown();
              updateExchangeCountdown();
              enableInput();
            }
          } catch (e) {
          }
        }
      }

      if (state.waitingForReady && !state.sessionEnded) {
        state.isStreaming = false;
        appendErrorMessage();
        state.waitingForReady = false;
        enableInput();
      }

    } catch (error) {
      state.isStreaming = false;
      state.waitingForReady = false;
      appendErrorMessage();
      enableInput();
    }
  }

  messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 96) + 'px';
  });

  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var text = messageInput.value.trim();
      if (text && !state.isStreaming && !state.waitingForReady && !state.sessionEnded) {
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendMessage(text);
      }
    }
  });

  sendBtn.addEventListener('click', function () {
    var text = messageInput.value.trim();
    if (text && !state.isStreaming && !state.waitingForReady && !state.sessionEnded) {
      messageInput.value = '';
      messageInput.style.height = 'auto';
      sendMessage(text);
    }
  });

  disableInput();
  showLoadingIndicator();
  sendMessage('');
})();
