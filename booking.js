/* Reserva con Calendly — ismaelnlai.com
 *
 * Cada enlace de reserva es un <a href="https://calendly.com/..." data-calendly>:
 * sin JS, o con Ctrl/Cmd+clic, abre la página de Calendly sin más. Con JS se
 * intenta la ventana emergente; sus scripts (y cookies) solo se cargan al pulsar.
 * Si no cargan, aparece un aviso con el enlace directo y el foco va a él: nada de
 * window.open() diferido, que el navegador puede bloquear.
 *
 * El chat (chat-widget.js) usa window.ismaelnlaiBooking.open() si existe.
 */
(function () {
  'use strict';

  var booking = window.ismaelnlaiBooking = window.ismaelnlaiBooking || {};
  booking.url = booking.url || 'https://calendly.com/ismaelnlai/diagnostico';
  booking.scriptSrc = booking.scriptSrc || 'https://assets.calendly.com/assets/external/widget.js';
  booking.cssHref = booking.cssHref || 'https://assets.calendly.com/assets/external/widget.css';
  booking.timeoutMs = booking.timeoutMs || 6000;

  var estado = 'idle', esperando = [], toast = null, toastLink = null, ultimoDisparador = null;

  function crearToast() {
    if (toast) return;
    var st = document.createElement('style');
    st.textContent = [
      '#bookingToast{position:fixed;left:50%;bottom:1.2rem;transform:translateX(-50%);z-index:10001;',
      'width:calc(100% - 2rem);max-width:520px;background:#12121F;border:1px solid #C49A6C;border-radius:12px;',
      'padding:1rem 2.8rem 1rem 1.2rem;font:0.92rem/1.5 Inter,system-ui,sans-serif;color:#ECEAE4;',
      'box-shadow:0 10px 40px rgba(0,0,0,.6);}',
      '#bookingToast[hidden]{display:none;}',
      '#bookingToast a{color:#D9B48A;}',
      '#bookingToast button{position:absolute;top:.5rem;right:.5rem;width:32px;height:32px;border:none;',
      'border-radius:6px;background:transparent;color:#ADA59A;font-size:1.2rem;cursor:pointer;}',
      '#bookingToast a:focus-visible,#bookingToast button:focus-visible{outline:2px solid #C49A6C;outline-offset:2px;}'
    ].join('');
    document.head.appendChild(st);

    toast = document.createElement('div');
    toast.id = 'bookingToast';
    toast.setAttribute('role', 'alert');
    toast.hidden = true;
    var span = document.createElement('span');
    span.appendChild(document.createTextNode('No se ha podido abrir el calendario aquí. '));
    toastLink = document.createElement('a');
    toastLink.id = 'bookingToastLink';
    toastLink.target = '_blank';
    toastLink.rel = 'noopener';
    toastLink.textContent = 'Ábrelo en una pestaña nueva';
    span.appendChild(toastLink);
    span.appendChild(document.createTextNode(' o escríbeme a '));
    var mail = document.createElement('a');
    mail.href = 'mailto:ismael@ismaelnlai.com';
    mail.textContent = 'ismael@ismaelnlai.com';
    span.appendChild(mail);
    span.appendChild(document.createTextNode('.'));
    var cerrarBtn = document.createElement('button');
    cerrarBtn.type = 'button';
    cerrarBtn.setAttribute('aria-label', 'Cerrar aviso');
    cerrarBtn.textContent = '×';
    cerrarBtn.addEventListener('click', cerrarToast);
    toast.appendChild(span);
    toast.appendChild(cerrarBtn);
    toast.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarToast(); });
    document.body.appendChild(toast);
  }

  function mostrarFallo(url) {
    crearToast();
    toastLink.href = url;
    toast.hidden = false;
    toastLink.focus();
  }
  function cerrarToast() {
    if (!toast) return;
    toast.hidden = true;
    if (ultimoDisparador && document.contains(ultimoDisparador)) ultimoDisparador.focus();
  }

  function cargarCalendly(ok, ko) {
    if (window.Calendly) { ok(); return; }
    esperando.push([ok, ko]);
    if (estado === 'loading') return;
    estado = 'loading';
    function resolver(bien) {
      if (estado !== 'loading') return;
      estado = bien ? 'ready' : 'idle';  // si falla, se puede reintentar en el siguiente clic
      var cola = esperando; esperando = [];
      cola.forEach(function (p) { (bien ? p[0] : p[1])(); });
    }
    var reloj = setTimeout(function () { resolver(false); }, booking.timeoutMs);
    if (!document.querySelector('link[href="' + booking.cssHref + '"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = booking.cssHref;
      document.head.appendChild(l);
    }
    var sc = document.createElement('script');
    sc.src = booking.scriptSrc;
    sc.onload = function () { clearTimeout(reloj); resolver(!!window.Calendly); };
    sc.onerror = function () { clearTimeout(reloj); resolver(false); };
    document.head.appendChild(sc);
  }

  booking.open = function (url, disparador) {
    url = url || booking.url;
    ultimoDisparador = disparador || document.activeElement;
    if (toast) toast.hidden = true;
    cargarCalendly(
      function () {
        try { window.Calendly.initPopupWidget({ url: url }); }
        catch (e) { mostrarFallo(url); }
      },
      function () { mostrarFallo(url); }
    );
  };

  // Compatibilidad con botones antiguos que llamen a abrirCalendly()
  if (!window.abrirCalendly) window.abrirCalendly = function () { booking.open(booking.url); };

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-calendly]') : null;
    if (!a || e.defaultPrevented) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    booking.open(a.href, a);
  });
})();
