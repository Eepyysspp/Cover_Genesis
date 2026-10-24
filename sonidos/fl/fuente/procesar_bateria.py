import numpy as np, soundfile as sf, json, os
from scipy import signal
SR_IN=44100; SR=32000
orig=json.load(open('/home/claude/drums/original.json')); bandas=np.array(orig['bandas'])
RAW='/home/claude/drums/raw'; OUT='/home/claude/drums/proc'; os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
def cargar(kit,pieza,v=127,rep=0):
    x,_=sf.read(f'{RAW}/{kit}_{pieza}_v{v}_{rep}.wav'); x=x.astype(np.float64)
    i=np.argmax(np.abs(x).max(1)>0.02*np.abs(x).max()); return x[max(0,i-32):]          # empieza en el ataque
def perfil(m,L):
    seg=m[:int(L*SR_IN)]; S=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),n=8192))**2; f=np.fft.rfftfreq(8192,1/SR_IN)
    return np.array([10*np.log10(S[(f>=b/2**(1/6))&(f<b*2**(1/6))].mean()+1e-12) for b in bandas])
def fir_desde_bandas(gan_db, n=1023, sr=SR_IN):
    f=np.concatenate([[0],bandas[bandas<sr/2],[sr/2]]); g=np.concatenate([[gan_db[0]],gan_db[bandas<sr/2],[gan_db[bandas<sr/2][-1]]])
    h=signal.firwin2(n, f/(sr/2), 10**(g/20)); return signal.minimum_phase(h, method='homomorphic', n_fft=8192)   # fase mínima: no ensucia el ataque
def filtrar(x,h): return np.stack([signal.fftconvolve(x[:,c],h)[:len(x)] for c in range(x.shape[1])],1)
def match_eq(x, ref, rango, L, fuerza=0.6, tope=9):
    P=perfil(x.mean(1),L); O=np.array(orig['res'][ref]['perfil'])
    d=O-P; lo,hi=rango; sel=(bandas>=lo)&(bandas<=hi)
    d=np.where(sel,d,np.nan); d=d-np.nanmean(d)
    d=np.where(np.isnan(d),0,d); k=np.ones(3)/3; d=np.convolve(d,k,'same')        # suavizado de 1 octava
    d=np.clip(d*fuerza,-tope,tope); d[~sel]=np.interp(np.where(~sel)[0],np.where(sel)[0],d[sel])
    return filtrar(x, fir_desde_bandas(d))
def shelf(x, f0, db, tipo='high'):
    b,a=signal.iirfilter(2,f0/(SR_IN/2),btype='highpass' if tipo=='high' else 'lowpass')
    parte=signal.lfilter(b,a,x,axis=0); return x+(10**(db/20)-1)*parte
def peq(x,f0,db,q=1.0):
    A=10**(db/40); w=2*np.pi*f0/SR_IN; al=np.sin(w)/(2*q)
    b=[1+al*A,-2*np.cos(w),1-al*A]; a=[1+al/A,-2*np.cos(w),1-al/A]; return signal.lfilter(b,a,x,axis=0)
def hpf(x,f0): b,a=signal.butter(2,f0/(SR_IN/2),'high'); return signal.lfilter(b,a,x,axis=0)
def lpf(x,f0,o=2): b,a=signal.butter(o,f0/(SR_IN/2),'low'); return signal.lfilter(b,a,x,axis=0)
def saturar(x,drive,mezcla):
    if drive<=0: return x
    y=np.tanh(drive*x)/np.tanh(drive); y=y*(np.abs(x).max()/np.abs(y).max()); return (1-mezcla)*x+mezcla*y
def comp_paralelo(x, mezcla=0.35, ratio=6, umbral_db=-24, at=0.004, rel=0.09):
    env=np.abs(x).max(1); a1=np.exp(-1/(at*SR_IN)); a2=np.exp(-1/(rel*SR_IN)); e=np.zeros_like(env); v=0
    for i,s in enumerate(env): v=(a1*v+(1-a1)*s) if s>v else (a2*v+(1-a2)*s); e[i]=v
    edb=20*np.log10(e+1e-9); g=np.where(edb>umbral_db,(umbral_db+(edb-umbral_db)/ratio)-edb,0); y=x*(10**(g/20))[:,None]
    y=y/np.abs(y).max()*np.abs(x).max(); return (1-mezcla)*x+mezcla*y
