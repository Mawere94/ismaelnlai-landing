(function () {
  'use strict';

  var WEBHOOK = 'https://n8n.ismaelnlai.com/webhook/chat-assistant';
  var MAX_MSGS = 20;

  var msgs = [];          // API message history (user/assistant turns)
  var isOpen = false;
  var isBusy = false;
  var sessionId = (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);

  // ── Inject styles ─────────────────────────────────────────────
  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      '#isnl-btn{position:fixed;bottom:28px;right:28px;z-index:9999;width:60px;height:60px;border-radius:50%;',
      'cursor:pointer;background:#C49A6C;border:none;box-shadow:0 4px 24px rgba(196,154,108,.35);',
      'display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}',
      '#isnl-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(196,154,108,.5);}',
      '#isnl-btn svg{width:26px;height:26px;fill:#08080F;}',

      '#isnl-badge{position:absolute;top:-3px;right:-3px;width:18px;height:18px;border-radius:50%;',
      'background:#E55A4E;color:#fff;font-size:11px;font-weight:700;display:none;',
      'align-items:center;justify-content:center;font-family:Inter,sans-serif;}',
      '#isnl-badge.show{display:flex;}',

      '#isnl-panel{position:fixed;bottom:100px;right:28px;z-index:9998;width:380px;height:570px;',
      'border-radius:16px;background:#08080F;border:1px solid #1E1E26;',
      'box-shadow:0 20px 70px rgba(0,0,0,.7);display:flex;flex-direction:column;overflow:hidden;',
      'transform:scale(.93) translateY(14px);opacity:0;pointer-events:none;',
      'transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s;',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;}',
      '#isnl-panel.isnl-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}',

      '#isnl-head{padding:16px 18px 14px;background:#0A0A12;border-bottom:1px solid #1E1E26;',
      'display:flex;align-items:center;gap:11px;}',
      '#isnl-av{width:38px;height:38px;border-radius:50%;background:#C49A6C;flex-shrink:0;',
      'display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;',
      'color:#08080F;font-family:Inter,sans-serif;letter-spacing:-.5px;}',
      '#isnl-hi{flex:1;}',
      '#isnl-hn{font-size:13.5px;font-weight:600;color:#ECEAE4;line-height:1.2;}',
      '#isnl-hs{font-size:11.5px;color:#C49A6C;margin-top:2px;}',
      '#isnl-cls{background:none;border:none;cursor:pointer;color:#5A5850;padding:4px;',
      'border-radius:6px;display:flex;align-items:center;transition:color .15s;}',
      '#isnl-cls:hover{color:#ECEAE4;}',

      '#isnl-msgs{flex:1;overflow-y:auto;padding:14px 14px 6px;',
      'display:flex;flex-direction:column;gap:9px;scroll-behavior:smooth;}',
      '#isnl-msgs::-webkit-scrollbar{width:3px;}',
      '#isnl-msgs::-webkit-scrollbar-track{background:transparent;}',
      '#isnl-msgs::-webkit-scrollbar-thumb{background:#1E1E26;border-radius:2px;}',

      '.isnl-m{max-width:84%;padding:10px 13px;border-radius:14px;',
      'font-size:13.5px;line-height:1.6;word-break:break-word;animation:isnl-in .18s ease;}',
      '.isnl-m.a{background:#111118;color:#ECEAE4;align-self:flex-start;border-bottom-left-radius:4px;}',
      '.isnl-m.u{background:#C49A6C;color:#08080F;align-self:flex-end;',
      'border-bottom-right-radius:4px;font-weight:500;}',
      '.isnl-m a{color:#C49A6C;text-decoration:underline;}',
      '.isnl-m.u a{color:#08080F;}',
      '.isnl-m strong{font-weight:600;}',
      '@keyframes isnl-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',

      '#isnl-typing{align-self:flex-start;background:#111118;padding:11px 15px;',
      'border-radius:14px;border-bottom-left-radius:4px;display:none;gap:5px;align-items:center;}',
      '#isnl-typing.show{display:flex;}',
      '.isnl-d{width:7px;height:7px;border-radius:50%;background:#5A5850;',
      'animation:isnl-b 1.2s infinite ease-in-out;}',
      '.isnl-d:nth-child(2){animation-delay:.2s}',
      '.isnl-d:nth-child(3){animation-delay:.4s}',
      '@keyframes isnl-b{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-5px);opacity:1}}',

      '#isnl-lmt{text-align:center;font-size:12px;color:#5A5850;padding:6px 0 2px;}',

      '#isnl-foot{padding:10px 12px 12px;border-top:1px solid #1E1E26;background:#0A0A12;',
      'display:flex;gap:8px;align-items:flex-end;}',
      '#isnl-inp{flex:1;background:#111118;border:1px solid #1E1E26;border-radius:10px;',
      'padding:9px 12px;color:#ECEAE4;font-size:13.5px;font-family:Inter,sans-serif;',
      'resize:none;outline:none;min-height:38px;max-height:96px;line-height:1.45;',
      'transition:border-color .15s;}',
      '#isnl-inp::placeholder{color:#3A3830;}',
      '#isnl-inp:focus{border-color:#6B5535;}',
      '#isnl-inp:disabled{opacity:.5;cursor:not-allowed;}',
      '#isnl-snd{width:38px;height:38px;background:#C49A6C;border:none;border-radius:10px;',
      'cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;',
      'transition:background .15s,transform .1s;color:#08080F;}',
      '#isnl-snd:hover{background:#d4aa7c;}',
      '#isnl-snd:active{transform:scale(.94);}',
      '#isnl-snd:disabled{background:#1E1E26;cursor:not-allowed;}',
      '#isnl-snd svg{width:17px;height:17px;}',

      '.isnl-cal-btn{align-self:flex-start;margin-top:2px;padding:10px 16px;',
      'background:linear-gradient(135deg,#C49A6C,#a07848);color:#08080F;',
      'border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;',
      'display:flex;align-items:center;gap:7px;animation:isnl-in .18s ease;',
      'box-shadow:0 2px 12px rgba(196,154,108,.3);transition:transform .15s,box-shadow .15s;}',
      '.isnl-cal-btn:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(196,154,108,.45);}',

      '#isnl-pw{font-size:10.5px;color:#2A2820;text-align:center;padding:4px 0 2px;',
      'font-family:Inter,sans-serif;}',

      '@media(max-width:440px){',
      '#isnl-panel{width:calc(100vw - 24px);right:12px;bottom:88px;height:520px;}',
      '#isnl-btn{right:14px;bottom:14px;}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── Helpers ───────────────────────────────────────────────────
  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function md(text) {
    return esc(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(https?:\/\/\S+)/g, function(url) {
        if (url.indexOf('</a>') !== -1) return url;
        return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
      })
      .replace(/\n/g, '<br>');
  }

  // ── DOM refs ──────────────────────────────────────────────────
  var panel, msgArea, typingEl, inp, sndBtn, badge, limitEl;

  function buildUI() {
    // Typing indicator
    typingEl = document.createElement('div');
    typingEl.id = 'isnl-typing';
    typingEl.innerHTML = '<div class="isnl-d"></div><div class="isnl-d"></div><div class="isnl-d"></div>';

    // Limit notice
    limitEl = document.createElement('div');
    limitEl.id = 'isnl-lmt';
    limitEl.style.display = 'none';

    // Messages area
    msgArea = document.createElement('div');
    msgArea.id = 'isnl-msgs';

    // Input
    inp = document.createElement('textarea');
    inp.id = 'isnl-inp';
    inp.placeholder = 'Escríbeme...';
    inp.rows = 1;
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    inp.addEventListener('input', function() {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 96) + 'px';
    });

    // Send button
    sndBtn = document.createElement('button');
    sndBtn.id = 'isnl-snd';
    sndBtn.title = 'Enviar';
    sndBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/></svg>';
    sndBtn.addEventListener('click', submit);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.id = 'isnl-cls';
    closeBtn.title = 'Cerrar';
    closeBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', togglePanel);

    // Header
    var head = document.createElement('div');
    head.id = 'isnl-head';
    head.innerHTML = '<div id="isnl-av">IN</div><div id="isnl-hi"><div id="isnl-hn">Asistente de ismaelnlai</div><div id="isnl-hs">● Siempre disponible</div></div>';
    head.appendChild(closeBtn);

    // Footer
    var foot = document.createElement('div');
    foot.id = 'isnl-foot';
    foot.appendChild(inp);
    foot.appendChild(sndBtn);

    // Powered by
    var pw = document.createElement('div');
    pw.id = 'isnl-pw';
    pw.textContent = 'Powered by Claude AI';

    // Panel
    panel = document.createElement('div');
    panel.id = 'isnl-panel';
    panel.appendChild(head);
    panel.appendChild(msgArea);
    panel.appendChild(typingEl);
    panel.appendChild(limitEl);
    panel.appendChild(foot);
    panel.appendChild(pw);

    // Floating button + badge
    badge = document.createElement('div');
    badge.id = 'isnl-badge';
    badge.textContent = '1';

    var btn = document.createElement('button');
    btn.id = 'isnl-btn';
    btn.title = 'Chat con ismaelnlai';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"/></svg>';
    btn.appendChild(badge);
    btn.addEventListener('click', togglePanel);

    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }

  // ── Render a bubble ───────────────────────────────────────────
  function addBubble(role, text) {
    var div = document.createElement('div');
    div.className = 'isnl-m ' + (role === 'user' ? 'u' : 'a');
    div.innerHTML = md(text);
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
    return div;
  }

  // ── Toggle panel ──────────────────────────────────────────────
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('isnl-open', isOpen);
    badge.classList.remove('show');
    if (isOpen) {
      if (msgs.length === 0) showWelcome();
      setTimeout(function() { inp.focus(); }, 240);
    }
  }

  // ── Welcome (UI only, not in msgs) ────────────────────────────
  function showWelcome() {
    var text = '¡Hola! Soy el asistente de **ismaelnlai**.\n\nPuedo contarte cómo automatizamos procesos repetitivos con IA y cómo podríamos ayudar a tu empresa. ¿En qué puedo ayudarte?';
    setTimeout(function() {
      addBubble('assistant', text);
    }, 300);
  }

  // ── API call ──────────────────────────────────────────────────
  function callAPI(userText) {
    msgs.push({ role: 'user', content: userText });
    setBusy(true);
    showTyping();

    var payload = JSON.stringify({ messages: msgs, sessionId: sessionId });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', WEBHOOK, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 30000;

    xhr.onload = function() {
      hideTyping();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          var text = data.text || data.message || 'Lo siento, no he podido procesar tu mensaje.';
          msgs.push({ role: 'assistant', content: text });
          addBubble('assistant', text);
          if (data.calendlyData) showCalendlyBtn(data.calendlyData);
        } catch(e) {
          showError();
        }
      } else {
        showError();
      }
      setBusy(false);
      checkLimit();
    };

    xhr.onerror = function() { hideTyping(); showError(); setBusy(false); };
    xhr.ontimeout = function() { hideTyping(); showError(); setBusy(false); };

    xhr.send(payload);
  }

  // ── Calendly ──────────────────────────────────────────────────
  function showCalendlyBtn(calData) {
    var btn = document.createElement('div');
    btn.className = 'isnl-cal-btn';
    btn.innerHTML = '<span>📅</span> Elige tu horario con Ismael';
    btn.addEventListener('click', function() { openCalendly(calData); });
    msgArea.appendChild(btn);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function openCalendly(calData) {
    var url = 'https://calendly.com/ismaelnlai/diagnostico';
    var params = [];
    if (calData) {
      if (calData.name)  params.push('name='  + encodeURIComponent(calData.name));
      if (calData.email) params.push('email=' + encodeURIComponent(calData.email));
      if (calData.q1)    params.push('a1='    + encodeURIComponent(calData.q1));
      if (calData.q2)    params.push('a2='    + encodeURIComponent(calData.q2));
      if (calData.q3)    params.push('a3='    + encodeURIComponent(calData.q3));
    }
    if (params.length) url += '?' + params.join('&');

    loadCalendlyScript(function() {
      window.Calendly.initPopupWidget({ url: url });
    });
  }

  function loadCalendlyScript(cb) {
    if (window.Calendly) { cb(); return; }
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function showError() {
    var t = 'Lo siento, ha habido un error técnico. Puedes escribirme a [mawere2494@gmail.com](mailto:mawere2494@gmail.com) o agendar directamente en [calendly.com/ismaelnlai/diagnostico](https://calendly.com/ismaelnlai/diagnostico).';
    msgs.push({ role: 'assistant', content: t });
    addBubble('assistant', t);
  }

  function showTyping() { typingEl.classList.add('show'); msgArea.scrollTop = msgArea.scrollHeight; }
  function hideTyping() { typingEl.classList.remove('show'); }

  function setBusy(v) {
    isBusy = v;
    sndBtn.disabled = v;
    inp.disabled = v;
  }

  function checkLimit() {
    if (msgs.length >= MAX_MSGS) {
      limitEl.style.display = 'block';
      limitEl.innerHTML = 'Límite de conversación alcanzado. <a href="https://calendly.com/ismaelnlai/diagnostico" target="_blank" rel="noopener" style="color:#C49A6C">Agenda tu diagnóstico gratuito →</a>';
      inp.disabled = true;
      sndBtn.disabled = true;
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  function submit() {
    var text = inp.value.trim();
    if (!text || isBusy || msgs.length >= MAX_MSGS) return;
    inp.value = '';
    inp.style.height = 'auto';
    addBubble('user', text);
    callAPI(text);
  }

  // ── Show badge on first load (after 4s delay) ─────────────────
  function scheduleBadge() {
    setTimeout(function() {
      if (!isOpen) badge.classList.add('show');
    }, 4000);
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildUI();
    scheduleBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
