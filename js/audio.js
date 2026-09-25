/* Motor de audio (Web Audio API): síntesis de cada instrumento + sampler para sonidos propios. */
(function () {
  const { mtof, notasAcorde, parseAcorde } = window.G;

  const Motor = {
    ctx: null,
    init() {
      if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.ctx = ctx;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14; this.comp.ratio.value = 4;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(this.comp).connect(ctx.destination);
      // Reverb por convolución con respuesta generada
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.respuestaReverb(3.5, 2.2);
      this.reverbOut = ctx.createGain(); this.reverbOut.gain.value = 0.8;
      this.reverb.connect(this.reverbOut).connect(this.master);
      // Ruido blanco reutilizable
      const n = ctx.sampleRate * 2;
      this.ruido = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      // Analizador para visuales
      this.analizador = ctx.createAnalyser(); this.analizador.fftSize = 256;
      this.comp.connect(this.analizador);
    },
    get t() { return this.ctx.currentTime; },
    respuestaReverb(seg, caida) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seg);
      const b = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, caida);
      }
      return b;
    },
    // Crea salida de instrumento: entrada → volumen → master + envío a reverb
    salida(vol = 0.7, rev = 0.3) {
      const ctx = this.ctx;
      const entrada = ctx.createGain();
      const volumen = ctx.createGain(); volumen.gain.value = vol;
      const envio = ctx.createGain(); envio.gain.value = rev;
      entrada.connect(volumen); volumen.connect(this.master); volumen.connect(envio); envio.connect(this.reverb);
      return { entrada, volumen, envio };
    },
    fuente(tipo, freq) { const o = this.ctx.createOscillator(); o.type = tipo; o.frequency.value = freq; return o; },
    fuenteRuido() { const s = this.ctx.createBufferSource(); s.buffer = this.ruido; s.loop = true; return s; },
    distorsion(cant) {
      const ws = this.ctx.createWaveShaper(); const k = cant * 100 + 1; const n = 2048; const c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
      ws.curve = c; ws.oversample = "2x"; return ws;
    },
    // Distorsión con mezcla seco/mojado: entrada → (seco | saturador) → salida. mezcla(0..1)
    bloqueDistorsion(dureza = 40) {
      const ctx = this.ctx, ent = ctx.createGain(), sal = ctx.createGain();
      const seco = ctx.createGain(), moj = ctx.createGain(), ws = ctx.createWaveShaper();
      const n = 2048, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(dureza * x) / Math.tanh(dureza); }
      ws.curve = c; ws.oversample = "2x";
      const pre = ctx.createBiquadFilter(); pre.type = "highpass"; pre.frequency.value = 80;
      ent.connect(seco).connect(sal); ent.connect(pre).connect(ws).connect(moj).connect(sal);
      seco.gain.value = 1; moj.gain.value = 0;
      return { ent, sal, mezcla(v, t = Motor.t) { seco.gain.setTargetAtTime(1 - v * 0.85, t, 0.05); moj.gain.setTargetAtTime(v * 0.35, t, 0.05); } };
    },
    async decodificar(arrayBuffer) { this.init(); return await this.ctx.decodeAudioData(arrayBuffer); },
    async cargarArchivo(file) { return this.decodificar(await file.arrayBuffer()); },
    async cargarURL(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + " → " + r.status); return this.decodificar(await r.arrayBuffer()); },
    // Reproduce un buffer (sonido propio) con altura relativa a la nota base
    tocarBuffer(buffer, destino, { midi = 60, base = 60, vel = 1, t = this.t, loop = false } = {}) {
      const s = this.ctx.createBufferSource(); s.buffer = buffer; s.loop = loop;
      s.playbackRate.value = Math.pow(2, (midi - base) / 12);
      const g = this.ctx.createGain(); g.gain.value = vel;
      s.connect(g).connect(destino); s.start(t);
      return { fuente: s, gan: g };
    },
    // Envolvente: ataque y sostenido; devuelve función de liberación
    envolvente(g, t, ataque, nivel) {
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(nivel, t + ataque);
    },
    soltar(g, t, rel, fuentes) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + rel);
      fuentes.forEach(f => { try { f.stop(t + rel + 0.05); } catch (e) {} });
    },
  };

  /* ---------------------------------------------------------------- GUITARRA */
  class Guitarra {
    constructor() {
      const M = Motor, ctx = M.ctx;
      this.p = { fuzz: 0.4, tono: 0.55, reverb: 0.45, vol: 0.6, sostener: false };
      this.out = M.salida(this.p.vol, this.p.reverb);
      this.pre = ctx.createGain(); this.pre.gain.value = 1;
      this.ws = M.distorsion(this.p.fuzz);
      this.filtro = ctx.createBiquadFilter(); this.filtro.type = "lowpass";
      this.pre.connect(this.ws).connect(this.filtro).connect(this.out.entrada);
      this.voces = []; this.buffer = null; this.base = 60; this.porAcorde = {};
      this.aplicar();
    }
    aplicar() {
      const M = Motor;
      const nuevo = M.distorsion(this.p.fuzz);
      this.pre.disconnect(); this.ws.disconnect();
      this.pre.connect(nuevo).connect(this.filtro); this.ws = nuevo;
      this.filtro.frequency.setTargetAtTime(400 + Math.pow(this.p.tono, 2) * 7000, M.t, 0.05);
      this.out.volumen.gain.setTargetAtTime(this.p.vol * (1 - this.p.fuzz * 0.45), M.t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb * 1.2, M.t, 0.05);
    }
    voicing(acorde) {
      const a = parseAcorde(acorde); if (!a) return [];
      const raiz = 40 + ((a.raiz - 4 + 12) % 12); // desde E2
      const notas = [raiz, raiz + 7, raiz + 12];
      a.intervalos.slice(1).forEach(i => notas.push(raiz + 12 + i));
      return [...new Set(notas)].sort((x, y) => x - y).slice(0, 6);
    }
    rasguear(acorde, arriba = false) {
      const M = Motor, t0 = M.t;
      this.apagar(0.06);
      let notas = this.voicing(acorde); if (arriba) notas = notas.slice().reverse();
      const rel = this.p.sostener ? 9 : 2.2;
      // Sonidos propios: un acorde grabado se toca una vez (transpuesto a la raíz si no hay uno para ese acorde)
      const propio = this.porAcorde[acorde] || (this.buffer ? { buffer: this.buffer, base: this.base, transponer: true } : null);
      if (propio) {
        const g = M.ctx.createGain(); g.connect(this.pre);
        const raiz = Math.min(...this.voicing(acorde));
        const b = M.tocarBuffer(propio.buffer, g, { midi: propio.transponer ? raiz : propio.base, base: propio.base, t: t0 });
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01);
        if (this.p.sostener) b.fuente.loop = true;
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (this.p.sostener ? rel : propio.buffer.duration + 0.3));
        b.fuente.stop(t0 + rel + 0.1);
        this.voces.push({ g, fuentes: [b.fuente] });
        return;
      }
      notas.forEach((m, i) => {
        const t = t0 + i * 0.018;
        const g = M.ctx.createGain(); g.connect(this.pre);
        let fuentes;
        {
          const o1 = M.fuente("sawtooth", mtof(m)), o2 = M.fuente("sawtooth", mtof(m) * 1.004), o3 = M.fuente("square", mtof(m) * 0.5);
          const g3 = M.ctx.createGain(); g3.gain.value = 0.3;
          o1.connect(g); o2.connect(g); o3.connect(g3).connect(g);
          fuentes = [o1, o2, o3]; fuentes.forEach(o => o.start(t));
        }
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + rel);
        fuentes.forEach(f => f.stop(t + rel + 0.1));
        this.voces.push({ g, fuentes });
      });
    }
    apagar(rel = 0.15) {
      const t = Motor.t;
      this.voces.forEach(v => Motor.soltar(v.g, t, rel, v.fuentes));
      this.voces = [];
    }
  }

  /* ---------------------------------------------------------------- BATERÍA */
  const PADS = [
    { id: "bombo", nombre: "Bombo", tecla: "a" },
    { id: "caja", nombre: "Caja", tecla: "s" },
    { id: "hihat", nombre: "Hi-hat", tecla: "d" },
    { id: "abierto", nombre: "Hi-hat abierto", tecla: "f" },
    { id: "tom", nombre: "Tom", tecla: "g" },
    { id: "crash", nombre: "Crash", tecla: "h" },
  ];
  // 16 pasos por compás (semicorcheas en 4/4)
  const PATRONES = {
    pulso:        { tom: "x...x...x...x..." },                                         // "Ritmo batería" de la intro
    sinplatillos: { bombo: "x.....x.x.......", caja: "....x.......x..." },
    platillos:    { bombo: "x.....x.x.......", caja: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", crash: "x..............." },
    muro:         { bombo: "x.x.x.x.x.x.x.x.", caja: "....x.......x...", hihat: "xxxxxxxxxxxxxxxx", crash: "x.......x......." },
  };
  class Bateria {
    constructor() {
      this.p = { vol: 0.8, reverb: 0.2, patron: null };
      this.out = Motor.salida(this.p.vol, this.p.reverb);
      this.samples = {};
      this.alGolpe = null;
    }
    aplicar() {
      this.out.volumen.gain.setTargetAtTime(this.p.vol, Motor.t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb, Motor.t, 0.05);
    }
    tocar(pad, t = Motor.t, vel = 1) {
      const M = Motor, ctx = M.ctx, dst = this.out.entrada;
      if (this.alGolpe) { const retraso = Math.max(0, (t - M.t) * 1000); setTimeout(() => this.alGolpe(pad), retraso); }
      if (this.samples[pad]) { M.tocarBuffer(this.samples[pad], dst, { vel, t }); return; }
      const g = ctx.createGain(); g.connect(dst);
      const env = (nivel, dur) => { g.gain.setValueAtTime(nivel * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
      if (pad === "bombo") {
        const o = M.fuente("sine", 150); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
        const ws = M.distorsion(0.3); o.connect(ws).connect(g); env(1, 0.45); o.start(t); o.stop(t + 0.5);
      } else if (pad === "caja") {
        const n = M.fuenteRuido(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
        const o = M.fuente("triangle", 190); const go = ctx.createGain(); go.gain.value = 0.5;
        n.connect(hp).connect(g); o.connect(go).connect(g); env(0.7, 0.22); n.start(t); o.start(t); n.stop(t + 0.3); o.stop(t + 0.3);
      } else if (pad === "hihat" || pad === "abierto") {
        const n = M.fuenteRuido(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7500;
        n.connect(hp).connect(g); const d = pad === "hihat" ? 0.05 : 0.35; env(0.35, d); n.start(t); n.stop(t + d + 0.05);
      } else if (pad === "tom") {
        const o = M.fuente("sine", 140); o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
        o.connect(g); env(0.8, 0.5); o.start(t); o.stop(t + 0.55);
      } else if (pad === "crash") {
        const n = M.fuenteRuido(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4500;
        const bp = ctx.createBiquadFilter(); bp.type = "peaking"; bp.frequency.value = 6500; bp.gain.value = 8;
        n.connect(hp).connect(bp).connect(g); env(0.4, 1.8); n.start(t); n.stop(t + 1.9);
      }
    }
  }

  /* ---------------------------------------------------------------- TECLADO */
  class Teclado {
    constructor(preset) {
      this.preset = preset;
      const def = { pad: [0.5, 0.45, 0.5], epiano: [0.7, 0.55, 0.35], bajo: [0.35, 0.6, 0.1], lead: [0.6, 0.45, 0.35] }[preset] || [0.5, 0.5, 0.3];
      this.p = { filtro: def[0], vol: def[1], reverb: def[2], dist: 0, octava: preset === "bajo" ? 2 : preset === "lead" ? 4 : 3 };
      this.out = Motor.salida(this.p.vol, this.p.reverb);
      this.filtro = Motor.ctx.createBiquadFilter(); this.filtro.type = "lowpass"; this.filtro.Q.value = preset === "bajo" ? 4 : 1;
      this.dist = Motor.bloqueDistorsion(30);
      this.filtro.connect(this.dist.ent); this.dist.sal.connect(this.out.entrada);
      this.activas = new Map(); this.buffer = null; this.base = 60;
      this.mono = null; // para lead
      this.aplicar();
    }
    aplicar() {
      const t = Motor.t;
      this.filtro.frequency.setTargetAtTime(150 + Math.pow(this.p.filtro, 2) * 9000, t, 0.05);
      this.dist.mezcla(this.p.dist, t);
      this.out.volumen.gain.setTargetAtTime(this.p.vol, t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb, t, 0.05);
    }
    on(m, vel = 0.8) {
      const M = Motor, ctx = M.ctx, t = M.t;
      if (this.activas.has(m)) this.off(m);
      if (this.preset === "lead" && !this.buffer) return this.leadOn(m, vel);
      const g = ctx.createGain(); g.connect(this.filtro);
      let fuentes = [], ataque = 0.01, nivel = 0.25 * vel, rel = 0.4;
      if (this.buffer) {
        fuentes = [M.tocarBuffer(this.buffer, g, { midi: m, base: this.base, t }).fuente]; nivel = vel; rel = 0.5;
      } else if (this.preset === "pad") {
        [-0.12, 0, 0.12].forEach(d => { const o = M.fuente("sawtooth", mtof(m + d)); o.connect(g); fuentes.push(o); });
        const o = M.fuente("sine", mtof(m - 12)); o.connect(g); fuentes.push(o);
        ataque = 0.6; nivel = 0.09 * vel; rel = 2.2;
      } else if (this.preset === "epiano") {
        const car = M.fuente("sine", mtof(m)); const mod = M.fuente("sine", mtof(m) * 14);
        const gm = ctx.createGain(); gm.gain.setValueAtTime(mtof(m) * 1.8, t); gm.gain.exponentialRampToValueAtTime(1, t + 1.2);
        mod.connect(gm).connect(car.frequency); car.connect(g); fuentes = [car, mod];
        ataque = 0.005; nivel = 0.3 * vel; rel = 1.2;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(nivel, t + ataque);
        g.gain.exponentialRampToValueAtTime(nivel * 0.25, t + 2.5);
        fuentes.forEach(f => f.start(t));
        this.activas.set(m, { g, fuentes, rel }); return;
      } else if (this.preset === "bajo") {
        const o1 = M.fuente("sawtooth", mtof(m)); const o2 = M.fuente("sine", mtof(m - 12));
        const g2 = ctx.createGain(); g2.gain.value = 0.9; o1.connect(g); o2.connect(g2).connect(g); fuentes = [o1, o2];
        ataque = 0.005; nivel = 0.3 * vel; rel = 0.25;
      }
      M.envolvente(g, t, ataque, nivel);
      fuentes.forEach(f => { if (f.start && !this.buffer) f.start(t); });
      this.activas.set(m, { g, fuentes, rel });
    }
    off(m) {
      if (this.preset === "lead" && !this.buffer) return this.leadOff(m);
      const v = this.activas.get(m); if (!v) return;
      Motor.soltar(v.g, Motor.t, v.rel, v.fuentes); this.activas.delete(m);
    }
    leadOn(m, vel) {
      const M = Motor, ctx = M.ctx, t = M.t;
      if (!this.mono) {
        const o = M.fuente("sawtooth", mtof(m)); const o2 = M.fuente("triangle", mtof(m) * 2);
        const vib = M.fuente("sine", 5.5); const gv = ctx.createGain(); gv.gain.value = 4;
        vib.connect(gv); gv.connect(o.frequency); gv.connect(o2.frequency);
        const g = ctx.createGain(); const g2 = ctx.createGain(); g2.gain.value = 0.3;
        o.connect(g); o2.connect(g2).connect(g); g.connect(this.filtro);
        M.envolvente(g, t, 0.04, 0.16 * vel); [o, o2, vib].forEach(f => f.start(t));
        this.mono = { o, o2, g, fuentes: [o, o2, vib], pila: [m] };
      } else {
        this.mono.pila.push(m);
        this.mono.o.frequency.setTargetAtTime(mtof(m), t, 0.04);
        this.mono.o2.frequency.setTargetAtTime(mtof(m) * 2, t, 0.04);
      }
    }
    leadOff(m) {
      if (!this.mono) return;
      this.mono.pila = this.mono.pila.filter(x => x !== m);
      if (this.mono.pila.length) {
        const u = this.mono.pila[this.mono.pila.length - 1];
        this.mono.o.frequency.setTargetAtTime(mtof(u), Motor.t, 0.04);
        this.mono.o2.frequency.setTargetAtTime(mtof(u) * 2, Motor.t, 0.04);
      } else { Motor.soltar(this.mono.g, Motor.t, 0.35, this.mono.fuentes); this.mono = null; }
    }
    todoOff() { [...this.activas.keys()].forEach(m => this.off(m)); if (this.mono) { this.mono.pila = []; this.leadOff(-1); } }
  }

  /* ---------------------------------------------------------------- AMBIENTE */
  class Ambiente {
    constructor(preset) {
      this.preset = preset;
      this.p = { vol: 0.5, reverb: 0.7, x: preset === "brillo" ? 0.7 : 0.4, y: 0.5 };
      this.out = Motor.salida(this.p.vol, this.p.reverb);
      this.filtro = Motor.ctx.createBiquadFilter(); this.filtro.type = preset === "viento" ? "bandpass" : "lowpass";
      this.nivel = Motor.ctx.createGain(); this.nivel.gain.value = 0;
      this.dist = Motor.bloqueDistorsion(25);
      this.filtro.connect(this.dist.ent); this.dist.sal.connect(this.nivel); this.nivel.connect(this.out.entrada);
      // Eco para "pulso"
      if (preset === "pulso") {
        const ctx = Motor.ctx; this.eco = ctx.createDelay(2); const fb = ctx.createGain(); fb.gain.value = 0.45;
        this.eco.delayTime.value = (60 / window.G.P.bpm) * 0.75;
        this.nivel.connect(this.eco); this.eco.connect(fb).connect(this.eco); this.eco.connect(this.out.entrada);
      }
      this.fuentes = []; this.oscs = []; this.encendido = false; this.acorde = null; this.buffer = null; this.base = 48;
      this.timer = null;
      this.aplicar();
    }
    aplicar() {
      const t = Motor.t, { x, y } = this.p;
      const f = this.buffer ? 400 + x * x * 19000 : this.preset === "viento" ? 200 + x * x * 5000 : 200 + x * x * 8000;
      this.filtro.frequency.setTargetAtTime(f, t, 0.1);
      this.dist.mezcla(x * x, t);
      if (this.preset === "viento" && !this.buffer) this.filtro.Q.value = 2 + (1 - y) * 6;
      this.nivel.gain.setTargetAtTime(this.encendido ? y : 0, t, 0.3);
      this.out.volumen.gain.setTargetAtTime(this.p.vol, t, 0.1);
      this.out.envio.gain.setTargetAtTime(this.p.reverb * 1.3, t, 0.1);
    }
    encender() {
      if (this.encendido) return; this.encendido = true;
      const M = Motor, ctx = M.ctx, t = M.t;
      this.filtro.type = this.buffer ? "lowpass" : (this.preset === "viento" ? "bandpass" : "lowpass");
      if (this.buffer) this.filtro.Q.value = 0.7;
      if (this.buffer) {
        const b = M.tocarBuffer(this.buffer, this.filtro, { midi: this.raizMidi(), base: this.base, loop: true });
        this.fuentes = [b.fuente]; this.loop = b.fuente;
      } else if (this.preset === "viento") {
        const n = M.fuenteRuido(); const lfo = M.fuente("sine", 0.07); const gl = ctx.createGain(); gl.gain.value = 600;
        lfo.connect(gl).connect(this.filtro.frequency); n.connect(this.filtro); n.start(t); lfo.start(t); this.fuentes = [n, lfo];
      } else if (this.preset === "drone") {
        this.oscs = [0, 7, 12, -12].map((iv, i) => {
          const o = M.fuente(i === 3 ? "sine" : "sawtooth", 110); const g = ctx.createGain(); g.gain.value = i === 3 ? 0.25 : 0.08;
          o.detune.value = (i - 1.5) * 6; o.connect(g).connect(this.filtro); o.start(t); o._iv = iv; return o;
        });
        this.fuentes = this.oscs.slice();
      } else if (this.preset === "brillo") {
        this.oscs = [0, 1, 2, 3].map(i => {
          const o = M.fuente("sine", 880); const g = ctx.createGain(); g.gain.value = 0;
          const lfo = M.fuente("sine", 0.1 + Math.random() * 0.3); const gl = ctx.createGain(); gl.gain.value = 0.05;
          const off = ctx.createConstantSource ? ctx.createConstantSource() : null;
          lfo.connect(gl).connect(g.gain); if (off) { off.offset.value = 0.05; off.connect(g.gain); off.start(t); this.fuentes.push(off); }
          o.connect(g).connect(this.filtro); o.start(t); lfo.start(t); this.fuentes.push(o, lfo); o._i = i; return o;
        });
      } else if (this.preset === "pulso") {
        const paso = 60 / window.G.P.bpm / 2; let k = 0;
        this.timer = setInterval(() => {
          const notas = notasAcorde(this.acorde || "C", 4); if (!notas.length) return;
          const m = notas[k++ % notas.length] + (k % 8 >= 4 ? 12 : 0);
          const tt = M.t + 0.02; const o = M.fuente("sine", mtof(m)); const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.6, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.6);
          o.connect(g).connect(this.filtro); o.start(tt); o.stop(tt + 0.7);
        }, paso * 1000);
      }
      this.afinar(this.acorde, 0.01);
      this.aplicar();
    }
    apagar() {
      if (!this.encendido) return; this.encendido = false; this.aplicar();
      const fs = this.fuentes; const t = Motor.t;
      fs.forEach(f => { try { f.stop(t + 1.5); } catch (e) {} });
      this.fuentes = []; this.oscs = []; this.loop = null;
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
    raizMidi() { const a = parseAcorde(this.acorde || "C"); return 48 + (a ? a.raiz : 0); }
    afinar(acorde, tau = 0.8) {
      this.acorde = acorde || this.acorde;
      if (!this.encendido || !this.acorde) return;
      const t = Motor.t;
      if (this.loop) { this.loop.playbackRate.setTargetAtTime(Math.pow(2, (this.raizMidi() - this.base) / 12), t, tau); return; }
      if (this.preset === "drone") {
        const r = this.raizMidi() - 12;
        this.oscs.forEach(o => o.frequency.setTargetAtTime(mtof(r + o._iv), t, tau));
      } else if (this.preset === "brillo") {
        const notas = notasAcorde(this.acorde, 6);
        this.oscs.forEach(o => o.frequency.setTargetAtTime(mtof(notas[o._i % notas.length] + (o._i >= notas.length ? 12 : 0)), t, tau));
      }
    }
    destello() {
      const M = Motor, ctx = M.ctx, t = M.t;
      const n = M.fuenteRuido(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3000; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      n.connect(bp).connect(g).connect(this.out.entrada); n.start(t); n.stop(t + 1.3);
    }
  }

  window.Audio2 = { Motor, Guitarra, Bateria, Teclado, Ambiente, PADS, PATRONES };
})();