def sala(rt60=0.7, pre=0.006, oscuridad=3500, semilla=0, largo=1.5):
    r=np.random.default_rng(semilla); n=int(largo*SR_IN); t=np.arange(n)/SR_IN
    ir=np.zeros((n,2))
    for c in range(2):
        cola=r.standard_normal(n)*np.exp(-6.91*t/rt60); cola=lpf(cola,oscuridad,2)*np.exp(-t*2)   # cola difusa, se oscurece
        ir[:,c]=cola*np.clip((t-pre)/0.01,0,1)
        for _ in range(9):                                       # reflexiones tempranas
            k=int((pre+r.uniform(0.002,0.035))*SR_IN); ir[k,c]+=r.uniform(0.25,0.6)*r.choice([-1,1])
    return ir/np.abs(ir).sum(0).max()*3
def con_sala(x, ir, mojado):
    w=np.stack([signal.fftconvolve(x.mean(1),ir[:,c]) for c in range(2)],1)
    s=np.zeros((max(len(w),len(x)),2)); s[:len(x)]+=x*(1-mojado) if x.shape[1]==2 else np.repeat(x,2,1)*(1-mojado)
    w=w/np.abs(w).max()*np.abs(x).max(); s[:len(w)]+=w*mojado; return s
def recortar(x, umbral_db=-60, fade=0.03):
    env=np.abs(x).max(1); i=np.where(env>env.max()*10**(umbral_db/20))[0][-1]; x=x[:i+1].copy()
    n=int(fade*SR_IN); x[-n:]*=np.linspace(1,0,n)[:,None]**2; return x
def variacion(x, semitonos, tilt_db, semilla):
    if semitonos: 
        n=int(len(x)/2**(semitonos/12)); x=signal.resample(x,n,axis=0)
    return shelf(x,3000,tilt_db) if tilt_db else x
def exportar(x,nombre,mono=False):
    x=signal.resample_poly(x,SR,SR_IN,axis=0)
    if mono: x=x.mean(1,keepdims=True)
    x=x/np.abs(x).max()*10**(-1/20); sf.write(f'{OUT}/{nombre}.wav',x,SR,subtype='PCM_16'); return len(x)/SR
def mezclar(a,b,ga=1,gb=1):
    n=max(len(a),len(b)); s=np.zeros((n,2)); s[:len(a)]+=a*ga; s[:len(b)]+=b*gb; return s
# ---- Diseño por pieza ----
CAPAS={'suave':dict(osc=-5,drive=0.0,tilt=-3),'media':dict(osc=-2,drive=1.6,tilt=0),'fuerte':dict(osc=0,drive=2.6,tilt=1.5)}
def capa_tonal(x,c): 
    x=shelf(x,2500,c['osc']) if c['osc'] else x
    return saturar(x,c['drive'],0.5)
info={}
def hacer(pieza, base, capas, rrs, mono=False):
    for cn in capas:
        for r in range(rrs):
            x=base(cn,r); 
            for k,v in [('pieza',pieza)]: pass
            nombre=f'{pieza}_{cn}_{r+1}' if len(capas)>1 or rrs>1 else pieza
            info[nombre]=round(exportar(x,nombre,mono),2)
# BOMBO: room (cuerpo) + power (ataque), EQ hacia la original, sala corta
def bombo(cn,r):
    a=cargar('room','bombo'); b=cargar('power','bombo'); x=mezclar(a,b,0.7,0.5)
    x=hpf(x,48); x=shelf(x,110,-8,'low'); x=peq(x,170,6,0.8); x=peq(x,600,4,0.9); x=peq(x,2400,2,1.2); x=lpf(x,6000,2)
    x=capa_tonal(x,CAPAS[cn]); x=comp_paralelo(x,0.45,ratio=8); x=variacion(x,[0,0.15][r],[0,-0.6][r],r)
    return recortar(con_sala(x,sala(0.6,0.004,2600,10+r),0.2),-55)
