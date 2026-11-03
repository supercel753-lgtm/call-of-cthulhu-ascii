#!/usr/bin/env python3
"""Gera os recursos rasterizados originais da remasterização.
Arte 100% original e determinística, desenhada em pixels e exportada como PNG.
A execução requer Pillow; o jogo distribuído NÃO requer Python.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import random, math, wave, struct
ROOT=Path(__file__).resolve().parents[1]/'assets'
for p in ('sprites','tiles','panoramas','audio'):(ROOT/p).mkdir(parents=True,exist_ok=True)
REG={
 'porto': {'sky':(17,31,42),'floor':(72,88,87),'wall':(67,75,80),'accent':(234,177,91),'shade':(28,45,54),'material':'wood'},
 'vila': {'sky':(21,37,40),'floor':(86,92,76),'wall':(92,99,84),'accent':(225,174,104),'shade':(35,49,48),'material':'stone'},
 'mansao': {'sky':(43,32,42),'floor':(104,70,65),'wall':(105,79,84),'accent':(228,145,111),'shade':(40,30,42),'material':'wood'},
 'hospital': {'sky':(21,40,44),'floor':(91,112,108),'wall':(126,143,136),'accent':(179,219,190),'shade':(39,54,57),'material':'tile'},
 'grutas': {'sky':(15,27,45),'floor':(63,77,97),'wall':(83,98,119),'accent':(162,166,223),'shade':(27,39,64),'material':'rock'},
 'farol': {'sky':(14,32,38),'floor':(92,102,87),'wall':(112,126,109),'accent':(186,235,190),'shade':(32,51,52),'material':'stone'},
}
def blend(a,b,t):return tuple(int(x+(y-x)*t) for x,y in zip(a,b))
def darker(a,t=.22):return blend(a,(0,4,11),t)
def lighter(a,t=.20):return blend(a,(247,230,199),t)

# 32x32 tiles with material-specific pixel clusters and palettes.
TILE_KINDS=['floor0','floor1','floor2','floor3','wall0','wall1','water','threshold','moss','stain','floor4','wall2']
for rid,p in REG.items():
    sheet=Image.new('RGBA',(32*len(TILE_KINDS),32)); d=ImageDraw.Draw(sheet)
    for i,kind in enumerate(TILE_KINDS):
        r=random.Random(f'{rid}-{kind}-2026'); ox=i*32
        base=p['floor'] if ('floor' in kind or kind in ('moss','stain','threshold')) else p['wall']
        if kind=='water':base=blend(p['sky'],(47,102,123),.48)
        if kind in ('stain','moss'):base=darker(base,.08)
        d.rectangle((ox,0,ox+31,31),fill=base)
        for _ in range(90 if kind!='wall0' else 130):
            x,y=r.randrange(32),r.randrange(32);size=r.choice([1,1,1,2,3]);tone=lighter(base,r.uniform(.03,.13)) if r.random()>.55 else darker(base,r.uniform(.05,.22))
            d.rectangle((ox+x,y,ox+min(31,x+size),min(31,y+r.choice([0,0,1,2]))),fill=tone)
        if kind.startswith('floor'):
            if p['material']=='wood':
                for y in (3,14,25):
                    yy=(y+i*3)%32;d.line((ox,yy,ox+31,yy),fill=darker(base,.33),width=1)
                    for x in (4,20):d.line((ox+(x+i*5)%32,yy+1,ox+(x+i*5)%32,min(31,yy+8)),fill=darker(base,.20))
                for _ in range(12):
                    x,y=r.randrange(32),r.randrange(32);d.line((ox+x,y,ox+min(31,x+r.randrange(2,9)),y),fill=lighter(base,.14))
            elif p['material']=='tile':
                for x in (0,16,31):d.line((ox+x,0,ox+x,31),fill=darker(base,.26))
                for y in (0,16,31):d.line((ox,y,ox+31,y),fill=darker(base,.26))
                d.line((ox+1,2,ox+14,2),fill=lighter(base,.09))
            elif p['material']=='rock':
                for _ in range(12):
                    x,y=r.randrange(32),r.randrange(32);d.line((ox+x,y,ox+min(31,x+4),min(31,y+2)),fill=darker(base,.28))
            else:
                for y in (0,16): d.line((ox,y,ox+31,y),fill=darker(base,.17))
                for x in (0,16):d.line((ox+x,0,ox+x,15),fill=darker(base,.16))
                for x in (8,24):d.line((ox+x,16,ox+x,31),fill=darker(base,.16))
        elif kind.startswith('wall'):
            top=lighter(base,.21)
            d.rectangle((ox,0,ox+31,5),fill=darker(base,.25))
            d.line((ox,5,ox+31,5),fill=top,width=2)
            if p['material']=='rock':
                for _ in range(19):
                    x,y=r.randrange(32),r.randrange(7,32)
                    d.line((ox+x,y,ox+min(31,x+r.randrange(2,10)),min(31,y+r.randrange(1,5))),fill=darker(base,.42))
            else:
                for y in (13,23):
                    d.line((ox,y,ox+31,y),fill=darker(base,.25))
                    for x in (5+(y==23)*9,21+(y==23)*7):d.line((ox+x,y,ox+x,y+7),fill=darker(base,.30))
            if kind=='wall2':
                d.line((ox+17,12,ox+14,18,ox+20,23,ox+12,31),fill=darker(base,.53),width=1)
        if kind=='water':
            for j in range(7):
                y=2+j*5;start=r.randrange(0,15)
                d.line((ox+start,y,ox+min(31,start+r.randrange(9,17)),y),fill=lighter(base,r.uniform(.2,.42)),width=1)
                d.line((ox+start+3,y+2,ox+min(31,start+10),y+2),fill=darker(base,.25))
        if kind=='threshold':
            d.rectangle((ox,4,ox+31,27),fill=darker(base,.36));d.line((ox,5,ox+31,5),fill=lighter(base,.30),width=2)
            for x in range(3,31,7):d.rectangle((ox+x,12,ox+x+2,14),fill=lighter(base,.15))
        if kind=='moss':
            for _ in range(28):
                x,y=r.randrange(32),r.randrange(32);green=(r.randrange(45,77),r.randrange(94,129),r.randrange(68,93))
                d.rectangle((ox+x,y,ox+min(31,x+2),min(31,y+2)),fill=green)
        if kind=='stain':
            for _ in range(7):
                x,y=r.randrange(6,26),r.randrange(6,26);radius=r.randrange(2,6);d.rectangle((ox+x-radius,y-radius//2,ox+x+radius,y+radius//2),fill=darker(base,.28))
    sheet.save(ROOT/'tiles'/f'{rid}.png',optimize=True)

SKIN=(202,166,132); HAIR=(40,35,38)
PALETTES={
'investigator':{'coat':(70,93,106),'edge':(129,154,158),'trouser':(51,56,65),'hat':(43,49,57),'skin':(201,171,140),'accent':(218,178,101)},
'elias':{'coat':(87,104,99),'edge':(137,156,137),'trouser':(54,65,68),'hat':(83,91,90),'skin':(192,147,110),'accent':(212,169,112)},
'mara':{'coat':(117,83,91),'edge':(167,125,123),'trouser':(69,60,68),'hat':(42,42,55),'skin':(219,173,146),'accent':(211,177,109)},
'helena':{'coat':(112,95,125),'edge':(164,137,157),'trouser':(89,76,101),'hat':(72,53,61),'skin':(218,185,165),'accent':(221,168,156)},
'doctor':{'coat':(191,195,169),'edge':(232,222,195),'trouser':(57,91,89),'hat':(77,69,65),'skin':(210,175,152),'accent':(128,189,161)},
'patient':{'coat':(153,161,151),'edge':(191,191,174),'trouser':(109,117,117),'hat':(58,53,53),'skin':(192,170,156),'accent':(162,198,193)},
'creature':{'coat':(43,85,86),'edge':(91,143,134),'trouser':(25,44,56),'hat':(39,62,71),'skin':(98,137,128),'accent':(214,100,99)},
}
# One atlas per character: columns 0 idle, 1/2 walking, 3 stealth,
# 4 interaction, 5 hurt, 6 death, 7 breathing; rows N/E/S/W.
CW,CH=32,40
for name,p in PALETTES.items():
 im=Image.new('RGBA',(CW*8,CH*4));d=ImageDraw.Draw(im)
 for direction in range(4):
  for pose in range(8):
   ox,oy=pose*CW,direction*CH
   def rect(box,color):d.rectangle((ox+box[0],oy+box[1],ox+box[2],oy+box[3]),fill=color)
   def line(coords,color,width=1):d.line([(ox+x,oy+y) for x,y in coords],fill=color,width=width)
   if pose==6:
    # Death: rotated silhouette, eyes dim, body along floor.
    rect((3,31,29,33),(13,20,24,110))
    rect((6,26,26,30),darker(p['coat'],.28));rect((13,21,24,26),p['coat']);rect((25,23,30,26),p['skin'])
    for x in (9,16):rect((x,28,x+3,29),p['edge'])
    continue
   duck=(pose==3); rise=3 if duck else 0
   footdelta=2 if pose==1 else -2 if pose==2 else 0
   sway=1 if pose==7 else 0
   # Soft 2px pixel shadow along boots.
   rect((8,37,25,38),(11,17,22,110))
   for side in (0,1):
    x=10 if side==0 else 19
    z=footdelta if side==0 else -footdelta
    rect((x,27-rise+max(0,z),x+4,35-rise+max(0,z)),p['trouser'])
    rect((x-1,33-rise+max(0,z),x+5,36-rise+max(0,z)),darker(p['trouser'],.50))
    rect((x,28-rise,x+1,32-rise),lighter(p['trouser'],.22))
   if name=='creature':
    # Humanoid abomination: segmented tentacles and bioluminescence.
    rect((9,13-rise,23,31-rise),p['coat']);rect((10,14-rise,11,28-rise),p['edge']);rect((20,16-rise,21,27-rise),darker(p['coat'],.35))
    for j in range(4):
     x=7+j*5
     line([(x,29-rise),(x+(j%2)*2-1,35-rise),(x+(j%2)*3-3,37-rise)],p['edge'],2)
    for x in (10,21):
     line([(x,14-rise),(x-4,19-rise),(x-6,28-rise)],p['edge'],2)
    rect((9,6-rise,23,18-rise),p['hat']);rect((8,10-rise,25,12-rise),p['skin'])
    for x in (11,19):rect((x,11-rise,x+2,13-rise),p['accent'])
    rect((13,15-rise,18,16-rise),darker(p['skin'],.35));rect((14,20-rise,18,21-rise),p['accent'])
    if pose==5:rect((8,9-rise,25,11-rise),(195,55,61))
    continue
   # Coat hem with shading and patterned clusters.
   rect((8,16-rise,24,30-rise),darker(p['coat'],.24))
   rect((10,16-rise,22,28-rise),p['coat']);rect((11,17-rise,12,26-rise),p['edge'])
   rect((21,17-rise,22,27-rise),darker(p['coat'],.43))
   for y in (20,24,28):rect((17,y-rise,18,y-rise),p['accent'])
   rect((8,28-rise,24,30-rise),darker(p['coat'],.43))
   # Arms. Interaction raises right arm; stealth curls arms.
   leftx=5 if pose==1 else 6
   rect((leftx,17-rise,leftx+3,25-rise),darker(p['coat'],.13));rect((leftx+1,18-rise,leftx+1,23-rise),p['edge'])
   if pose==4:
    rect((25,14-rise,28,19-rise),p['coat']);rect((26,11-rise,29,14-rise),p['skin'])
   else:
    rect((24,17-rise,27,24-rise),darker(p['coat'],.20));rect((25,19-rise,26,22-rise),p['edge'])
   rect((6,24-rise,9,26-rise),p['skin']);rect((24,24-rise,27,26-rise),p['skin'])
   # Neck + face and hair, different direction placements.
   rect((13,12-rise,19,18-rise),p['skin']);rect((10,7-rise,22,15-rise),p['skin'])
   rect((10,7-rise,22,9-rise),darker(p['skin'],.24))
   if direction==0: # back
    rect((10,6-rise,22,13-rise),p['hat']);rect((11,11-rise,21,14-rise),darker(p['hat'],.20))
   elif direction==1:
    rect((19,10-rise,21,11-rise),(19,31,38));rect((20,12-rise,22,13-rise),darker(p['skin'],.38))
   elif direction==3:
    rect((11,10-rise,13,11-rise),(19,31,38));rect((10,12-rise,12,13-rise),darker(p['skin'],.38))
   else:
    rect((12,10-rise,14,11-rise),(21,29,35));rect((19,10-rise,21,11-rise),(21,29,35))
    rect((15,12-rise,17,13-rise),darker(p['skin'],.31))
   # Shape hats/hair for distinct NPC characters.
   if name in ('investigator','elias'):
    rect((9,4-rise,23,8-rise),p['hat']);rect((6,9-rise,27,10-rise),p['hat']);rect((12,3-rise,21,4-rise),lighter(p['hat'],.2));rect((9,7-rise,23,8-rise),p['accent'])
   elif name in ('mara','helena'):
    rect((9,3-rise,23,7-rise),p['hat']);rect((8,6-rise,10,18-rise),p['hat']);rect((22,6-rise,24,18-rise),p['hat'])
    if name=='helena':rect((8,13-rise,10,22-rise),lighter(p['hat'],.12))
   elif name=='doctor':
    rect((10,4-rise,22,6-rise),p['hat']);rect((11,3-rise,21,3-rise),p['edge'])
    rect((10,19-rise,13,26-rise),p['edge']);rect((21,19-rise,23,26-rise),p['edge'])
    rect((17,18-rise,18,20-rise),(133,55,59))
   elif name=='patient':
    rect((10,4-rise,22,7-rise),p['hat']);rect((13,12-rise,19,14-rise),darker(p['skin'],.35))
    rect((10,22-rise,22,23-rise),p['edge'])
   if pose==5: # bright red abrasion + recoiling sprite
    rect((8,19-rise,11,23-rise),(175,71,71));rect((22,10-rise,24,13-rise),(179,76,68))
   if duck:rect((10,16,22,18),darker(p['coat'],.21))
 im.save(ROOT/'sprites'/f'{name}.png',optimize=True)

# Objects use 32x40 raster cells, each prop in an atlas.
PROPS=['crate','barrel','lamp','tree','bench','table','shelf','bed','pillar','stalagmite','bones','door','manifesto','jornal','quadro','diario','prontuario','selo','inscricao','ritual','generic']
OBJ=Image.new('RGBA',(32*len(PROPS),40));D=ImageDraw.Draw(OBJ)
for i,k in enumerate(PROPS):
 x=i*32; r=random.Random(k)
 def R(a,b,c,d,col):D.rectangle((x+a,b,x+c,d),fill=col)
 def L(points,col,w=1):D.line([(x+xx,yy) for xx,yy in points],fill=col,width=w)
 outline=(25,32,38);gold=(212,173,103);bone=(194,191,166);oak=(116,84,65);steel=(98,130,141)
 if k=='crate':
  R(4,14,28,33,outline);R(6,15,26,31,oak);R(6,16,26,18,(155,120,84));R(8,20,24,21,(71,60,52))
  L([(7,19),(25,30)],(67,52,47),2);L([(25,19),(7,30)],(178,131,87),2)
  for y in (15,30):R(6,y,8,y+1,(180,162,114));R(24,y,26,y+1,(180,162,114))
 if k=='barrel':
  R(9,11,23,34,outline);R(7,14,25,30,oak);R(9,12,23,14,(163,123,81))
  for y in (17,26):R(8,y,24,y+2,steel);R(10,y+1,21,y+1,(154,166,159))
  R(9,31,23,33,(94,71,64))
 if k=='lamp':
  R(15,17,17,35,steel);R(13,34,20,36,outline);R(9,5,23,19,outline);R(11,8,21,18,(215,178,105))
  R(12,10,20,17,(251,224,146));R(14,11,17,16,(255,247,191));R(9,4,23,6,steel);R(11,19,21,20,steel)
 if k=='tree':
  R(14,21,19,37,oak)
  for cx,cy,w in [(17,10,10),(11,18,9),(23,17,9),(17,23,11)]:
   D.ellipse((x+cx-w,cy-w//2,x+cx+w,cy+w//2+5),fill=(45+r.randrange(8),83+r.randrange(15),67+r.randrange(13)))
  for px,py in [(8,16),(12,10),(22,13),(19,22)]:R(px,py,px+2,py+2,(99,133,78))
 if k=='bench':
  R(3,18,29,23,oak);R(4,14,28,17,(151,110,75));R(5,25,8,34,steel);R(24,25,27,34,steel)
  for q in (10,17,24):R(q,19,q+1,21,(69,49,42))
 if k=='table':
  R(3,13,29,22,outline);R(4,12,28,19,oak);R(7,20,9,34,oak);R(23,20,25,34,oak)
  R(6,13,26,14,(172,132,84));R(12,10,19,14,bone);R(14,11,17,12,(94,77,73))
 if k=='shelf':
  R(5,5,27,37,outline);R(7,7,25,35,oak)
  for y in (16,26):R(7,y,25,y+2,(59,48,47))
  for j in range(12):
   xx=8+(j*5)%16;yy=8+(j//4)*10;R(xx,yy,xx+1,yy+r.choice([5,6,7]),r.choice([(134,76,65),(94,111,119),(167,135,92)]))
 if k=='bed':
  R(6,4,26,36,outline);R(8,6,24,35,(121,137,130));R(10,7,22,14,bone);R(9,16,24,32,(91,126,132))
  R(10,18,22,19,(126,151,152));R(10,30,22,32,(73,109,120))
 if k=='pillar':
  R(10,2,23,37,outline);R(8,4,25,8,(123,138,141));R(11,9,22,32,(112,113,110))
  R(9,32,24,37,(87,99,103));R(12,10,14,30,(158,151,136))
  L([(19,11),(17,16),(20,19),(15,26)],(65,70,75))
 if k=='stalagmite':
  L([(4,35),(14,8),(22,28),(26,35)],outline,4)
  D.polygon([(x+6,34),(x+15,9),(x+22,34)],fill=(106,114,136))
  L([(15,11),(12,32)],(169,166,177),2)
 if k=='bones':
  R(9,27,24,30,bone)
  for dx,dy in [(8,21),(23,19),(15,17),(10,29)]:D.ellipse((x+dx,dy,x+dx+5,dy+4),fill=bone)
  L([(8,22),(24,29)],bone,2);L([(10,30),(25,19)],bone,2);R(14,16,16,19,(64,54,55))
 if k=='door':
  R(5,2,27,38,outline);R(7,3,25,37,(66,78,84));R(9,6,23,35,(110,101,89));R(10,8,22,20,(88,90,87))
  R(21,23,23,25,gold);R(9,29,24,31,(59,65,71));R(7,35,27,38,steel)
 if k in ('manifesto','jornal','diario','prontuario'):
  R(7,17,26,34,outline)
  if k=='diario':
   R(8,17,26,33,(104,67,78));R(10,19,24,31,(144,100,98));R(10,18,12,32,gold);R(17,23,19,25,gold)
  elif k=='jornal':
   R(8,16,26,31,bone);R(10,18,23,21,(68,68,70));
   for y in (24,27,30):R(10,y,23,y,(112,111,107))
  else:
   R(9,18,25,33,bone);R(10,20,21,21,(77,84,84))
   for y in (24,27,30):R(12,y,24,y,(112,103,98))
   if k=='prontuario':R(17,18,21,21,(142,54,57))
 if k=='quadro':
  R(5,4,27,34,outline);R(7,6,25,31,gold);R(9,8,23,29,(39,56,79))
  D.polygon([(x+9,28),(x+16,12),(x+23,28)],fill=(86,103,115));R(14,14,16,23,(119,145,147));R(12,26,20,27,(178,102,103))
 if k=='selo':
  D.polygon([(x+16,7),(x+27,20),(x+16,34),(x+5,20)],fill=(52,73,92));D.polygon([(x+16,10),(x+24,20),(x+16,30),(x+8,20)],fill=(136,156,180))
  L([(16,11),(12,21),(19,24),(16,30)],(42,50,70),2);R(14,18,18,21,(173,215,210))
 if k=='inscricao':
  R(4,9,28,36,outline);R(6,11,26,33,(95,105,123))
  for yy in (14,20,26):
   for xx in (9,16,23):R(xx,yy,xx+2,yy+3, r.choice([(169,182,198),(202,172,129),(117,143,164)]))
  L([(13,13),(20,20),(13,26)],(30,45,70))
 if k=='ritual':
  D.ellipse((x+2,11,x+30,39),outline=gold,width=2);D.ellipse((x+8,17,x+24,33),outline=(119,183,167),width=2)
  L([(16,13),(26,29),(6,29),(16,13)],(216,166,123),2);R(14,24,18,27,(197,224,178))
 if k=='generic':
  R(8,16,25,32,outline);R(9,17,24,31,(102,124,129));R(14,22,20,26,gold)
OBJ.save(ROOT/'sprites'/'props.png',optimize=True)

# Story panorama illustrations with pixel silhouettes, haze and locally shaped set pieces.
PW,PH=480,168
for name,p in REG.items():
 r=random.Random(name+'-panorama')
 im=Image.new('RGB',(PW,PH),p['sky']);d=ImageDraw.Draw(im)
 sky=p['sky']
 for y in range(PH):
  t=y/PH; d.line((0,y,PW,y),fill=blend(sky,(73,76,77),.42*t))
 # stars / weather
 for _ in range(160):
  x,y=r.randrange(PW),r.randrange(110);c=blend(sky,p['accent'],r.uniform(.1,.48))
  d.rectangle((x,y,x+r.choice([0,0,1]),y),fill=c)
 # clouds and distant hills
 for layer in range(3):
  col=blend(sky,(5,14,22),.18+.13*layer)
  horizon=88+layer*15
  pts=[(0,PH)]+[(x, horizon+int(8*math.sin(x/24+layer)+6*math.sin(x/39)+r.randrange(-3,4))) for x in range(0,PW+12,12)]+[(PW,PH)]
  d.polygon(pts,fill=col)
 def rect(a,b,c,e,color):d.rectangle((a,b,c,e),fill=color)
 def line(points,col,w=1):d.line(points,fill=col,width=w)
 building=darker(p['wall'],.52);hi=blend(p['wall'],p['accent'],.20)
 if name=='porto':
  rect(0,126,480,167,(20,45,55))
  for x in (65,170,305):
   line([(x,136),(x,44),(x+46,44),(x+46,50)],building,5);line([(x,50),(x+78,80)],building,2)
   rect(x-26,98,x+46,127,building)
   for wx in range(x-20,x+39,14):rect(wx,106,wx+7,114,hi)
  d.polygon([(304,124),(435,124),(410,142),(335,142)],fill=(38,46,50))
  for y in (144,153,164):
   for x in range(0,PW,31):line([(x,y),(x+13,y)],(65,108,122),2)
 elif name=='vila':
  for x,y,w in [(35,84,88),(116,70,102),(245,77,92),(344,95,92)]:
   d.polygon([(x-8,y),(x+w//2,y-35),(x+w+8,y),(x+w,y+50),(x,y+50)],fill=building)
   for wx in (x+15,x+w-23):rect(wx,y+6,wx+9,y+19,hi)
   rect(x+w//2-8,y+26,x+w//2+6,y+49,(29,35,38))
  rect(0,147,480,167,(39,55,50))
 elif name=='mansao':
  rect(94,78,387,143,building)
  d.polygon([(78,79),(235,29),(401,79)],fill=building)
  for bx in (120,198,285,346):
   rect(bx,87,bx+24,116,(32,35,42));rect(bx+5,91,bx+11,111,hi)
  rect(220,114,256,143,(20,25,33));rect(180,62,191,101,(40,35,42));rect(311,65,323,101,(40,35,42))
  for x in range(60,410,7):
   if r.random()<.19:line([(x,45),(x-18,115)],(86,60,57))
 elif name=='hospital':
  rect(72,67,406,139,building);rect(205,43,272,139,building);rect(229,33,248,63,hi)
  for y in (88,109):
   for x in range(88,392,35):rect(x,y,x+20,y+13,(26,44,48));rect(x+3,y+1,x+5,y+12,hi)
  rect(225,111,254,140,(22,41,42));rect(72,63,407,67,hi)
 elif name=='grutas':
  pts=[(0,0),(480,0),(480,44),(440,55),(398,25),(351,70),(312,42),(273,80),(234,43),(180,83),(127,36),(89,74),(37,22),(0,46)]
  d.polygon(pts,fill=darker(sky,.62))
  for x,w in ((25,51),(91,38),(354,46),(426,40)):
   d.polygon([(x,168),(x+w//2,88-r.randrange(7,25)),(x+w,168)],fill=building)
  d.ellipse((180,95,295,200),fill=blend(sky,(83,133,146),.48))
  rect(0,146,480,167,(23,47,65))
  for j in range(24):
   x=r.randrange(PW);y=r.randrange(142,167);line([(x,y),(x+15,y)],(75,106,139))
 elif name=='farol':
  rect(0,137,PW,PH,(30,65,67));d.polygon([(135,145),(195,120),(295,121),(365,145)],fill=building)
  d.polygon([(226,124),(241,43),(256,124)],fill=(88,103,99));rect(227,51,255,58,hi)
  rect(228,41,254,49,(21,35,39));rect(235,32,247,41,hi)
  d.polygon([(241,44),(0,0),(0,48)],fill=blend(sky,p['accent'],.35))
  d.polygon([(242,44),(480,2),(480,42)],fill=blend(sky,p['accent'],.28))
  for x in range(10,480,42):line([(x,152),(x+25,152)],(91,129,132),2)
 # Foreground fog strips and dither pixellated atmospheric rays
 fog=blend(p['sky'],(150,166,154),.29)
 for _ in range(12):
  x=r.randrange(PW);y=r.randrange(85,PH);length=r.randrange(20,100)
  line([(x,y),(min(PW,x+length),y)],fog,1)
 im.save(ROOT/'panoramas'/f'{name}.png',optimize=True)

# Procedural ORIGINAL WAV ambiences & sound effects. No third-party samples.
SR=16000

def sound(path,samples):
 with wave.open(str(ROOT/'audio'/path),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
  f.writeframes(struct.pack('<'+'h'*len(samples),*(int(max(-1,min(1,v))*32760) for v in samples)))

def ambient(name,index):
 # 9s seam-friendly low-frequency drone and different resonances; approximate periodicity.
 dur=9;n=dur*SR;r=random.Random(name);samples=[]
 tones=[(54,81),(57,106),(44,74),(62,113),(40,89),(51,97)][index]
 phase=r.random()*6.28
 for i in range(n):
  t=i/SR;u=t/dur
  drone=.24*math.sin(2*math.pi*tones[0]*t+phase)*(.7+.22*math.sin(2*math.pi*3*u))
  undertone=.13*math.sin(2*math.pi*tones[1]*t+phase*.5)*(.7+.3*math.cos(2*math.pi*2*u))
  wavelet=.07*math.sin(2*math.pi*(tones[1]*2)*t)*math.sin(2*math.pi*2*u)
  # use deterministic low-resolution soft noise and seamless window
  hush=.026*(r.random()*2-1)*(.8+.2*math.cos(2*math.pi*u))
  samples.append((drone+undertone+wavelet+hush)*.65)
 sound(name+'.wav',samples)
for idx,name in enumerate(REG):ambient(name,idx)

def effect(name,duration,kind):
 rng=random.Random(name);N=int(duration*SR);samples=[]
 for i in range(N):
  t=i/SR;u=t/duration;env=(1-u)**(2 if kind!='whisper' else 1)
  if kind=='step':v=(rng.random()*2-1)*.15*env + .09*math.sin(2*math.pi*(65+55*u)*t)*env
  elif kind=='pickup':v=(.23*math.sin(2*math.pi*(460+310*u)*t)+.09*math.sin(2*math.pi*880*t))*env
  elif kind=='door':v=(.20*(rng.random()*2-1)+.14*math.sin(2*math.pi*(40+35*u)*t))*env
  elif kind=='damage':v=(.33*math.sin(2*math.pi*(120-60*u)*t)+.11*(rng.random()*2-1))*env
  elif kind=='creature':v=.19*math.sin(2*math.pi*(45+20*math.sin(7*t))*t)*env+.11*(rng.random()*2-1)*env
  elif kind=='whisper':v=.11*(rng.random()*2-1)*env*math.sin(2*math.pi*9*t)
  else:v=.16*math.sin(2*math.pi*340*t)*env
  samples.append(v)
 sound(name+'.wav',samples)
for name,dur,kind in [('step',.13,'step'),('pickup',.40,'pickup'),('door',.63,'door'),('damage',.48,'damage'),('creature',1.08,'creature'),('whisper',1.4,'whisper'),('ui',.20,'ui')]:effect(name,dur,kind)
print('Original pixel-art assets generated:',len(list(ROOT.rglob('*.png'))),'PNG +',len(list(ROOT.rglob('*.wav'))),'WAV')
