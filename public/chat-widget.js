(function () {
  const BOT_URL =
    window._PGMATE_CHATBOT_URL || "http://localhost:8002";

  /* ---------- TOGGLE BUTTON ---------- */
  const toggle = document.createElement("div");
  toggle.id = "chat-toggle";
  toggle.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#fff"/>
      <path d="M7 9h10M7 13h6" stroke="#5c54f6" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(toggle);

  /* ---------- CHAT PANEL ---------- */
  const panel = document.createElement("div");
  panel.id = "chat-panel";
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-title">
        <div class="chat-logo">🏠</div>
        <div>
          <div class="chat-name">PGMate Assistant</div>
          <div class="chat-sub">Smart PG & Co-Living help</div>
        </div>
      </div>
      <button id="chat-close">✕</button>
    </div>

    <div class="chat-body" id="chat-body">
      <div class="chat-empty">
        👋 Hi! Ask me about PGs, rent, amenities, or how to list your PG.
      </div>
    </div>

    <div class="chat-input">
      <input id="chat-input" placeholder="Ask PGMate..." />
      <button id="chat-send">➤</button>
    </div>
  `;
  document.body.appendChild(panel);

  const bodyEl = panel.querySelector("#chat-body");
  const inputEl = panel.querySelector("#chat-input");
  const sendBtn = panel.querySelector("#chat-send");
  const closeBtn = panel.querySelector("#chat-close");

  /* ---------- OPEN / CLOSE ---------- */
  toggle.onclick = () => {
    panel.style.display = "flex";
    toggle.style.display = "none";
    inputEl.focus();
  };

  closeBtn.onclick = () => {
    panel.style.display = "none";
    toggle.style.display = "flex";
  };

  /* ---------- MESSAGE HELPERS ---------- */
  function addMessage(text, who) {
    const empty = panel.querySelector(".chat-empty");
    if (empty) empty.remove();

    const el = document.createElement("div");
    el.className = `chat-message ${who}`;
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.id = "typing";
    el.className = "chat-message bot typing";
    el.textContent = "PGMate is typing...";
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
  }

  /* ---------- SEND MESSAGE ---------- */
  async function sendMessage(text) {
    addMessage(text, "user");
    showTyping();

    try {
      const res = await fetch(BOT_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      removeTyping();

      if (!res.ok) {
        addMessage("Something went wrong. Please try again.", "bot");
        return;
      }

      const data = await res.json();
      addMessage(data.response || "No response received.", "bot");
    } catch (err) {
      removeTyping();
      addMessage("Network error. Please check connection.", "bot");
    }
  }

  sendBtn.onclick = () => {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendMessage(text);
  };

  inputEl.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  };
})();

