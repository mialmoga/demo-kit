# La rotita (con voz) — fusión de «la rotita» y «voice» · arreglo: Ámbar
import json,glob,copy,math
ATT='/mnt/user-data/attachments/*/'
R=json.load(open(glob.glob(ATT+'*la_rotita.demokit.json')[0],encoding='utf8'))
V=json.load(open(glob.glob(ATT+'*voice.demokit.json')[0],encoding='utf8'))
TR={t['id']:t for t in R['tracks']}
BPM=82; SPB=60/BPM; F_OLD=60/40            # segundos por pulso (nuevo) y (original a 40 bpm)
START=32                                   # la voz entra en el compás 8 (pulso 32)
WHITE={0,2,4,5,7,9,11}
def snap(m):
    m=int(round(m)); return m if m%12 in WHITE else m-1       # nota negra → la blanca de abajo (sabor menor)
def N(b,l,m,v=1,**x):
    d={'b':round(b,3),'l':round(l,3),'m':m,'v':v}; d.update(x); return d

# ── 1. la línea de voz: una sola línea, sin notas sueltas, en la escala de las campanas, con el tiempo real que le oíste a 40 bpm
raw=[n for n in V['tracks'][0]['notes'] if n.get('w')]
raw.sort(key=lambda n:n['b']); dropped=len(V['tracks'][0]['notes'])-len(raw)
MING=.32                                   # segundos mínimos entre inicios de sílaba (solo se empuja donde estaba apretado)
ons=[]; prev=None
for n in raw:
    t=n['b']*F_OLD; t=t if prev is None else max(t,prev+MING); ons.append(t); prev=t
voice=[]
for i,(n,t) in enumerate(zip(raw,ons)):
    nxt=ons[i+1] if i+1<len(ons) else None
    dur=n['l']*F_OLD
    if nxt is not None: dur=min(dur,(nxt-t)*.97)
    dur=max(dur,.12)
    voice.append(N(START+t/SPB,dur/SPB,snap(n['m']),1,w=n['w']))
