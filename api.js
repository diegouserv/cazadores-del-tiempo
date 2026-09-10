(function () {
  'use strict';
  var config = window.CAZADORES_CONFIG;
  window.Cazadores = {
    categories: [
      { id: 'procesos_manuales', title: 'Procesos manuales', text: 'Copiar y pegar, consolidaciones, transcripciones.', color: '#805186' },
      { id: 'demasiados_pasos', title: 'Demasiados pasos', text: 'Revisiones, aprobaciones, controles repetidos.', color: '#4e7d20' },
      { id: 'informacion_dispersa', title: 'Información dispersa', text: 'Archivos, correos, bases y versiones diferentes.', color: '#a47b08' },
      { id: 'esperas_coordinacion', title: 'Esperas y coordinación', text: 'Respuestas de otras áreas, firmas y dependencias.', color: '#28668e' }
    ],
    rpc: function (name, data) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('POST', config.url + '/rest/v1/rpc/' + name);
        request.setRequestHeader('apikey', config.key);
        request.setRequestHeader('Content-Type', 'application/json');
        request.timeout = 15000;
        request.onload = function () {
          var body;
          try { body = request.responseText ? JSON.parse(request.responseText) : null; }
          catch (e) { reject(new Error('Respuesta del servicio no reconocida.')); return; }
          if (request.status >= 200 && request.status < 300) resolve(body);
          else {
            var error = new Error(body && body.message && body.message.indexOf('actividad está cerrada') >= 0 ? 'La actividad está cerrada.' : 'No se pudo completar la solicitud.');
            error.status = request.status;
            reject(error);
          }
        };
        request.onerror = request.ontimeout = function () { reject(new Error('No se pudo confirmar el envío. Revisa tu conexión.')); };
        request.send(JSON.stringify(data || {}));
      });
    },
    uuid: function () {
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
      var hex = Array.prototype.map.call(bytes, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      return hex.slice(0,8) + '-' + hex.slice(8,12) + '-' + hex.slice(12,16) + '-' + hex.slice(16,20) + '-' + hex.slice(20);
    }
  };
})();
