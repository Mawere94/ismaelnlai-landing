/* Consentimiento de cookies — ismaelnlai.com
 *
 * HubSpot instala cookies de seguimiento (__hstc, hubspotutk, __hssc, __hssrc),
 * así que su script solo se carga si el visitante pulsa "Aceptar". Rechazar
 * está al mismo nivel que aceptar, como pide la guía de cookies de la AEPD.
 *
 * La decisión se guarda en localStorage ('cookieConsent' = 'granted' | 'denied').
 * El aviso antiguo guardaba 'cookieAccepted', pero decía que no había cookies
 * analíticas: ese "Entendido" no vale como consentimiento y se vuelve a preguntar.
 *
 * Cualquier enlace con [data-cookie-settings] vuelve a abrir el aviso.
 */
(function () {
  'use strict';

  var KEY = 'cookieConsent';
  var HUBSPOT_SRC = 'https://js-eu1.hs-scripts.com/148587751.js';

  // localStorage lanza (no devuelve null) si el navegador bloquea el almacenamiento.
  function leer() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function escribir(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function cargarHubSpot() {
    if (document.getElementById('hs-script-loader')) return;
    var s = document.createElement('script');
    s.id = 'hs-script-loader';
    s.async = true;
    s.defer = true;
    s.src = HUBSPOT_SRC;
    document.body.appendChild(s);
  }

  // Si retira un consentimiento dado antes, borramos lo que HubSpot ya dejó.
  function borrarCookiesHubSpot() {
    ['__hstc', 'hubspotutk', '__hssc', '__hssrc', 'messagesUtk'].forEach(function (n) {
      ['', '; domain=.ismaelnlai.com', '; domain=ismaelnlai.com'].forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function estilos() {
    if (document.getElementById('ck-styles')) return;
    var st = document.createElement('style');
    st.id = 'ck-styles';
    st.textContent = [
      // Escritorio: tarjeta compacta abajo a la derecha, lejos del CTA principal
      // (que va a la izquierda en todas las páginas). Móvil: ancho completo abajo.
      '#ck-banner{position:fixed;bottom:1.25rem;right:1.25rem;width:calc(100% - 2.5rem);max-width:400px;',
      'background:#12121F;border:1px solid #3A3A52;border-radius:12px;padding:1rem 1.1rem;',
      'z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,.55);font-family:Inter,system-ui,sans-serif;',
      'animation:ck-in .25s cubic-bezier(.22,1,.36,1);}',
      '@keyframes ck-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
      '#ck-banner p{margin:0 0 .8rem;font-size:.84rem;line-height:1.5;color:#ADA59A;}',
      '#ck-banner p strong{display:block;color:#ECEAE4;font-weight:600;margin-bottom:.15rem;}',
      '#ck-banner .ck-estado{font-size:.8rem;color:#ECEAE4;margin:-.3rem 0 .8rem;}',
      '#ck-banner a{color:#C49A6C;}',
      '#ck-banner .ck-btns{display:flex;gap:.6rem;}',
      '#ck-banner button{flex:1;min-height:42px;padding:0 1rem;border-radius:8px;font:inherit;',
      'font-size:.86rem;font-weight:700;cursor:pointer;}',
      '#ck-banner button:focus-visible{outline:2px solid #ECEAE4;outline-offset:2px;}',
      '#ck-banner .ck-no{background:transparent;color:#ECEAE4;border:1px solid #C49A6C;}',
      '#ck-banner .ck-no:hover{background:rgba(196,154,108,.12);}',
      '#ck-banner .ck-si{background:#C49A6C;color:#08080F;border:1px solid #C49A6C;}',
      '#ck-banner .ck-si:hover{background:#D2AA7E;}',
      '@media (max-width:600px){#ck-banner{left:.75rem;right:.75rem;bottom:.75rem;width:auto;max-width:none;padding:.9rem 1rem;}}',
      // Mientras el aviso está abierto, la burbuja del chat se quitaría de en medio:
      // ocupan la misma esquina.
      'body.ck-pendiente #isnl-btn{display:none!important;}',
      '@media (prefers-reduced-motion:reduce){#ck-banner{animation:none;}}'
    ].join('');
    document.head.appendChild(st);
  }

  var disparador = null;

  function cerrar(banner) {
    document.body.classList.remove('ck-pendiente');
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    if (disparador && document.contains(disparador)) disparador.focus();
    disparador = null;
  }

  function decidir(valor, banner) {
    var antes = leer();
    escribir(valor);
    cerrar(banner);
    if (valor === 'granted') {
      cargarHubSpot();
    } else if (antes === 'granted') {
      // El script ya está en memoria: borramos sus cookies y recargamos sin él.
      borrarCookiesHubSpot();
      location.reload();
    }
  }

  // reabierto = lo pide el visitante desde "Configurar cookies": movemos el foco
  // al aviso y le decimos qué eligió antes.
  function mostrar(reabierto) {
    var existente = document.getElementById('ck-banner');
    if (existente) { if (reabierto) existente.querySelector('button').focus(); return; }
    estilos();
    var actual = leer();
    var b = document.createElement('div');
    b.id = 'ck-banner';
    // Región, no diálogo: no bloquea la página ni atrapa el foco.
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML =
      '<p><strong>¿Aceptas cookies de seguimiento?</strong>Uso HubSpot para saber qué páginas ' +
      'has visto si luego me escribes. Solo se activa si aceptas; la web funciona igual si rechazas. ' +
      '<a href="/cookies">Más información</a></p>' +
      (actual === 'granted' || actual === 'denied'
        ? '<p class="ck-estado">Ahora mismo: ' + (actual === 'granted' ? 'aceptadas' : 'rechazadas') + '.</p>'
        : '') +
      '<div class="ck-btns">' +
      '<button type="button" class="ck-no">Rechazar</button>' +
      '<button type="button" class="ck-si">Aceptar</button>' +
      '</div>';
    b.querySelector('.ck-no').addEventListener('click', function () { decidir('denied', b); });
    b.querySelector('.ck-si').addEventListener('click', function () { decidir('granted', b); });
    b.addEventListener('keydown', function (e) {
      // Escape cierra solo si ya había una decisión guardada; si no, el aviso se queda.
      if (e.key === 'Escape' && (leer() === 'granted' || leer() === 'denied')) cerrar(b);
    });
    document.body.appendChild(b);
    document.body.classList.add('ck-pendiente');
    if (reabierto) b.querySelector('.ck-no').focus();
  }

  function iniciar() {
    var d = leer();
    if (d === 'granted') cargarHubSpot();
    else if (d !== 'denied') mostrar();

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
      if (!t) return;
      e.preventDefault();
      disparador = t;
      mostrar(true);
    });
  }

  window.ismaelnlaiCookies = { abrir: function () { mostrar(true); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
