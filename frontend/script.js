// ---------- AUTH GUARD ----------
const currentUser = JSON.parse(localStorage.getItem("talktopit_user") || "null");
if (!currentUser) {
  window.location.href = "/";
}

// ---------- ELEMENTS ----------
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const newChatBtn = document.getElementById("newChatBtn");
const chatHistoryEl = document.getElementById("chatHistory");
const searchInput = document.getElementById("searchInput");
const searchIconBtn = document.getElementById("searchIconBtn");
const searchBox = document.getElementById("searchBox");

const sidebar = document.getElementById("sidebar");
const collapseBtn = document.getElementById("collapseBtn");
const expandBtn = document.getElementById("expandBtn");

const founderBtn = document.getElementById("founderBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userAvatar = document.getElementById("userAvatar");
const userEmailLabel = document.getElementById("userEmailLabel");

const imageModeBtn = document.getElementById("imageModeBtn");
const langSelect = document.getElementById("langSelect");

let imageMode = false;

const SYSTEM_PROMPT = "You are Talktopit, a helpful AI assistant. Never generate fake download links, fake file attachments, or base64 data links in your answers — the app handles real file downloads separately. Just answer the question normally in plain text or markdown.";

// ---------- USER CHIP ----------
userAvatar.textContent = currentUser.name ? currentUser.name[0].toUpperCase() : "U";
userEmailLabel.textContent = currentUser.email;

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("talktopit_user");
  window.location.href = "/";
});

// ---------- SIDEBAR COLLAPSE ----------
collapseBtn.addEventListener("click", () => {
  sidebar.classList.add("collapsed");
  expandBtn.classList.remove("hidden");
});
expandBtn.addEventListener("click", () => {
  sidebar.classList.remove("collapsed");
  expandBtn.classList.add("hidden");
});

searchIconBtn.addEventListener("click", () => searchBox.classList.toggle("hidden"));

// ---------- MODALS ----------
founderBtn.addEventListener("click", () => document.getElementById("founderModal").classList.remove("hidden"));
document.querySelectorAll("[data-close]").forEach(el => {
  el.addEventListener("click", () => document.getElementById(el.dataset.close).classList.add("hidden"));
});

// ---------- IMAGE MODE TOGGLE (manual override) ----------
imageModeBtn.addEventListener("click", () => {
  imageMode = !imageMode;
  imageModeBtn.style.background = imageMode ? "var(--red)" : "white";
  imageModeBtn.style.color = imageMode ? "white" : "var(--text-dim)";
  userInput.placeholder = imageMode ? "Describe the image you want..." : "Ask anything";
});

// ---------- STATE ----------
let sessions = JSON.parse(localStorage.getItem("talktopit_sessions") || "[]");
let currentSessionId = null;
let messages = [{ role: "system", content: SYSTEM_PROMPT }];

// ---------- HISTORY ----------
function saveSessions() {
  localStorage.setItem("talktopit_sessions", JSON.stringify(sessions));
}

function renderHistory(filter = "") {
  chatHistoryEl.querySelectorAll(".history-item").forEach(el => el.remove());
  sessions
    .filter(s => s.title.toLowerCase().includes(filter.toLowerCase()))
    .slice().reverse()
    .forEach(s => {
      const div = document.createElement("div");
      div.className = "history-item" + (s.id === currentSessionId ? " active" : "");
      div.textContent = s.title;
      div.addEventListener("click", () => loadSession(s.id));
      chatHistoryEl.appendChild(div);
    });
}
searchInput.addEventListener("input", () => renderHistory(searchInput.value));

function loadSession(id) {
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  currentSessionId = id;
  messages = session.messages;
  chatWindow.innerHTML = "";
  messages.forEach(m => {
    if (m.role === "user" || m.role === "assistant") {
      addMessage(m.content, m.role === "user" ? "user" : "bot");
    }
  });
  renderHistory();
}

function startNewSession() {
  currentSessionId = "s_" + Date.now();
  messages = [{ role: "system", content: SYSTEM_PROMPT }];
  chatWindow.innerHTML = "";
  const ws = document.createElement("div");
  ws.className = "welcome-screen";
  ws.innerHTML = `<h1>Ready when you are.</h1><p class="welcome-sub">Ask a question, say "draw a..." for images, or mention "pdf"/"doc" for a document.</p>`;
  chatWindow.appendChild(ws);
}
newChatBtn.addEventListener("click", startNewSession);
startNewSession();

