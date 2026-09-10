(function () {
  'use strict';
  var form = document.getElementById('vote-form');
  var toggle = document.getElementById('contact-toggle');
  var contact = document.getElementById('contact-value');
  var consent = document.getElementById('consent');
  var status = document.getElementById('form-status');
  var send = document.getElementById('send');
  var pending = null, busy = false;
  var storageKey = 'cazadores-enviado-v1';
  function success() {
    form.hidden = true;
    document.getElementById('thanks').hidden = false;
    try { window.sessionStorage.setItem(storageKey, 'si'); } catch (e) { /* storage is optional */ }
  }
  try { if (window.sessionStorage.getItem(storageKey) === 'si') success(); } catch (e) { /* storage is optional */ }
  toggle.addEventListener('change', function () {
    document.getElementById('contact-fields').hidden = !toggle.checked;
    contact.required = consent.required = toggle.checked;
    if (!toggle.checked) { contact.value = ''; consent.checked = false; }
  });
  document.getElementById('contact-type').addEventListener('change', function () {
    var phone = this.value === 'telefono';
    document.getElementById('contact-label').textContent = phone ? 'Número de teléfono' : 'Correo o usuario de Teams';
    contact.type = phone ? 'tel' : 'text';
  });
  function lock(value) { Array.prototype.forEach.call(form.querySelectorAll('fieldset'), function (field) { field.disabled = value; }); }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy || form.hidden) return;
    if (!pending) {
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      pending = {
        p_id: window.Cazadores.uuid(),
        p_categoria: data.get('categoria'),
        p_dependencia: data.get('dependencia').trim(),
        p_vinculacion: data.get('vinculacion'),
        p_tiempo_perdido: data.get('tiempo'),
        p_problema: data.get('problema').trim(),
        p_tipo_contacto: toggle.checked ? data.get('tipo_contacto') : null,
        p_contacto: toggle.checked ? contact.value.trim() : null,
        p_autoriza_contacto: toggle.checked && consent.checked
      };
      if (pending.p_dependencia.length < 2 || pending.p_problema.length < 10 || (toggle.checked && pending.p_contacto.length < 3)) {
        pending = null; status.textContent = 'Completa la dependencia, describe el problema con al menos 10 caracteres y revisa el contacto, si lo incluiste.'; return;
      }
    }
    busy = true; lock(true); send.disabled = true;
    status.textContent = 'Enviando tu aporte…'; send.textContent = 'Enviando…';
    window.Cazadores.rpc('cazadores_enviar', pending).then(function () {
      busy = false; pending = null; status.textContent = ''; success();
      document.getElementById('thanks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function (error) {
      busy = false; send.disabled = false;
      if (error.status >= 400 && error.status < 500) {
        pending = null; lock(false); send.textContent = 'Enviar mi aporte';
        status.textContent = error.message + ' Revisa los campos antes de intentarlo de nuevo.';
      } else {
        status.textContent = 'No pudimos confirmar tu aporte. Revisa internet y pulsa «Reintentar envío». Conservamos lo que escribiste; el reintento no duplicará este envío.';
        send.textContent = 'Reintentar envío';
      }
    });
  });
  if (document.modelContext && document.modelContext.registerTool) {
    try {
      var registered = document.modelContext.registerTool({
        name: 'consultar_estado_del_formulario',
        title: 'Consultar estado del aporte',
        description: 'Indica si el formulario está disponible, enviando o confirmado; no devuelve campos personales ni envía votos.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: function () { return { estado: form.hidden ? 'confirmado' : busy ? 'enviando' : pending ? 'pendiente_de_reintento' : 'disponible' }; }
      });
      if (registered && registered.catch) registered.catch(function () {});
    } catch (e) { /* Optional browser feature. */ }
  }
})();
