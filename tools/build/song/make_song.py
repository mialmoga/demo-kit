# Sueños sin dientes · versión de Ámbar — generador del proyecto (.demokit.json legible, un compás por línea)
import json,random
rnd=random.Random(20261106)
def jit(x,a): return x+rnd.uniform(-a,a)
def N(b,l,m,v=1,**o):
    d={'b':round(b,3),'l':round(l,3),'m':m,'v':round(v,3)}
    if o: d['o']=o
    return d

INTRO,A1,B1,A2,OUT,END=0,32,96,160,224,320
CYC=16                                   # un ciclo de círculo = 4 compases

# ── tonalidad: La dórica = Sol mayor desde La. Las guitarras usan tónica Sol (55) con el círculo «jazz»: Am7 · D7 · Gmaj7 · Gmaj7
G3,A3=55,45
# ── pista de viento
wind=[N(0,32,0),N(96,64,0),N(232,64,0)]

# ── guitarras (cada nota empieza en una frontera de ciclo para que todos los cambios de acorde coincidan)
gnoct=[N(0,32,G3,cuerdas=4,humaniza=.35,brillo=.8),
       N(32,64,G3),N(96,64,G3),N(160,64,G3)]
gbossa=[N(96,64,G3),N(176,48,G3)]
gluz=[N(224,80,A3),N(304,4,A3)]          # La mayor: Amaj9 · F#m9 · Bm9 · E9, y cierra en Amaj9
gluz2=[N(240,64,A3)]

