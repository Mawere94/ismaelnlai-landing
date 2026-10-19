/* Asistente de chat — ismaelnlai.com
 *
 * Contrato con el webhook (sin cambios): POST { messages, sessionId } y respuesta
 * JSON { text | message, calendlyData? }.
 *
 * Seguridad: nada que escriba el visitante o devuelva el modelo se inserta como
 * HTML. renderMessage() construye nodos DOM con una gramática mínima (negrita,
 * enlaces Markdown, URL y correos sueltos) y solo crea enlaces http(s) y mailto.
 */
(function () {
  'use strict';

  var WEBHOOK = 'https://n8n.ismaelnlai.com/webhook/chat-assistant';
  var CALENDLY_URL = 'https://calendly.com/ismaelnlai/diagnostico';
  var MAX_MSGS = 20;
  var TIMEOUT_MS = 30000;

  var msgs = [];          // historial para la API (turnos user/assistant)
  var isOpen = false;
  var isBusy = false;
  var welcomed = false;
  var closeTimer = null;
  var sessionId = (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);

  // ── Renderizado seguro ────────────────────────────────────────
  var SAFE_PROTOCOLS = { 'http:': true, 'https:': true, 'mailto:': true };
  var EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  // Orden de alternativas: **negrita** · [texto](url) · URL suelta · correo suelto
  var INLINE_RE = /\*\*([^*\n]+?)\*\*|\[([^\]\n]+)\]\(([^()\s]+)\)|(https?:\/\/[^\s<>"'`]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;

  function safeHref(raw) {
    var s = String(raw || '').trim();
    if (!/^(https?:\/\/|mailto:)/i.test(s)) return null;
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    if (!SAFE_PROTOCOLS[u.protocol]) return null;
    if (u.protocol === 'mailto:') {
      var addr;
      try { addr = decodeURIComponent(u.pathname); } catch (e) { return null; }
      if (!EMAIL_RE.test(addr)) return null;
    }
    return u.href;
  }

  function makeLink(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (!/^mailto:/i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function renderInline(text, parent, allowBold) {
    var re = new RegExp(INLINE_RE.source, 'g');
    var last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1] !== undefined) {
        if (allowBold) {
          var strong = document.createElement('strong');
          renderInline(m[1], strong, false);
          parent.appendChild(strong);
        } else {
          parent.appendChild(document.createTextNode(m[0]));
        }
      } else if (m[2] !== undefined) {
        var href = safeHref(m[3]);
        if (href) parent.appendChild(makeLink(href, m[2]));
        else parent.appendChild(document.createTextNode(m[2]));
      } else if (m[4] !== undefined) {
        // La puntuación final («visita https://x.com.») no forma parte del enlace
        var url = m[4], tail = '';
        var t = url.match(/[.,;:!?)\]]+$/);
        if (t) { tail = t[0]; url = url.slice(0, -tail.length); }
        var h = safeHref(url);
        if (h) parent.appendChild(makeLink(h, url)); else parent.appendChild(document.createTextNode(url));
        if (tail) parent.appendChild(document.createTextNode(tail));
      } else if (m[5] !== undefined) {
        var mh = safeHref('mailto:' + m[5]);
        if (mh) parent.appendChild(makeLink(mh, m[5])); else parent.appendChild(document.createTextNode(m[5]));
      }
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  // Rellena `el` con el mensaje formateado. Devuelve el propio elemento.
  function renderMessage(el, text) {
    while (el.firstChild) el.removeChild(el.firstChild);
    String(text == null ? '' : text).split('\n').forEach(function (line, i) {
      if (i > 0) el.appendChild(document.createElement('br'));
      renderInline(line, el, true);
    });
    return el;
  }

  // ── Estilos ───────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('isnl-styles')) return;
    var s = document.createElement('style');
    s.id = 'isnl-styles';
    s.textContent = [
      '#isnl-btn{position:fixed;bottom:24px;right:24px;z-index:9999;width:60px;height:60px;border-radius:50%;',
      'cursor:pointer;background:#C49A6C;border:none;box-shadow:0 4px 20px rgba(0,0,0,.45);',
      'display:flex;align-items:center;justify-content:center;transition:transform .2s;}',
      '#isnl-btn:hover{transform:scale(1.06);}',
      '#isnl-btn:focus-visible{outline:3px solid #ECEAE4;outline-offset:3px;}',
      '#isnl-btn svg{width:26px;height:26px;fill:#08080F;}',

      '#isnl-panel{position:fixed;bottom:96px;right:24px;z-index:9998;width:380px;',
      'height:min(570px,calc(100vh - 120px));',
      'border-radius:16px;background:#08080F;border:1px solid #2A2A3E;',
      'box-shadow:0 20px 70px rgba(0,0,0,.7);display:flex;flex-direction:column;overflow:hidden;',
      'transform:translateY(10px);opacity:0;transition:transform .2s ease,opacity .2s ease;',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;}',
      '#isnl-panel[hidden]{display:none;}',
      '#isnl-panel.isnl-open{transform:none;opacity:1;}',

      '#isnl-head{padding:14px 14px 12px 18px;background:#0D0D18;border-bottom:1px solid #2A2A3E;',
      'display:flex;align-items:center;gap:11px;}',
      '#isnl-av{width:38px;height:38px;border-radius:50%;background:#C49A6C;flex-shrink:0;',
      'display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#08080F;}',
      '#isnl-hi{flex:1;min-width:0;}',
      '#isnl-hn{font-size:14px;font-weight:600;color:#ECEAE4;line-height:1.25;margin:0;}',
      '#isnl-hs{font-size:12px;color:#ADA59A;margin-top:2px;}',
      '#isnl-hs a{color:#C49A6C;}',
      '#isnl-cls{background:none;border:none;cursor:pointer;color:#ADA59A;width:40px;height:40px;',
      'border-radius:8px;display:flex;align-items:center;justify-content:center;}',
      '#isnl-cls:hover{color:#ECEAE4;background:#16162A;}',
      '#isnl-cls:focus-visible,#isnl-snd:focus-visible,.isnl-cal-btn:focus-visible,#isnl-panel a:focus-visible{outline:2px solid #C49A6C;outline-offset:2px;}',

      '#isnl-msgs{flex:1;overflow-y:auto;padding:14px 14px 6px;display:flex;flex-direction:column;gap:9px;}',
      '.isnl-m{max-width:86%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.6;word-break:break-word;}',
      '.isnl-m.a{background:#16162A;color:#ECEAE4;align-self:flex-start;border-bottom-left-radius:4px;}',
      '.isnl-m.u{background:#C49A6C;color:#08080F;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500;}',
      '.isnl-m a{color:#D9B48A;text-decoration:underline;}',
      '.isnl-m.u a{color:#08080F;}',
      '.isnl-m strong{font-weight:600;}',

      '#isnl-typing{align-self:flex-start;margin:0 14px 6px;background:#16162A;padding:11px 15px;',
      'border-radius:14px;border-bottom-left-radius:4px;display:none;gap:5px;align-items:center;}',
      '#isnl-typing.show{display:flex;}',
      '.isnl-d{width:7px;height:7px;border-radius:50%;background:#ADA59A;animation:isnl-b 1.2s infinite ease-in-out;}',
      '.isnl-d:nth-child(2){animation-delay:.2s}.isnl-d:nth-child(3){animation-delay:.4s}',
      '@keyframes isnl-b{0%,60%,100%{opacity:.35}30%{opacity:1}}',

      '#isnl-lmt{text-align:center;font-size:13px;color:#ADA59A;padding:6px 12px 2px;}',
      '#isnl-lmt a{color:#C49A6C;}',

      '#isnl-foot{padding:10px 12px 12px;border-top:1px solid #2A2A3E;background:#0D0D18;display:flex;gap:8px;align-items:flex-end;}',
      '#isnl-inp{flex:1;background:#16162A;border:1px solid #34344E;border-radius:10px;padding:9px 12px;',
      'color:#ECEAE4;font-size:16px;font-family:Inter,sans-serif;resize:none;min-height:40px;max-height:96px;line-height:1.4;}',
      '#isnl-inp::placeholder{color:#8C857B;}',
      '#isnl-inp:focus{outline:none;border-color:#C49A6C;box-shadow:0 0 0 2px rgba(196,154,108,.25);}',
      '#isnl-inp:disabled{opacity:.6;cursor:not-allowed;}',
      '#isnl-snd{width:40px;height:40px;background:#C49A6C;border:none;border-radius:10px;cursor:pointer;flex-shrink:0;',
      'display:flex;align-items:center;justify-content:center;color:#08080F;}',
      '#isnl-snd:hover{background:#D2AA7E;}',
      '#isnl-snd:disabled{background:#34344E;color:#8C857B;cursor:not-allowed;}',
      '#isnl-snd svg{width:17px;height:17px;}',

      '.isnl-cal-btn{align-self:flex-start;padding:10px 16px;background:#C49A6C;color:#08080F;',
      'border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:7px;}',
      '.isnl-cal-btn:hover{background:#D2AA7E;}',

      '.isnl-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}',

      '@media(max-width:480px){',
      '#isnl-panel{left:8px;right:8px;bottom:8px;width:auto;height:min(600px,calc(100vh - 16px));border-radius:14px;}',
      '#isnl-btn{right:14px;bottom:14px;}',
      'body.isnl-abierto #isnl-btn{display:none;}',
      '}',
      '@media (prefers-reduced-motion:reduce){#isnl-panel,#isnl-btn{transition:none;}.isnl-d{animation:none;opacity:.8;}}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── Interfaz ──────────────────────────────────────────────────
  var panel, msgArea, typingEl, inp, sndBtn, openBtn, limitEl, statusEl;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  function svg(markup) {
    // Marcado estático y propio (iconos), nunca datos del usuario.
    var wrap = document.createElement('span');
    wrap.innerHTML = markup;
    var node = wrap.firstChild;
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    return node;
  }

  function buildUI() {
    // Cabecera
    var head = el('div', { id: 'isnl-head' });
    head.appendChild(el('div', { id: 'isnl-av', 'aria-hidden': 'true' }, 'IN'));
    var hi = el('div', { id: 'isnl-hi' });
    hi.appendChild(el('h2', { id: 'isnl-hn' }, 'Asistente de ismaelnlai'));
    var hs = el('div', { id: 'isnl-hs' }, 'Responde una IA · ');
    var priv = el('a', { href: '/privacidad' }, 'Privacidad');
    hs.appendChild(priv);
    hi.appendChild(hs);
    head.appendChild(hi);
    var closeBtn = el('button', { id: 'isnl-cls', type: 'button', 'aria-label': 'Cerrar chat' });
    closeBtn.appendChild(svg('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'));
    closeBtn.addEventListener('click', function () { closePanel(true); });
    head.appendChild(closeBtn);

    // Conversación: role=log anuncia solo lo que se añade, no relee el historial
    msgArea = el('div', { id: 'isnl-msgs', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', 'aria-label': 'Conversación' });
    typingEl = el('div', { id: 'isnl-typing', 'aria-hidden': 'true' });
    for (var i = 0; i < 3; i++) typingEl.appendChild(el('span', { 'class': 'isnl-d' }));
    statusEl = el('div', { 'class': 'isnl-sr', role: 'status' });
    limitEl = el('div', { id: 'isnl-lmt' });
    limitEl.hidden = true;

    // Pie
    var foot = el('div', { id: 'isnl-foot' });
    var lbl = el('label', { 'for': 'isnl-inp', 'class': 'isnl-sr' }, 'Escribe tu mensaje al asistente');
    inp = el('textarea', { id: 'isnl-inp', rows: '1', maxlength: '1000', placeholder: 'Escribe tu pregunta…' });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
    });
    inp.addEventListener('input', function () {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 96) + 'px';
    });
    sndBtn = el('button', { id: 'isnl-snd', type: 'button', 'aria-label': 'Enviar mensaje' });
    sndBtn.appendChild(svg('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/></svg>'));
    sndBtn.addEventListener('click', submit);
    foot.appendChild(lbl);
    foot.appendChild(inp);
    foot.appendChild(sndBtn);

    // Panel: diálogo no modal (el resto de la página sigue usable)
    panel = el('section', { id: 'isnl-panel', role: 'dialog', 'aria-labelledby': 'isnl-hn' });
    panel.hidden = true;
    panel.appendChild(head);
    panel.appendChild(msgArea);
    panel.appendChild(typingEl);
    panel.appendChild(statusEl);
    panel.appendChild(limitEl);
    panel.appendChild(foot);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closePanel(true); }
    });

    // Botón flotante: nombre estable; el estado lo da aria-expanded
    openBtn = el('button', {
      id: 'isnl-btn', type: 'button', 'aria-label': 'Chat con el asistente',
      'aria-expanded': 'false', 'aria-controls': 'isnl-panel'
    });
    openBtn.appendChild(svg('<svg viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"/></svg>'));
    openBtn.addEventListener('click', function () { if (isOpen) closePanel(true); else openPanel(); });

    document.body.appendChild(panel);
    document.body.appendChild(openBtn);
  }

  function scrollDown() { msgArea.scrollTop = msgArea.scrollHeight; }

  function addBubble(role, text) {
    var div = el('div', { 'class': 'isnl-m ' + (role === 'user' ? 'u' : 'a') });
    renderMessage(div, text);
    msgArea.appendChild(div);
    scrollDown();
    return div;
  }

  // ── Abrir / cerrar ────────────────────────────────────────────
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function openPanel() {
    if (isOpen) { inp.focus(); return; }
    isOpen = true;
    clearTimeout(closeTimer);
    panel.hidden = false;
    fitViewport();
    // Un frame para que la transición arranque desde el estado cerrado
    requestAnimationFrame(function () { panel.classList.add('isnl-open'); });
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('isnl-abierto');
    if (!welcomed) {
      welcomed = true;
      addBubble('assistant', 'Hola. Soy el asistente de **ismaelnlai**, una IA. Puedo contarte cómo trabaja Ismael con asesorías y gestorías y ayudarte a reservar el diagnóstico gratuito.\n\nNo escribas aquí datos sensibles ni de tus clientes. ¿En qué te ayudo?');
    }
    inp.focus();
  }

  function closePanel(returnFocus) {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('isnl-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('isnl-abierto');
    // hidden = fuera del foco y del árbol de accesibilidad
    closeTimer = setTimeout(function () { panel.hidden = true; }, reducedMotion() ? 0 : 200);
    if (returnFocus) openBtn.focus();
  }

  // Teclado virtual en móvil: el panel se ajusta al área visible
  function fitViewport() {
    var vv = window.visualViewport;
    if (!panel || !vv || window.innerWidth > 480) { if (panel) { panel.style.height = ''; panel.style.bottom = ''; } return; }
    var hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    panel.style.bottom = (8 + hidden) + 'px';
    panel.style.height = Math.min(600, vv.height - 16) + 'px';
  }

  // ── API ───────────────────────────────────────────────────────
  function callAPI(userText) {
    msgs.push({ role: 'user', content: userText });
    setBusy(true);
    showTyping();

    var xhr = new XMLHttpRequest();
    xhr.open('POST', WEBHOOK, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = TIMEOUT_MS;

    var done = false;
    function finish() { if (done) return false; done = true; hideTyping(); setBusy(false); return true; }

    xhr.onload = function () {
      if (!finish()) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        var text = data && (typeof data.text === 'string' ? data.text : (typeof data.message === 'string' ? data.message : ''));
        if (!text) { showError(); return checkLimit(); }
        msgs.push({ role: 'assistant', content: text });
        addBubble('assistant', text);
        if (data.calendlyData) showCalendlyBtn(data.calendlyData);
      } else {
        showError();
      }
      checkLimit();
      if (isOpen && !inp.disabled) inp.focus();
    };
    xhr.onerror = function () { if (finish()) showError(); };
    xhr.ontimeout = function () { if (finish()) showError(true); };
    xhr.send(JSON.stringify({ messages: msgs, sessionId: sessionId }));
  }

  // ── Calendly ──────────────────────────────────────────────────
  function calendlyUrl(calData) {
    var params = [];
    if (calData && typeof calData === 'object') {
      if (calData.name)  params.push('name='  + encodeURIComponent(calData.name));
      if (calData.email) params.push('email=' + encodeURIComponent(calData.email));
      if (calData.q1)    params.push('a1='    + encodeURIComponent(calData.q1));
      if (calData.q2)    params.push('a2='    + encodeURIComponent(calData.q2));
      if (calData.q3)    params.push('a3='    + encodeURIComponent(calData.q3));
    }
    return CALENDLY_URL + (params.length ? '?' + params.join('&') : '');
  }

  function showCalendlyBtn(calData) {
    var url = calendlyUrl(calData);
    var a = el('a', { 'class': 'isnl-cal-btn', href: url, target: '_blank', rel: 'noopener' }, 'Elegir horario con Ismael');
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openCalendly(url, a);
    });
    msgArea.appendChild(a);
    scrollDown();
  }

  function openCalendly(url, trigger) {
    // En la portada hay un gestor común con aviso de fallo; en el resto de páginas, uno mínimo.
    if (window.ismaelnlaiBooking && window.ismaelnlaiBooking.open) { window.ismaelnlaiBooking.open(url, trigger); return; }
    loadCalendlyScript(function () {
      try { window.Calendly.initPopupWidget({ url: url }); }
      catch (e) { calendlyFailed(url); }
    }, function () { calendlyFailed(url); });
  }

  function calendlyFailed(url) {
    var div = addBubble('assistant', 'No he podido abrir el calendario aquí. Puedes ');
    div.appendChild(makeLink(url, 'abrirlo en una pestaña nueva'));
    div.appendChild(document.createTextNode(' o escribir a '));
    div.appendChild(makeLink('mailto:ismael@ismaelnlai.com', 'ismael@ismaelnlai.com'));
    div.appendChild(document.createTextNode('.'));
  }

  function loadCalendlyScript(ok, ko) {
    if (window.Calendly) { ok(); return; }
    var fired = false;
    var timer = setTimeout(function () { if (!fired) { fired = true; ko(); } }, 6000);
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.onload = function () { clearTimeout(timer); if (!fired) { fired = true; (window.Calendly ? ok : ko)(); } };
    s.onerror = function () { clearTimeout(timer); if (!fired) { fired = true; ko(); } };
    document.head.appendChild(s);
  }

  // Los errores no entran en el historial que se envía a la API
  function showError(timedOut) {
    addBubble('assistant', (timedOut ? 'La respuesta está tardando demasiado. ' : 'Ha habido un error técnico. ') +
      'Puedes volver a intentarlo, escribir a [ismael@ismaelnlai.com](mailto:ismael@ismaelnlai.com) o reservar en [calendly.com/ismaelnlai/diagnostico](' + CALENDLY_URL + ').');
    // El mensaje del usuario que falló no cuenta como turno: se puede reenviar
    if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs.pop();
  }

  function showTyping() { typingEl.classList.add('show'); statusEl.textContent = 'El asistente está escribiendo…'; scrollDown(); }
  function hideTyping() { typingEl.classList.remove('show'); statusEl.textContent = ''; }

  function setBusy(v) {
    isBusy = v;
    sndBtn.disabled = v;
    inp.disabled = v;
    msgArea.setAttribute('aria-busy', v ? 'true' : 'false');
  }

  function checkLimit() {
    if (msgs.length < MAX_MSGS) return;
    while (limitEl.firstChild) limitEl.removeChild(limitEl.firstChild);
    limitEl.appendChild(document.createTextNode('Has llegado al límite de esta conversación. '));
    var a = el('a', { href: CALENDLY_URL, target: '_blank', rel: 'noopener' }, 'Reserva el diagnóstico gratuito');
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); openCalendly(CALENDLY_URL, a);
    });
    limitEl.appendChild(a);
    limitEl.hidden = false;
    inp.disabled = true;
    sndBtn.disabled = true;
  }

  function submit() {
    var text = inp.value.trim();
    if (!text || isBusy || msgs.length >= MAX_MSGS) return;
    inp.value = '';
    inp.style.height = 'auto';
    addBubble('user', text);
    callAPI(text);
  }

  // ── Arranque ──────────────────────────────────────────────────
  function init() {
    if (document.getElementById('isnl-btn')) return;
    injectStyles();
    buildUI();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { if (isOpen) fitViewport(); });
      window.visualViewport.addEventListener('scroll', function () { if (isOpen) fitViewport(); });
    }
    window.isnlChat = { open: openPanel, close: function () { closePanel(true); } };
  }

  // Gancho para las pruebas del renderizador (tests/chat-render.test.html)
  if (window.ISNL_CHAT_TEST) window.isnlChatRender = { renderMessage: renderMessage, safeHref: safeHref };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