beatOf=lambda w,k=0:[x for x in voice if x['w']==w][k]['b']
tS=voice[[x['w'] for x in voice].index('toman')-1]['b']       # «si» que abre la subida
S=int(tS//4); C=int(voice[[x['w'] for x in voice].index('contar')]['b']//4)+1   # el cierre empieza tras «contar»
O=int(math.ceil((voice[-1]['b']+voice[-1]['l'])/4))+0
TOTAL=int(math.ceil((O+6)/4)*4)
print('voz: %d notas (quité %d sueltas) | empieza b%.1f | «si» de la subida b%.1f→compás %d | cierre compás %d | outro compás %d | total %d compases (%.0f s)'%(len(voice),dropped,voice[0]['b'],tS,S,C,O,TOTAL,TOTAL*4*SPB))

# ── 2. lazos de campana y pluck (tus mismas notas), repetidos
def loop_of(tid,k=1):
    return [(n['b']%16,n['l'],n['m'],n['v']) for n in TR[tid]['notes'] if int(n['b']//16)==k]
bellL,plkL=loop_of('tyt2s'),loop_of('tzzly')
bell,plk=[],[]
for k in range(TOTAL//4):
    for (o,l,m,v) in bellL:
        b=k*16+o
        if S*4<=b<C*4: continue                      # en la subida las campanas se callan: la voz sube a su registro
        bell.append(N(b,l,m,v))
    for (o,l,m,v) in plkL:
        if k==TOTAL//4-1 and o>15: continue
        plk.append(N(k*16+o,l,m,v))
# ── 3. batería con tus patrones, hasta el cierre
kick,snare,hat=[],[],[]
for bar in range(0,C):
    b=bar*4
    kick+= [N(b,.25,0),N(b+(.75 if bar==4 else .5),.25,0)]
    snare.append(N(b+1,.25,0))
    if bar>=4 and (bar-4)%8==0: snare.append(N(b+.25,.25,0))
    if bar>=12: hat+= [N(b+1.25,.25,0),N(b+2,.25,0),N(b+3.25,.25,1)]
    elif bar<8:
        k4=bar%4; pat={0:[(3.25,1)],1:[(1.25,0),(3.25,1)],2:[(1.25,0),(2,0),(3.25,1)],3:[(1.25,0),(3.25,1)]}[k4]
        hat+= [N(b+o,.25,m) for o,m in pat]
    else: hat.append(N(b+3.25,.25,1))                  # compases 8–11: solo el hat abierto, entra la voz
# ── 4. pad (tu frase de 2 compases cada 4), audible
pad_phrase=[(n['b']-24.25,n['l'],n['m']) for n in TR['t110v3']['notes'] if 24<=n['b']<33]
pad=[]
j=0
while 24.25+16*j<(O+2)*4:
    for (o,l,m) in pad_phrase: pad.append(N(24.25+16*j+o,l,m))
    j+=1
# ── 5. viento
wind=[N(.5,TOTAL*4-1,0)]

def mk(id,notes,**ch):
    t=copy.deepcopy(TR[id]); t['notes']=sorted(notes,key=lambda n:(n['b'],n['m'])); t.update(ch); return t
fade=lambda: {'vol':[{'b':(O+1)*4,'v':1},{'b':TOTAL*4-1,'v':0}]}
voz=copy.deepcopy(TR['t169w0']); voz['id']='voz'; voz['name']='Voz cantada (Autómata)'
voz['params'].update({'tono':0,'agua':.38,'gain':1.5}); voz['ducked']=False; voz['solo']=False; voz['notes']=voice; voz['vol']=.85
voz['auto']={'p:energia':[{'b':S*4-8,'v':0},{'b':S*4,'v':55},{'b':C*4,'v':55},{'b':C*4+4,'v':0}],
             'p:cansancio':[{'b':S*4-8,'v':100},{'b':S*4,'v':35},{'b':C*4,'v':35},{'b':C*4+4,'v':100}]}
voz['fx']={'comp':{'on':True,'thr':-18,'ratio':3,'atk':15,'rel':140,'knee':6,'makeup':2,'mix':1},'reverb':{'on':True,'size':.55,'damp':.5,'mix':.12,'pre':10}}
tracks=[mk('tts31',kick),mk('tuooi',snare),mk('tvby4',hat),
        mk('tyt2s',bell,auto=fade()),mk('tzzly',plk,auto=fade()),
        mk('t110v3',pad,vol=.5,auto=fade()),mk('t150ge',wind),voz]
for t in tracks[:-1]: t['vol']=round(t['vol']*.9,3)          # la mezcla deja sitio a la voz
P={'format':'demokit-studio','v':1,'kit':1,'name':'La rotita (con voz)','credits':'Lazo, letra, voz y la idea: Brujo · fusión y arreglo: Ámbar (Claude Sonnet 5.5)',
   'bpm':BPM,'bars':TOTAL,
   'marks':[{'bar':0,'name':'Intro'},{'bar':8,'name':'Verso'},{'bar':S,'name':'Subida'},{'bar':C,'name':'Cierre'},{'bar':O,'name':'Outro'}],
   'genre':'lofi','engine':R['engine'],'seed':R['seed'],'sc':R['sc'],'master':R['master'],'key':{'root':0,'scale':'Mayor','fit':True},
   'tracks':tracks,'clips':{},
   'plugins':[{'id':'voz','name':'Voz cantada (Autómata)','code':open('/home/claude/work/plugins/automata_vocal.js',encoding='utf8').read()}]}

# ── escritura legible (un compás por línea)
def num(x):
    s=('%.3f'%x).rstrip('0').rstrip('.'); return s if s not in('-0','') else '0'
def one(o):
    if isinstance(o,dict): return '{'+', '.join(json.dumps(k)+': '+one(v) for k,v in o.items())+'}'
    if isinstance(o,list): return '['+', '.join(one(v) for v in o)+']'
    if isinstance(o,float): return num(o)
    return json.dumps(o,ensure_ascii=False)
def notes_txt(ns,ind):
    rows={}
    for n in ns: rows.setdefault(int(n['b']//4),[]).append(n)
    return '[\n'+',\n'.join(ind+'  '+', '.join(one(n) for n in rows[k]) for k in sorted(rows))+'\n'+ind+']'
def track_txt(t):
    I='    '; L=[]
    for k in ('id','name','inst','params','vol','pan','mute','solo','ducked','sc'): L.append(I+'  '+json.dumps(k)+': '+one(t[k]))
    if t.get('auto'): L.append(I+'  "auto": {\n'+',\n'.join(I+'    '+json.dumps(k)+': '+one(v) for k,v in t['auto'].items())+'\n'+I+'  }')
    if t.get('fx'): L.append(I+'  "fx": {\n'+',\n'.join(I+'    '+json.dumps(k)+': '+one(v) for k,v in t['fx'].items())+'\n'+I+'  }')
    L.append(I+'  "notes": '+notes_txt(t['notes'],I+'  ')); return I+'{\n'+',\n'.join(L)+'\n'+I+'}'
top=['format','v','kit','name','credits','bpm','bars','marks','genre','engine','seed','sc','master','key']
out='{\n'+',\n'.join('  '+json.dumps(k)+': '+one(P[k]) for k in top)+',\n  "tracks": [\n'+',\n'.join(track_txt(t) for t in tracks)+'\n  ],\n  "clips": {},\n  "plugins": [\n    '+one(P['plugins'][0])+'\n  ]\n}\n'
json.loads(out); open('/home/claude/work/song/La_rotita_con_voz.demokit.json','w',encoding='utf8').write(out)
print('ok',len(out)//1024,'KB |',{t['id']:len(t['notes']) for t in tracks})
json.dump({'S':S,'C':C,'O':O,'TOTAL':TOTAL},open('/home/claude/work/song/fusion_meta.json','w'))