# ── bajo (dobla la raíz que toca la guitarra)
ROOT_D=[45,50,43,43]; ROOT_L=[45,42,47,40]
def bass(start,end,roots,sync):
    out=[]
    for c in range(int((end-start)//4)):
        b=start+4*c; r=roots[c%4]
        out.append(N(b,3.4,r,.9))
        if sync and c%4!=3: out.append(N(b+2.5,.85,r,.62))
    return out
sub=(bass(A1,B1,ROOT_D,False)                    # desde B el bajo sincopa con el bombo
     +bass(B1,OUT,ROOT_D,True)+bass(OUT,OUT+64,ROOT_L,False))

# ── pad: solo las notas guía (3ª y 7ª) de cada acorde, con conducción de voces
def pad_dor(start,end):
    out=[]
    for b in range(start,end,CYC):
        out+= [N(b,4,60,1),N(b,4,67,1),N(b+4,4,60,1),N(b+4,4,66,1),N(b+8,8,59,1),N(b+8,8,66,1)]
    return out
def pad_lyd(start,end):                    # A mayor: Amaj7 · F#m7 · Bm7 · E7
    sh=[(61,68),(61,64),(62,66),(62,68)]; out=[]
    for k,b in enumerate(range(start,end,4)):
        a,c=sh[k%4]; out+=[N(b,4,a,1),N(b,4,c,1)]
    return out
pad=pad_dor(64,OUT)+pad_lyd(OUT,OUT+80)

# ── campana (cajita de música)
P1=[(0,76,2),(2.5,72,1.5),(4,74,1.5),(5.5,69,.5),(6,72,2),(8,71,2),(10.5,74,1.5),(12,78,3.5)]
P2=[(0,79,2),(2.5,76,1.5),(4,78,1.5),(5.5,74,.5),(6,69,2),(8,74,2),(10,71,1),(11,67,1),(12,71,4)]
O1=[(0,76,2),(2.5,73,1.5),(4,73,1.5),(5.5,69,.5),(6,76,2),(8,74,2),(10.5,78,1.5),(12,80,3.5)]
def ph(P,b0,vs=1): return [N(b0+t,l,m,vs*(1 if i%3 else .9)) for i,(t,m,l) in enumerate(P)]
bell=(ph(P1,32)+ph(P2,48)+ph(P1,80)+ph(P2,128)+ph(P1,160)+ph(P2,176)+ph(P1,192)
      +ph(O1,224)+ph(O1,256,.85)+ph(O1,288,.8)+[N(304,6,76,.7)])

# ── batería lo-fi: bombo, rim y hi-hat con swing y pulso humano
kick,rim,hat=[],[],[]
def drums(b0,b1,kicks=True,hatv=1.0,fill=False):
    for bar in range(int(b0//4),int(b1//4)):
        b=bar*4; last=(bar%4==3)
        if kicks:
            kick.append(N(jit(b,.012),.25,0,jit(.95,.04)))
            if last: kick.append(N(jit(b+1.75,.01),.25,0,jit(.5,.04)))
            kick.append(N(jit(b+2.5,.015),.25,0,jit(.72,.05)))
        for q in (1,3): rim.append(N(b+q+.04+rnd.uniform(0,.02),.25,0,jit(.8,.05)))
        if last and kicks: rim.append(N(b+3.75,.25,0,.3))
        for i in range(8):
            t=b+i*.5+(.085 if i%2 else 0)
            hat.append(N(jit(t,.01),.25,0,round(hatv*(jit(.58,.04) if i%2==0 else jit(.33,.05)),3)))
        if last and kicks: hat.append(N(b+3.5,.5,1,.4*hatv))
drums(64,92,kicks=False,hatv=.75)
# relleno que lleva a B: rim que crece
for t,v in ((92,.5),(92.5,.4),(93,.55),(94,.5),(94.5,.45),(95,.6),(95.25,.55),(95.5,.7),(95.75,.8)): rim.append(N(t,.25,0,v))
for i in range(8): hat.append(N(92+i*.5+(.085 if i%2 else 0),.25,0,round(.6*(.55+.06*i),3)))
drums(96,160,kicks=True,hatv=1.0)
drums(160,224,kicks=True,hatv=.9)

def T(id,name,inst,params,vol,pan,notes,ducked,fx=None,auto=None):
    t={'id':id,'name':name,'inst':inst,'params':params,'vol':vol,'pan':pan,'mute':False,'solo':False,'ducked':ducked,'sc':False,'notes':sorted(notes,key=lambda n:(n['b'],n['m']))}
    if auto: t['auto']=auto
    if fx: t['fx']=fx
    return t
EQ=lambda lo,mid,mf,mq,hi:{'on':True,'low':lo,'mid':mid,'midF':mf,'midQ':mq,'high':hi}
CP=lambda thr,r,atk,rel,kn,mk:{'on':True,'thr':thr,'ratio':r,'atk':atk,'rel':rel,'knee':kn,'makeup':mk,'mix':1}
DL=lambda t,fb,tone,mix:{'on':True,'time':t,'fb':fb,'tone':tone,'mix':mix,'pp':True}
RV=lambda size,damp,mix,pre:{'on':True,'size':size,'damp':damp,'mix':mix,'pre':pre}
GP=lambda **k:dict({'gain':.5,'ext':1,'pulsos':4,'cuerdas':6,'humaniza':.5,'velo':1,'brillo':1,'cuerpo':.6,'sustain':1},**k)

tracks=[
 T('viento','Viento (ruido)','wash',{'gain':.045,'fc':200},.5,0,wind,False),
 T('gnoct','Guitarra · nocturna','guitarra_acomp',GP(interprete='lofi',circulo='jazz',patron='arpegio',cuerdas=5,humaniza=.45,brillo=.9,cuerpo=.65,sustain=1.1),.34,-.3,gnoct,True,
   {'eq':EQ(2,-2,300,1.2,-1),'comp':CP(-18,3,20,150,6,2),'delay':DL(.75,.35,3800,.2),'reverb':RV(.6,.55,.14,14)}),
 T('gbossa','Guitarra · bossa','guitarra_acomp',GP(interprete='bossa',circulo='jazz',ext=2,patron='bossa',brillo=.9),.3,.3,gbossa,True,
   {'eq':EQ(0,1.5,3500,1,2),'comp':CP(-16,3,25,120,6,2),'reverb':RV(.55,.5,.12,10)}),
 T('sub','Bajo (sub)','sub',{'gain':.3,'w':2,'voices':1,'spread':0,'atk':.012,'rel':.18,'dec':.9,'lp':700},.3,0,sub,True,
   {'comp':CP(-16,3,15,120,6,2)}),
 T('pad','Pad (notas guía)','pad',{'gain':.06,'w':0,'voices':2,'spread':9,'atk':.5,'rel':.6,'dec':0,'lp':1800,'lpSweep':0,'lpRate':10},.5,0,pad,True,
   {'eq':EQ(-2,0,800,1,-3),'reverb':RV(.75,.5,.25,20)}),
 T('campana','Campana · cajita de música','bell',{'gain':.1,'len':1.7},.5,.2,bell,True,
   {'delay':DL(.75,.4,4200,.3),'reverb':RV(.7,.45,.22,18)}),
 T('bombo','Bombo','kick',{'gain':.55,'lo':46,'hi':120,'k':30,'dec':9,'len':.38,'click':.12},.3,0,kick,False,{'eq':EQ(1,-1,250,1,-3)}),
 T('rim','Rim','rim',{'gain':.14},.55,.1,rim,False,{'reverb':RV(.4,.6,.12,6)}),
 T('hat','Hi-hat','hat',{'gain':.09},.4,.18,hat,False,{'eq':EQ(-3,0,3000,1,-2)}),
 T('gluz','Guitarra · amanecer','guitarra_acomp',GP(interprete='lofi',circulo='lofi',ext=2,patron='balada',cuerdas=6,humaniza=.5,velo=.9,brillo=.85,cuerpo=.7,sustain=1.25),.36,-.2,gluz,True,
   {'eq':EQ(2,-2,350,1.2,-1),'comp':CP(-16,3,25,140,6,2),'delay':DL(.75,.3,3500,.15),'reverb':RV(.7,.5,.22,14)}),
 T('gluz2','Guitarra · arpegio de amanecer','guitarra_acomp',GP(interprete='infante',circulo='lofi',ext=2,patron='arpegio',cuerdas=4,humaniza=.5,brillo=.9,cuerpo=.6),.24,.3,gluz2,True,
   {'eq':EQ(0,0,3000,1,1),'delay':DL(.75,.35,3800,.22),'reverb':RV(.65,.5,.2,12)}),
]

for t in tracks: t['vol']=round(t['vol']*1.25,3)      # la ganancia maestra llega a 2: el resto del volumen sale de las pistas
P={'format':'demokit-studio','v':1,'kit':1,
 'name':'Sueños sin dientes (versión Ámbar)','bpm':85,'bars':80,
 'credits':'Esbozo y título: Brujo · arreglo, armonía y mezcla: Ámbar (Claude Sonnet 5.5)',
 'marks':[{'bar':0,'name':'Intro'},{'bar':8,'name':'Sección A'},{'bar':24,'name':'Sección B'},{'bar':40,'name':'Sección A'},{'bar':56,'name':'Outro'}],
 'genre':'lofi','engine':{'id':'evol','v':'1.2.0','c':'organico'},'seed':20261015,
 'sc':{'mode':'param','depth':.7,'rel':.12,'rate':800},
 'master':{'low':0,'high':0,'gain':2,'limit':True,'ceil':.97},
 'key':{'root':9,'scale':'Dórica','fit':True},
 'tracks':tracks,'clips':{},
 'plugins':[{'id':'guitarra_acomp','name':'Guitarra acompañante','code':open('/home/claude/work/plugins/guitarra_acompanante.js',encoding='utf8').read()}]}

# ── escritura legible: una pista por bloque, efectos en su línea, notas agrupadas por compás
def num(x):
    if isinstance(x,float):
        s=('%.3f'%x).rstrip('0').rstrip('.'); return s if s not in('-0','') else '0'
    return json.dumps(x,ensure_ascii=False)
def one(o):
    if isinstance(o,dict): return '{'+', '.join(json.dumps(k)+': '+one(v) for k,v in o.items())+'}'
    if isinstance(o,list): return '['+', '.join(one(v) for v in o)+']'
    if isinstance(o,float): return num(o)
    return json.dumps(o,ensure_ascii=False)
def notes_txt(ns,ind):
    rows={}; 
    for n in ns: rows.setdefault(int(n['b']//4),[]).append(n)
    lines=[ind+'  '+', '.join(one(n) for n in rows[k]) for k in sorted(rows)]
    return '[\n'+',\n'.join(lines)+'\n'+ind+']'
def track_txt(t):
    I='    '; L=[]
    for k in ('id','name','inst','params','vol','pan','mute','solo','ducked','sc'): L.append(I+'  '+json.dumps(k)+': '+one(t[k]))
    if 'auto' in t: L.append(I+'  "auto": '+one(t['auto']))
    if 'fx' in t: L.append(I+'  "fx": {\n'+',\n'.join(I+'    '+json.dumps(k)+': '+one(v) for k,v in t['fx'].items())+'\n'+I+'  }')
    L.append(I+'  "notes": '+notes_txt(t['notes'],I+'  '))
    return I+'{\n'+',\n'.join(L)+'\n'+I+'}'
top=['format','v','kit','name','credits','bpm','bars','marks','genre','engine','seed','sc','master','key']
out='{\n'+',\n'.join('  '+json.dumps(k)+': '+one(P[k]) for k in top)
out+=',\n  "tracks": [\n'+',\n'.join(track_txt(t) for t in tracks)+'\n  ],\n  "clips": {},\n  "plugins": [\n    '+one(P['plugins'][0])+'\n  ]\n}\n'
json.loads(out)
open('/home/claude/work/song/Suenos_sin_dientes_Ambar.demokit.json','w',encoding='utf8').write(out)
print('ok',len(out)//1024,'KB;',{t['id']:len(t['notes']) for t in tracks})
