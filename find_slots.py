import json,sys,re
from datetime import datetime,timedelta,date
F,days=sys.argv[1],sys.argv[2].split(',')
wins=[w.strip().replace('–','-').split('-') for w in sys.argv[3].split(',')]
MIN=int(sys.argv[4]) if len(sys.argv)>4 else 30
TRAVEL=int(sys.argv[5]) if len(sys.argv)>5 else 60
FAR=re.compile(r"ירושלים|jerusalem|תל[ -]?אביב|tel[ -]?aviv|חיפה|haifa|באר[ -]?שבע|be'?er[ -]?sheva|הרצליה|herzliya|פתח[ -]?תקו|petah|רמת[ -]?גן|ramat[ -]?gan|נתניה|netanya|רעננה|ra'?anana|ראשון[ -]?לציון|rishon|אשדוד|ashdod|נתב\"?ג|airport|ben[ -]?gurion|שדה התעופה|הדסה|hadassah|שיבא|sheba|איכילוב|ichilov|טכניון|technion|כפר[ -]?סבא|kfar[ -]?saba|מודיעין|modiin",re.I)
HE=['יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי','שבת','יום ראשון']
d=json.load(open(F))
if d.get('nextPageToken'): print('WARNING: more pages', file=sys.stderr)
ev=[]
for e in d['events']:
    if 'dateTime' not in e['start'] or e.get('transparency')=='transparent': continue
    me=[a.get('responseStatus') for a in e.get('attendees',[]) if a.get('self')]
    st=me[0] if me else None
    if st=='declined': continue
    s=datetime.fromisoformat(e['start']['dateTime'][:19]); t=datetime.fromisoformat(e['end']['dateTime'][:19])
    note={'needsAction':'עוד לא ענית','tentative':'אולי'}.get(st)
    loc=e.get('location','')
    far=bool(FAR.search(e.get('summary','')+' '+('' if loc.startswith('http') else loc)))
    if far: note=((note+' · ') if note else '')+'מחוץ לוויצמן'
    ev.append((s,t,e.get('summary','').strip(),note,far))
ev.sort()
def ampm(x):
    h=x.hour%12 or 12; return f"{h}:{x.minute:02d}"
def ent(a,b): return f"{ampm(a)}–{ampm(b)} {'am' if b.hour<12 else 'pm'}" if (a.hour<12)==(b.hour<12) else f"{ampm(a)} am–{ampm(b)} pm"
def m(x): return [x[2],x[0].strftime('%H:%M'),x[1].strftime('%H:%M')]+([x[3]] if x[3] else [])
out=[]
for day in sorted(days):
    D=date.fromisoformat(day.strip()); de=[x for x in ev if x[0].date()==D]
    for w0,w1 in wins:
        W0=datetime.combine(D,datetime.strptime(w0,'%H:%M').time()); W1=datetime.combine(D,datetime.strptime(w1,'%H:%M').time())
        cur=W0; gaps=[]; pad_=lambda x:timedelta(minutes=TRAVEL if x[4] else 0)
        for x in sorted(de,key=lambda x:x[0]-pad_(x)):
            s=x[0]-pad_(x); t=x[1]+pad_(x)
            if t<=cur or s>=W1: continue
            if s>cur: gaps.append((cur,min(s,W1)))
            cur=max(cur,t)
        if cur<W1: gaps.append((cur,W1))
        for g0,g1 in gaps:
            if g1-g0<timedelta(minutes=MIN): continue
            b=[x for x in de if x[1]<=g0]; a=[x for x in de if x[0]>=g1]
            bt=max(x[1] for x in b) if b else None
            out.append({"he":f"{HE[D.weekday()]}, {D.day}.{D.month}","en":f"{D.strftime('%A')}, {D.strftime('%b')} {D.day}",
              "s":g0.strftime('%H:%M'),"e":g1.strftime('%H:%M'),"et":ent(g0,g1),
              "b":[m(x) for x in b if x[1]==bt] or None,"a":m(a[0]) if a else None})
print(json.dumps(out,ensure_ascii=False))
