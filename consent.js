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
      '#ck-banner{position:fixed;bottom:1.25rem;left:50%;transform:translateX(-50%);',
      'width:calc(100% - 2rem);max-width:680px;background:#111120;border:1px solid #2A2A3A;',
      'border-radius:12px;padding:1.1rem 1.3rem;display:flex;align-items:center;gap:1.25rem;',
      'z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif;',
      'animation:ck-in .3s cubic-bezier(.22,1,.36,1);}',
      '@keyframes ck-in{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
      '#ck-banner p{flex:1;margin:0;font-size:.82rem;line-height:1.55;color:#8A8278;}',
      '#ck-banner p strong{color:#ECEAE4;font-weight:600;}',
      '#ck-banner a{color:#C49A6C;text-decoration:none;}',
      '#ck-banner a:hover{text-decoration:underline;}',
      '#ck-banner .ck-btns{display:flex;gap:.6rem;flex-shrink:0;}',
      '#ck-banner button{min-width:104px;height:40px;padding:0 1rem;border-radius:6px;font:inherit;',
      'font-size:.83rem;font-weight:700;cursor:pointer;transition:opacity .2s,background .2s;}',
      '#ck-banner .ck-no{background:transparent;color:#ECEAE4;border:1px solid #C49A6C;}',
      '#ck-banner .ck-no:hover{background:rgba(196,154,108,.12);}',
      '#ck-banner .ck-si{background:#C49A6C;color:#08080F;border:1px solid #C49A6C;}',
      '#ck-banner .ck-si:hover{opacity:.88;}',
      '@media (max-width:600px){#ck-banner{flex-direction:column;align-items:stretch;gap:.8rem;bottom:.75rem;padding:1rem;}',
      '#ck-banner .ck-btns button{flex:1;}}',
      // Mientras el aviso está abierto, la burbuja del chat se solapa con él.
      '@media (max-width:1100px){body.ck-pendiente #isnl-btn{display:none!important;}}',
      '@media (prefers-reduced-motion:reduce){#ck-banner{animation:none;}}'
    ].join('');
    document.head.appendChild(st);
  }

  function cerrar(banner) {
    document.body.classList.remove('ck-pendiente');
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
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

  function mostrar() {
    if (document.getElementById('ck-banner')) return;
    estilos();
    var b = document.createElement('div');
    b.id = 'ck-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML =
      '<p><strong>¿Aceptas cookies de seguimiento?</strong> Uso HubSpot para saber qué páginas ' +
      'has visto si luego me escribes. Solo se activa si aceptas; la web funciona igual si rechazas. ' +
      '<a href="/cookies">Más información</a></p>' +
      '<div class="ck-btns">' +
      '<button type="button" class="ck-no">Rechazar</button>' +
      '<button type="button" class="ck-si">Aceptar</button>' +
      '</div>';
    b.querySelector('.ck-no').addEventListener('click', function () { decidir('denied', b); });
    b.querySelector('.ck-si').addEventListener('click', function () { decidir('granted', b); });
    document.body.appendChild(b);
    document.body.classList.add('ck-pendiente');
  }

  function iniciar() {
    var d = leer();
    if (d === 'granted') cargarHubSpot();
    else if (d !== 'denied') mostrar();

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
      if (!t) return;
      e.preventDefault();
      mostrar();
    });
  }

  window.ismaelnlaiCookies = { abrir: mostrar };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