# CAJA: room + power, cuerpo 180–250 Hz, cola de sala ~0.35 s a −20 dB
def caja(cn,r):
    a=cargar('room','caja'); b=cargar('power','caja'); x=mezclar(a,b,0.8,0.45)
    x=hpf(x,70); x=match_eq(x,'caja',(60,8000),0.12); x=peq(x,200,3,1.0); x=peq(x,900,-2,1.0); x=lpf(x,7500,2)
    x=capa_tonal(x,CAPAS[cn]); x=comp_paralelo(x,0.45,ratio=8); x=variacion(x,[0,0.25][r],[0,-0.8][r],r)
    return recortar(con_sala(x,sala(0.85,0.008,3200,20+r),0.24),-55)
def hihat(cn,r):
    x=cargar('power','hihat'); x=hpf(x,350); x=match_eq(x,'hihat',(2000,14000),0.08,0.5,6); x=shelf(x,9000,-6); x=lpf(x,12000,2)
    x=capa_tonal(x,dict(CAPAS[cn],drive=CAPAS[cn]['drive']*0.5)); x=variacion(x,[0,0.3][r],[0,-1][r],r)
    return recortar(con_sala(x,sala(0.6,0.006,5000,30+r),0.16),-55)
def abierto(cn,r):
    x=cargar('power','abierto'); x=hpf(x,350); x=match_eq(x,'hihat',(2000,14000),0.15,0.5,6); x=shelf(x,9000,-5); x=lpf(x,12000,2)
    x=capa_tonal(x,dict(CAPAS[cn],drive=CAPAS[cn]['drive']*0.4)); x=variacion(x,0,0,r)
    return recortar(con_sala(x,sala(0.7,0.006,5000,40+r),0.15),-55)
def tom(pieza):
    def f(cn,r):
        x=cargar('room',pieza); x=hpf(x,45); x=match_eq(x,'intro',(60,6000),0.12,0.5,8); x=lpf(x,6000,2)
        x=capa_tonal(x,CAPAS[cn]); x=comp_paralelo(x,0.35); x=variacion(x,[0,0.2][r],0,r)
        return recortar(con_sala(x,sala(0.75,0.008,3000,50+r),0.2),-55)
    return f
def pulso(cn,r):   # el "pulso" grave de la intro: tom corto y apagado (como en la grabación, ~75 ms a −20 dB)
    x=cargar('room','tomgrave'); x=hpf(x,40); x=match_eq(x,'intro',(60,6000),0.12,0.7,9); x=lpf(x,3500,2)
    n=len(x); t=np.arange(n)/SR_IN; x=x*np.exp(-t/0.05)[:,None]; x=saturar(x,1.8,0.5)
    return recortar(con_sala(x,sala(0.5,0.006,2500,60),0.15),-50)
def crash(cn,r):
    x=cargar('power','crash'); x=hpf(x,300); x=match_eq(x,'crash',(2000,14000),1.2,0.5,6); x=shelf(x,10000,-4); x=lpf(x,13000,2)
    x=saturar(x,1.2,0.3); return recortar(con_sala(x,sala(1.2,0.01,6000,70),0.18),-55)
hacer('bombo',bombo,['suave','media','fuerte'],2,mono=True)
hacer('caja',caja,['suave','media','fuerte'],2)
hacer('hihat',hihat,['suave','media','fuerte'],2)
hacer('abierto',abierto,['media'],1)
hacer('tom',pulso,['media'],1)
hacer('tomgrave',tom('tomgrave'),['suave','fuerte'],1)
hacer('tomagudo',tom('tomagudo'),['suave','fuerte'],1)
hacer('tommedio',tom('tom'),['suave','fuerte'],1)
hacer('crash',crash,['media'],1)
json.dump(info,open('/home/claude/drums/proc_info.json','w'),indent=0)
tot=sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT)); print(len(info),'archivos', round(tot/1e6,2),'MB')