// ---------- MESSAGING ----------
function addMessage(text, sender) {
  const ws = chatWindow.querySelector(".welcome-screen");
  if (ws) ws.remove();
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  if (sender === "bot") {
    div.innerHTML = marked.parse(text || "");
  } else {
    div.textContent = text;
  }
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

// ---------- INTENT DETECTION (like real ChatGPT) ----------
function detectIntent(text) {
  const lower = text.toLowerCase();

  const imageWords = ["generate image", "create image", "draw", "make a picture", "make an image", "picture of", "image of", "draw me", "create a picture", "generate a picture"];
  const pdfWords = ["pdf"];
  const docWords = ["word doc", "word document", "doc download", "in doc", "as doc", ".docx", "docx", " doc "];

  if (imageWords.some(w => lower.includes(w))) return "image";
  if (pdfWords.some(w => lower.includes(w))) return "pdf";
  if (docWords.some(w => lower.includes(w))) return "doc";
  return "text";
}

// ---------- STRIP MARKDOWN FOR CLEAN PDF/WORD OUTPUT ----------
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, "")           // headers
    .replace(/\*\*(.*?)\*\*/g, "$1")       // bold
    .replace(/\*(.*?)\*/g, "$1")           // italics
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")   // inline code
    .replace(/^\s*[-*]\s+/gm, "• ")        // bullet lists
    .replace(/\|/g, " ")                   // table pipes
    .replace(/^-+$/gm, "")                 // table separator lines
    .replace(/\n{3,}/g, "\n\n");           // collapse extra blank lines
}

function textToPdfBlob(title, content) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const cleanContent = stripMarkdown(content);
  let y = 15;
  doc.setFontSize(16);
  doc.text(title, 15, y);
  y += 10;
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(cleanContent, 180);
  lines.forEach(line => {
    if (y > 280) { doc.addPage(); y = 15; }
    doc.text(line, 15, y);
    y += 7;
  });
  return doc;
}

async function textToDocxBlob(title, content) {
  const { Document, Packer, Paragraph, TextRun } = window.docx;
  const cleanContent = stripMarkdown(content);
  const paragraphs = [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] }),
    new Paragraph({ text: "" }),
  ];
  cleanContent.split("\n").forEach(line => {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }));
  });
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return await Packer.toBlob(doc);
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  const intent = imageMode ? "image" : detectIntent(text);

  // ---- IMAGE GENERATION ----
  if (intent === "image") {
    const loadingNode = addMessage("", "bot");
    loadingNode.innerHTML = `<div class="image-loading">🎨 Generating your image...</div>`;
    try {
      const res = await fetch(`/api/generate-image?prompt=${encodeURIComponent(text)}`);
      const data = await res.json();
      loadingNode.innerHTML = `
        <div class="image-card">
          <img src="${data.image_url}" alt="Generated image" class="generated-img"
               onload="this.classList.add('loaded')"
               onerror="this.parentElement.innerHTML='⚠️ Image failed to load. Try rephrasing your prompt.'" />
          <a href="${data.image_url}" download="talktopit-image.png" target="_blank" class="download-btn">⬇ Download Image</a>
        </div>`;
    } catch (err) {
      loadingNode.innerHTML = `⚠️ Error generating image: ${err.message}`;
    }
    return;
  }

  // ---- NORMAL AI TEXT ANSWER (also used for pdf/doc intents) ----
  let finalText = text;
  if (langSelect.value) {
    finalText = `Please reply only in ${langSelect.value}. ${text}`;
  }
  messages.push({ role: "user", content: finalText });

  const typingNode = addMessage("Typing...", "bot");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Something went wrong");

    typingNode.innerHTML = marked.parse(data.reply);
    messages.push({ role: "assistant", content: data.reply });

    // ---- AUTO PDF ----
    if (intent === "pdf") {
      const doc = textToPdfBlob("Talktopit Response", data.reply);
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const btn = document.createElement("div");
      btn.innerHTML = `<a href="${url}" download="talktopit-response.pdf" class="download-btn" style="margin-top:10px;">⬇ Download PDF</a>`;
      typingNode.appendChild(btn);
    }

    // ---- AUTO WORD DOC ----
    if (intent === "doc") {
      const blob = await textToDocxBlob("Talktopit Response", data.reply);
      const url = URL.createObjectURL(blob);
      const btn = document.createElement("div");
      btn.innerHTML = `<a href="${url}" download="talktopit-response.docx" class="download-btn" style="margin-top:10px;">⬇ Download Word</a>`;
      typingNode.appendChild(btn);
    }

    let session = sessions.find(s => s.id === currentSessionId);
    if (!session) {
      session = { id: currentSessionId, title: text.slice(0, 30), messages };
      sessions.push(session);
    } else {
      session.messages = messages;
    }
    saveSessions();
    renderHistory();
  } catch (err) {
    typingNode.textContent = "Error: " + err.message;
  }
});

// ---------- EXPORT ENTIRE CONVERSATION TO PDF ----------
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  let fullText = "";
  messages.forEach(m => {
    if (m.role === "user" || m.role === "assistant") {
      fullText += (m.role === "user" ? "You: " : "Talktopit: ") + m.content + "\n\n";
    }
  });
  const doc = textToPdfBlob("Talktopit Chat Export", fullText);
  doc.save("talktopit-chat.pdf");
});

// ---------- EXPORT ENTIRE CONVERSATION TO WORD ----------
document.getElementById("exportDocBtn").addEventListener("click", async () => {
  let fullText = "";
  messages.forEach(m => {
    if (m.role === "user" || m.role === "assistant") {
      fullText += (m.role === "user" ? "You: " : "Talktopit: ") + m.content + "\n\n";
    }
  });
  const blob = await textToDocxBlob("Talktopit Chat Export", fullText);
  saveAs(blob, "talktopit-chat.docx");
});