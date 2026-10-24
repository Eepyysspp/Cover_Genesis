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
    /* Saturación para acordes (teclado de acordes): curva suave y más ganancia de entrada en vez de un recorte duro.
       Un recorte duro sobre 4 notas juntas las mezcla en un zumbido (intermodulación) y además baja el volumen;
       esta va calentando y engordando el acorde, y compensa el volumen para que subir la saturación no lo apague. */
    bloqueSaturacionAcordes() {
      const ctx = this.ctx, ent = ctx.createGain(), sal = ctx.createGain();
      const seco = ctx.createGain(), moj = ctx.createGain(), pre = ctx.createGain(), ws = ctx.createWaveShaper();
      const n = 2048, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); }
      ws.curve = c; ws.oversample = "4x";
      const pa = ctx.createBiquadFilter(); pa.type = "highpass"; pa.frequency.value = 90;   // el grave no entra a saturar (no embarra)
      // Lo que la saturación inventa debajo del acorde (tonos de diferencia entre sus notas) es el "barro": se corta
      // después de saturar con un filtro empinado. El grave verdadero sigue llegando por el camino seco.
      const pb1 = ctx.createBiquadFilter(), pb2 = ctx.createBiquadFilter();
      [pb1, pb2].forEach(f => { f.type = "highpass"; f.frequency.value = 190; f.Q.value = 0.7; });
      ent.connect(seco).connect(sal); ent.connect(pa).connect(pre).connect(ws).connect(pb1).connect(pb2).connect(moj).connect(sal);
      seco.gain.value = 1; moj.gain.value = 0; pre.gain.value = 1;
      return { ent, sal, mezcla(v, t = Motor.t) {
        seco.gain.setTargetAtTime(1 - v * 0.5, t, 0.05);
        pre.gain.setTargetAtTime(1 + v * 2.6, t, 0.05);
        moj.gain.setTargetAtTime(v * 0.85 / (1 + v * 0.5), t, 0.05);
      } };
    },
    async decodificar(arrayBuffer) { this.init(); return await this.ctx.decodeAudioData(arrayBuffer); },
    async cargarArchivo(file) { return this.decodificar(await file.arrayBuffer()); },
    async cargarURL(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + " → " + r.status); return this.decodificar(await r.arrayBuffer()); },
    // Un pad de batería de la partitura: "archivo.wav" o { capas: [{ hasta: 0.6, archivos: [...] }, …] } (de suave a fuerte)
    async cargarPad(def) {
      if (typeof def === "string") return this.cargarURL(def);
      if (def && def.archivo) return this.cargarURL(def.archivo);
      const capas = await Promise.all((def.capas || []).map(async c => ({
        hasta: c.hasta == null ? 1 : c.hasta, ultimo: -1,
        buffers: (await Promise.all((c.archivos || []).map(a => this.cargarURL(a).catch(() => null)))).filter(Boolean),
      })));
      if (!capas.some(c => c.buffers.length)) throw new Error("sin archivos");
      return { capas: capas.filter(c => c.buffers.length).sort((a, b) => a.hasta - b.hasta) };
    },
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
    // Liberación agendada a futuro (para notas MIDI con duración conocida)
    liberar(g, t, rel, fuentes) {
      if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(t); else g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0.0001, t, Math.max(0.01, rel / 4));
      fuentes.forEach(f => { try { f.stop(t + rel * 1.6 + 0.05); } catch (e) {} });
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
    // Notas sueltas (pistas MIDI): se rasguean si vienen juntas. dur = duración escrita
    tocarNotas(notas, { vel = 0.8, t = Motor.t, dur = 1, arriba = false } = {}) {
      const M = Motor;
      let ns = [...new Set(notas)].sort((a, b) => a - b); if (arriba) ns.reverse();
      const rel = Math.min(this.p.sostener ? 9 : 2.2, Math.max(0.12, dur + 0.15));
      ns.forEach((m, i) => {
        const tt = t + i * 0.018;
        const g = M.ctx.createGain(); g.connect(this.pre);
        let fuentes, nivel = 0.18 * vel;
        if (this.buffer) { fuentes = [M.tocarBuffer(this.buffer, g, { midi: m, base: this.base, t: tt }).fuente]; nivel = 0.5 * vel / Math.sqrt(ns.length); }
        else {
          const o1 = M.fuente("sawtooth", mtof(m)), o2 = M.fuente("sawtooth", mtof(m) * 1.004), o3 = M.fuente("square", mtof(m) * 0.5);
          const g3 = M.ctx.createGain(); g3.gain.value = 0.3;
          o1.connect(g); o2.connect(g); o3.connect(g3).connect(g);
          fuentes = [o1, o2, o3]; fuentes.forEach(o => o.start(tt));
        }
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(Math.max(0.001, nivel), tt + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + rel);
        fuentes.forEach(f => f.stop(tt + rel + 0.1));
      });
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
  // "sinplatillos" y "platillos" son el mismo ritmo que la pista MIDI de batería (midi/genesis_bateria.mid).
  // El crash de la pista (inicio de sección) lo agrega la página de batería en su momento. "pulso" y "muro" son extras.
  // Acentos: X fuerte · x normal · o suave (como la pista MIDI: el 1 más fuerte que el 3, el 4 de la caja más que el 2).
  const PATRONES = {
    pulso:        { tom: "X...o...x...o..." },
    sinplatillos: { bombo: "X.......x.......", caja: "....x.......X..." },
    platillos:    { bombo: "X...o...x...o...", caja: "....x.......X...", hihat: "x...o...x...o..." },
    muro:         { bombo: "X.x.x.x.X.x.x.x.", caja: "....X.......X...", hihat: "xoxoxoxoxoxoxoxo", crash: "X.......x......." },
  };
  const VEL_ACENTO = { X: 1, x: 0.82, o: 0.62 };

  class Bateria {
    constructor() {
      const ctx = Motor.ctx;
      this.p = { vol: 0.8, reverb: 0.2, patron: null, drive: 0.15 };
      this.out = Motor.salida(this.p.vol, this.p.reverb);
      // Bus de batería: saturación suave + compresión de grupo (pega los golpes como en una mezcla real)
      this.bus = ctx.createGain();
      this.dist = Motor.bloqueDistorsion(12);
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -16; this.comp.knee.value = 8; this.comp.ratio.value = 3; this.comp.attack.value = 0.006; this.comp.release.value = 0.14;
      this.bus.connect(this.dist.ent); this.dist.sal.connect(this.comp); this.comp.connect(this.out.entrada);
      this.samples = {};
      this.alGolpe = null;
      // Kit: "muestras" (las de la partitura, FL) o "sintetizado". La base distorsionada es otro instrumento (Base808).
      this.kit = "muestras";
      this.aplicar();
    }
    aplicar() {
      this.out.volumen.gain.setTargetAtTime(this.p.vol, Motor.t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb, Motor.t, 0.05);
      this.dist.mezcla(this.p.drive, Motor.t);
    }
    ponerKit(kit) { this.kit = kit; this.aplicar(); }
    aviso(pad, t) {
      if (this.alGolpe) setTimeout(() => this.alGolpe(/^tom/.test(pad) ? "tom" : pad), Math.max(0, (t - Motor.t) * 1000));
    }
    // Muestra para un golpe: un archivo, o capas por intensidad con varias tomas que se alternan (no se repite la misma)
    muestra(pad, vel) {
      if (this.kit !== "muestras") return null;
      const s = this.samples[pad];
      if (!s || !s.capas) return s ? { buffer: s, gan: vel } : null;
      const c = s.capas.find(c => vel <= c.hasta) || s.capas[s.capas.length - 1];
      if (!c.buffers.length) return null;
      let i = Math.floor(Math.random() * c.buffers.length);
      if (c.buffers.length > 1 && i === c.ultimo) i = (i + 1) % c.buffers.length;
      c.ultimo = i;
      return { buffer: c.buffers[i], gan: 0.35 + 0.65 * vel };   // la capa ya cambia el color; la ganancia sigue la intensidad sin aplastarla
    }
    tocar(pad, t = Motor.t, vel = 1) {
      const M = Motor, ctx = M.ctx, dst = this.bus;
      if (!(this.kit === "muestras" && this.samples[pad]) && (pad === "tomgrave" || pad === "tommedio" || pad === "tomagudo")) return this.tocarTom(pad, t, vel);
      this.aviso(pad, t);
      const mu = this.muestra(pad, vel);
      if (mu) { M.tocarBuffer(mu.buffer, dst, { vel: mu.gan, t }); return; }
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
    // Toms de los redobles sin muestra propia: el tom, más grave o más agudo
    tocarTom(pad, t, vel) {
      const M = Motor, rate = pad === "tomgrave" ? 0.82 : pad === "tomagudo" ? 1.2 : 1;
      this.aviso(pad, t);
      const mu = this.muestra("tom", vel);
      if (mu) { const b = M.tocarBuffer(mu.buffer, this.bus, { vel: mu.gan, t }); b.fuente.playbackRate.value = rate; return; }
      const g = M.ctx.createGain(); g.connect(this.bus);
      const o = M.fuente("sine", 140 * rate); o.frequency.exponentialRampToValueAtTime(80 * rate, t + 0.3);
      o.connect(g); g.gain.setValueAtTime(0.8 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.start(t); o.stop(t + 0.55);
    }

  }

  /* ---------------------------------------------------------------- BASE 808 */
  /* Reinterpretación de la batería: en vez de golpes, una nota grave larga y saturada (un 808 sostenido) que
     sigue la nota grave de cada acorde y hace de base de la pieza. Se toca como el ambiente:
       X = distorsión (cuánto empuja el saturador) · Y = intensidad (volumen y brillo).
     ataque: "acorde" (un golpe de 808 en cada cambio de acorde; la nota se desliza a la nueva) ·
             "compas" (un golpe por compás) · "continuo" (drone: solo se desliza, sin golpes). */
  const ATAQUES_808 = [["acorde", "Golpe en cada acorde"], ["compas", "Golpe en cada compás"], ["continuo", "Continuo (drone)"]];
  class Base808 {
    constructor() {
      const M = Motor, ctx = M.ctx;
      this.p = { x: 0.35, y: 0.6, vol: 0.5, reverb: 0.15, ataque: "acorde" };
      this.out = M.salida(this.p.vol, this.p.reverb);
      // Fuentes que corren siempre (cuestan poco): seno grave + su octava, para que el saturador tenga de dónde sacar armónicos
      this.o1 = M.fuente("sine", 58); this.o2 = M.fuente("sine", 116);
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      this.env = ctx.createGain(); this.env.gain.value = 0;          // encendido / apagado
      this.golpeG = ctx.createGain(); this.golpeG.gain.value = 0.85;  // el golpe de cada ataque (sube y vuelve a sostener)
      this.pre = ctx.createGain();                                    // cuánto entra al saturador (X)
      this.ws = ctx.createWaveShaper(); this.ws.oversample = "4x";
      // Curva asimétrica: además de los armónicos impares del recorte agrega pares, que suenan más cálidos
      const n = 4096, c = new Float32Array(n), norma = Math.tanh(1.2);
      for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(x + 0.2 * x * x) / norma; }
      this.ws.curve = c;
      this.post = ctx.createGain();
      this.hp = ctx.createBiquadFilter(); this.hp.type = "highpass"; this.hp.frequency.value = 28; this.hp.Q.value = 0.7;  // quita la continua de la curva asimétrica
      this.lp = ctx.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.Q.value = 0.8;
      this.o1.connect(this.env); this.o2.connect(g2).connect(this.env);
      this.env.connect(this.golpeG).connect(this.pre).connect(this.ws).connect(this.post).connect(this.hp).connect(this.lp).connect(this.out.entrada);
      // Camino paralelo (truco de mezcla de 808): una copia muy saturada y filtrada a los medios, para que la base
      // se oiga también en parlantes de laptop, que casi no reproducen el grave
      this.preP = ctx.createGain(); this.preP.gain.value = 9;
      this.wsP = ctx.createWaveShaper(); this.wsP.curve = c; this.wsP.oversample = "2x";
      this.bpP = ctx.createBiquadFilter(); this.bpP.type = "bandpass"; this.bpP.frequency.value = 480; this.bpP.Q.value = 0.5;
      this.parP = ctx.createGain();
      this.golpeG.connect(this.preP).connect(this.wsP).connect(this.bpP).connect(this.parP).connect(this.out.entrada);
      this.o1.start(); this.o2.start();
      this.encendido = false; this.nota = null; this.ultimoAgendado = null; this.pendienteHasta = 0;
      this.alGolpe = null;
      this.aplicar();
    }
    aplicar(t = Motor.t) {
      const { x, y } = this.p;
      const drive = 1 + Math.pow(x, 1.5) * 26;
      this.pre.gain.setTargetAtTime(drive, t, 0.04);
      // Compensación: con más saturación el volumen no se dispara, pero sí se siente más denso
      this.post.gain.setTargetAtTime(0.5 / (0.55 + 0.45 * Math.tanh(drive / 6)), t, 0.04);
      this.lp.frequency.setTargetAtTime(320 + y * y * 2400 + x * 2600, t, 0.05);
      // Con poca distorsión el paralelo pesa más (es lo que se oye en la laptop). Va con la polaridad invertida:
      // si no, sus medios se cancelan con los del camino principal
      this.parP.gain.setTargetAtTime(-(0.75 + 0.4 * y - 0.35 * x), t, 0.05);
      this.out.volumen.gain.setTargetAtTime(this.p.vol * (0.08 + Math.pow(y, 1.3) * 0.92), t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb, t, 0.05);
    }
    // Nota grave (Fa1–Mi2) de un acorde de la partitura
    notaDe(acorde) { const a = window.G.parseAcorde(acorde); return a ? 29 + ((a.bajo - 5 + 12) % 12) : 37; }
    // Cambia a la nota m en el instante t (de audio). golpe: ataque de 808 (subida de altura y de volumen); si no, se desliza
    ir(m, t, golpe) {
      const f = mtof(m), f1 = this.o1.frequency, f2 = this.o2.frequency;
      [f1, f2].forEach(p => { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); });
      if (golpe && this.encendido) {
        f1.setValueAtTime(f * 1.9, t); f1.exponentialRampToValueAtTime(f, t + 0.055);
        f2.setValueAtTime(f * 3.8, t); f2.exponentialRampToValueAtTime(f * 2, t + 0.055);
        const g = this.golpeG.gain;
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
        g.setValueAtTime(1.45, t + 0.002); g.setTargetAtTime(0.85, t + 0.04, 0.5);   // golpe y vuelve a la nota larga
        if (this.alGolpe) setTimeout(() => this.alGolpe(), Math.max(0, (t - Motor.t) * 1000));
      } else {
        f1.setTargetAtTime(f, t, 0.045); f2.setTargetAtTime(f * 2, t, 0.045);   // deslizamiento
      }
      this.nota = m;
    }
    encender(acorde, t = Motor.t) {
      if (this.encendido) return;
      this.encendido = true;
      const e = this.env.gain;
      if (e.cancelAndHoldAtTime) e.cancelAndHoldAtTime(t); else e.cancelScheduledValues(t);
      e.setTargetAtTime(1, t, 0.012);
      this.ir(this.notaDe(acorde), t, this.p.ataque !== "continuo");
    }
    apagar(t = Motor.t) {
      if (!this.encendido) return;
      this.encendido = false;
      const e = this.env.gain;
      if (e.cancelAndHoldAtTime) e.cancelAndHoldAtTime(t); else e.cancelScheduledValues(t);
      e.setTargetAtTime(0, t, 0.12);
      this.ultimoAgendado = null;
    }
    /* Llamar seguido (cada cuadro o cada ~150 ms) con el segundo de la obra.
       Con el reloj en marcha agenda el próximo cambio de acorde (o de compás) justo a tiempo, en el reloj de audio. */
    seguir(tObra, corriendo) {
      const G = window.G, ahora = Motor.t;
      const tc = Math.min(Math.max(tObra, 0), G.DURACION - 0.01);
      const info = G.acordeEn(tc), m = this.notaDe(info.nombre);
      if (!this.encendido) { this.nota = m; return; }
      const golpe = this.p.ataque !== "continuo";
      if (corriendo) {
        const VENTANA = 0.35;
        let prox = null;
        if (info.falta < VENTANA && info.siguiente) prox = { en: tc + info.falta, acorde: info.siguiente };
        if (this.p.ataque === "compas") {
          const spc = G.SEG_POR_COMPAS, falta = spc - (tc % spc);
          if (falta < VENTANA && (!prox || falta < prox.en - tc - 0.01)) prox = { en: tc + falta, acorde: G.acordeEn(Math.min(tc + falta + 0.01, G.DURACION - 0.01)).nombre };
        }
        if (prox) {
          const clave = Math.round(prox.en * 50);
          if (clave !== this.ultimoAgendado) {
            this.ultimoAgendado = clave;
            const cuando = ahora + (prox.en - tc);
            this.ir(this.notaDe(prox.acorde), cuando, golpe); this.pendienteHasta = cuando + 0.05;
          }
          return;
        }
      }
      // Fuera de un cambio agendado: si la nota no corresponde (salto, reloj detenido) se corrige ahora
      if (ahora > this.pendienteHasta && m !== this.nota) this.ir(m, ahora, golpe && corriendo);
    }
  }

  /* ---------------------------------------------------------------- TECLADO */
  class Teclado {
    // opciones.saturacion: "acordes" (suave, para tocar acordes: el teclado bajo/medio 2) o "dura" (líneas de una nota).
    // Por defecto, el preset "pad" usa la de acordes.
    constructor(preset, opciones = {}) {
      this.preset = preset;
      this.paraAcordes = (opciones.saturacion || (preset === "pad" ? "acordes" : "dura")) === "acordes";
      const def = { pad: [0.5, 0.45, 0.5], epiano: [0.7, 0.55, 0.35], bajo: [0.35, 0.6, 0.1], lead: [0.6, 0.45, 0.35] }[preset] || [0.5, 0.5, 0.3];
      this.p = { filtro: def[0], vol: def[1], reverb: def[2], dist: 0, octava: preset === "bajo" ? 2 : preset === "lead" ? 4 : 3 };
      this.out = Motor.salida(this.p.vol, this.p.reverb);
      this.filtro = Motor.ctx.createBiquadFilter(); this.filtro.type = "lowpass"; this.filtro.Q.value = preset === "bajo" ? 4 : 1;
      this.dist = this.paraAcordes ? Motor.bloqueSaturacionAcordes() : Motor.bloqueDistorsion(30);
      // Filtro después de la distorsión (como el parlante de un amplificador): la saturación queda cálida, no chillona
      this.post = Motor.ctx.createBiquadFilter(); this.post.type = "lowpass"; this.post.Q.value = 0.6;
      this.filtro.connect(this.dist.ent); this.dist.sal.connect(this.post); this.post.connect(this.out.entrada);
      this.activas = new Map(); this.buffer = null; this.base = 60;
      this.mono = null; // para lead
      this.aplicar();
    }
    aplicar() {
      const t = Motor.t;
      this.filtro.frequency.setTargetAtTime(150 + Math.pow(this.p.filtro, 2) * 9000, t, 0.05);
      this.dist.mezcla(this.p.dist, t);
      this.post.frequency.setTargetAtTime(Math.min(18000, 1200 + Math.pow(this.p.filtro, 2) * 9000 + (1 - this.p.dist) * 9000), t, 0.05);
      this.out.volumen.gain.setTargetAtTime(this.p.vol, t, 0.05);
      this.out.envio.gain.setTargetAtTime(this.p.reverb, t, 0.05);
    }
    on(m, vel = 0.8) {
      if (this.activas.has(m)) this.off(m);
      if (this.preset === "lead" && !this.buffer) return this.leadOn(m, vel);
      this.activas.set(m, this.crearVoz(m, vel, Motor.t));
    }
    // Nota con duración conocida que empieza en t (pistas MIDI). No toca las notas que tocas a mano.
    nota(m, vel = 0.8, t = Motor.t, dur = 0.5) {
      const v = this.crearVoz(m, vel, t);
      Motor.liberar(v.g, t + Math.max(0.04, dur), v.rel, v.fuentes);
    }
    // Crea una voz que empieza en t y la devuelve sin registrarla: { g, fuentes, rel }
    crearVoz(m, vel, t) {
      const M = Motor, ctx = M.ctx;
      const g = ctx.createGain(); g.connect(this.filtro);
      let fuentes = [], ataque = 0.01, nivel = 0.25 * vel, rel = 0.4;
      if (this.buffer) {
        fuentes = [M.tocarBuffer(this.buffer, g, { midi: m, base: this.base, t, loop: !!this.bufferLoop }).fuente]; nivel = vel; rel = 0.5;
        M.envolvente(g, t, ataque, nivel);
        return { g, fuentes, rel };
      } else if (this.preset === "lead") {   // versión polifónica del lead (para MIDI)
        const o = M.fuente("sawtooth", mtof(m)), o2 = M.fuente("triangle", mtof(m) * 2);
        const vib = M.fuente("sine", 5.5), gv = ctx.createGain(); gv.gain.value = 4;
        vib.connect(gv); gv.connect(o.frequency); gv.connect(o2.frequency);
        const g2 = ctx.createGain(); g2.gain.value = 0.3; o.connect(g); o2.connect(g2).connect(g);
        fuentes = [o, o2, vib]; ataque = 0.03; nivel = 0.16 * vel; rel = 0.35;
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
        return { g, fuentes, rel };
      } else if (this.preset === "bajo") {
        const o1 = M.fuente("sawtooth", mtof(m)); const o2 = M.fuente("sine", mtof(m - 12));
        const g2 = ctx.createGain(); g2.gain.value = 0.9; o1.connect(g); o2.connect(g2).connect(g); fuentes = [o1, o2];
        ataque = 0.005; nivel = 0.3 * vel; rel = 0.25;
      } else {
        const o = M.fuente("triangle", mtof(m)); o.connect(g); fuentes = [o];
      }
      M.envolvente(g, t, ataque, nivel);
      fuentes.forEach(f => f.start(t));
      return { g, fuentes, rel };
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
          const notas = this.notasMidi ? this.notasPulso() : notasAcorde(this.acorde || "C", 4); if (!notas.length) return;
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
    raizMidi() {
      if (this.notasMidi) return 48 + (this.notasMidi[0] % 12);
      const a = parseAcorde(this.acorde || "C"); return 48 + (a ? a.raiz : 0);
    }
    // Notas de la pista MIDI (las del arreglo): reemplazan al acorde de la partitura mientras existan
    afinarNotas(ms, tau = 0.6) {
      const nuevas = ms && ms.length ? [...new Set(ms)].sort((a, b) => a - b) : null;
      if (String(nuevas) === String(this.notasMidi)) return;
      this.notasMidi = nuevas;
      this.afinar(this.acorde, tau);
    }
    notasPulso() {
      return [...new Set(this.notasMidi.map(m => { while (m < 60) m += 12; while (m >= 72) m -= 12; return m; }))].sort((a, b) => a - b);
    }
    aplicarNotas(tau) {
      const t = Motor.t, ms = this.notasMidi;
      if (this.loop) { this.loop.playbackRate.setTargetAtTime(Math.pow(2, (this.raizMidi() - this.base) / 12), t, tau); return; }
      if (this.preset === "drone") {
        // 3 sierras con las notas (las más agudas si hay 4 o más) + seno grave en la más baja
        const sierras = ms.length >= 4 ? ms.slice(-3) : ms;
        const grave = ms[0] < 40 ? ms[0] : ms[0] - 12;
        this.oscs.forEach((o, i) => o.frequency.setTargetAtTime(mtof(o._iv === -12 ? grave : sierras[i % sierras.length]), t, tau));
      } else if (this.preset === "brillo") {
        const altas = ms.map(m => { while (m < 72) m += 12; return m; });
        this.oscs.forEach(o => o.frequency.setTargetAtTime(mtof(altas[o._i % altas.length] + (o._i >= altas.length ? 12 : 0)), t, tau));
      }
    }
    afinar(acorde, tau = 0.8) {
      this.acorde = acorde || this.acorde;
      if (this.notasMidi) { if (this.encendido) this.aplicarNotas(tau); return; }
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
    // Nota de una pista MIDI: voz suave que pasa por su propio filtro/distorsión (X) y nivel (Y).
    // Suena aunque el ambiente esté apagado, para poder tocar la pista sola.
    nota(m, vel = 0.7, t = Motor.t, dur = 1) {
      const M = Motor, ctx = M.ctx, { x, y } = this.p;
      if (!this.midiIn) {
        this.midiIn = ctx.createGain(); this.midiFiltro = ctx.createBiquadFilter(); this.midiFiltro.type = "lowpass";
        this.midiDist = M.bloqueDistorsion(25);
        this.midiIn.connect(this.midiFiltro).connect(this.midiDist.ent); this.midiDist.sal.connect(this.out.entrada);
        if (this.eco) this.midiDist.sal.connect(this.eco);
      }
      this.midiFiltro.frequency.setTargetAtTime(500 + x * x * 9000, M.t, 0.1);
      this.midiDist.mezcla(x * x);
      this.midiIn.gain.setTargetAtTime(0.25 + y * 0.9, M.t, 0.1);
      const f = mtof(m), g = ctx.createGain(); g.connect(this.midiIn);
      const tipo = this.preset === "brillo" ? "sine" : this.preset === "viento" ? "sawtooth" : "triangle";
      const o = M.fuente(tipo, f), o2 = M.fuente("sine", f * 2.003), g2 = ctx.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2).connect(g);
      const ataque = Math.min(0.5, Math.max(0.01, dur * 0.25));
      M.envolvente(g, t, ataque, 0.16 * vel);
      [o, o2].forEach(s => s.start(t));
      M.liberar(g, t + Math.max(ataque + 0.02, dur), 1.4, [o, o2]);
    }
    // Corta las notas MIDI que vienen sonando (al apagar el ambiente). La próxima nota vuelve a subir el nivel.
    callarMidi() { if (this.midiIn) this.midiIn.gain.setTargetAtTime(0, Motor.t, 0.08); }
    destello() {
      const M = Motor, ctx = M.ctx, t = M.t;
      const n = M.fuenteRuido(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3000; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      n.connect(bp).connect(g).connect(this.out.entrada); n.start(t); n.stop(t + 1.3);
    }
  }

  window.Audio2 = { Motor, Guitarra, Bateria, Base808, ATAQUES_808, Teclado, Ambiente, PADS, PATRONES, VEL_ACENTO };
})();
