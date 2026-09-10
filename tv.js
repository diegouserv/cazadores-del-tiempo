(function () {
  'use strict';
  var api = window.Cazadores, names = api.categories;
  var root = document.getElementById('urns'), status = document.getElementById('live-status');
  var baseline = null, latest = null, queue = [], animationTimer = null, pollTimer = null, stopped = false;
  var groups = [], labels = [];
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  names.forEach(function (cat) {
    var section = document.createElement('section'); section.className = 'urn'; section.style.setProperty('--color', cat.color);
    section.innerHTML = '<h3></h3><p></p><svg viewBox="0 0 180 300" role="img"><title></title><path d="M10 10V279Q10 292 23 292H157Q170 292 170 279V10" fill="' + cat.color + '" fill-opacity="0.09" stroke="' + cat.color + '" stroke-width="2"/><g fill="' + cat.color + '"></g></svg><div class="numbers"><strong>—</strong><span>Esperando resultados</span></div>';
    section.querySelector('h3').textContent = cat.title; section.querySelector('p').textContent = cat.text;
    section.querySelector('title').textContent = 'Urna de ' + cat.title;
    groups.push(section.querySelector('g')); labels.push(section.querySelector('.numbers')); root.appendChild(section);
  });
  var formUrl = new URL('index.html', window.location.href).href;
  document.getElementById('form-url').textContent = formUrl.replace(/^https?:\/\//, '');
  try {
    var qr = window.qrcode(0, 'M'); qr.addData(formUrl); qr.make();
    document.getElementById('qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
  } catch (e) { document.getElementById('qr').textContent = 'Abre el enlace que aparece debajo para participar.'; }
  function ball(index, slot, animate) {
    var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    var y = 281 - Math.floor(slot / 8) * 16;
    circle.setAttribute('r','7'); circle.setAttribute('cx',String(21 + slot % 8 * 19.7)); circle.setAttribute('cy',String(y)); groups[index].appendChild(circle);
    if (animate && !reduced && circle.animate) circle.animate([
      { transform: 'translateY(' + (-y - 14) + 'px)' },
      { transform: 'translateY(0)', offset: .65 },
      { transform: 'translateY(-22px)', offset: .8 },
      { transform: 'translateY(0)', offset: .94 },
      { transform: 'translateY(-4px)', offset: .97 },
      { transform: 'translateY(0)' }
    ], { duration: 1000, easing: 'ease-in' });
  }
  function reconcile() {
    if (!latest) return;
    groups.forEach(function (group, i) { while(group.firstChild) group.removeChild(group.firstChild); for(var n=0;n<Math.min(latest[i],128);n++) ball(i,n,false); });
  }
  function drain() {
    if (stopped || animationTimer !== null || !queue.length) return;
    var index = queue.shift(), group = groups[index];
    if(group.children.length >= 128) group.removeChild(group.lastChild);
    ball(index, group.children.length, true);
    animationTimer = window.setTimeout(function () { animationTimer = null; if(queue.length) drain(); else reconcile(); }, 1050);
  }
  function apply(rows) {
    if (!Array.isArray(rows) || rows.length !== 4) throw new Error('Conteos incompletos');
    var counts = names.map(function (cat) {
      var match = rows.filter(function (r) { return r.categoria === cat.id; });
      if(match.length !== 1 || !Number.isSafeInteger(Number(match[0].votos)) || Number(match[0].votos)<0) throw new Error('Conteo inválido');
      return Number(match[0].votos);
    });
    var sum = counts.reduce(function(a,b){return a+b;},0); latest = counts;
    document.getElementById('total').textContent = String(sum);
    labels.forEach(function (label,i) {label.querySelector('strong').textContent=String(counts[i]);label.querySelector('span').textContent=(sum?Math.round(100*counts[i]/sum):0)+'% de los votos';});
    if (!baseline || counts.some(function(n,i){return n<baseline[i];})) {
      queue=[];window.clearTimeout(animationTimer);animationTimer=null;reconcile();
    } else {
      counts.forEach(function(n,i){for(var j=baseline[i];j<n;j++) {if(queue.length<500) queue.push(i);}});
    }
    baseline=counts;drain();
  }
  function poll() {
    api.rpc('cazadores_totales',{}).then(function(rows){
      if(stopped)return;apply(rows);status.className='';status.textContent='Actualizado · '+new Date().toLocaleTimeString('es-CO');
    }).catch(function(){if(!stopped){status.className='error';status.textContent='Reconectando… conservamos los últimos resultados';}}).then(function(){if(!stopped)pollTimer=window.setTimeout(poll,window.CAZADORES_CONFIG.pollMilliseconds);});
  }
  poll();
  window.addEventListener('pagehide',function(){stopped=true;window.clearTimeout(pollTimer);window.clearTimeout(animationTimer);});
  window.addEventListener('pageshow',function(event){if(event.persisted){stopped=false;animationTimer=null;queue=[];reconcile();poll();}});
})();
