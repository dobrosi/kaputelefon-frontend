# TODO
update at public szerver (github) + version number handling
- egyreszt kell vmi public tarhely. Github idealis lenne a celra
- az update url cim akar lehet konfigolhato is, szal ha bezarjak a githubot, lesz recovery. Az alap otlet az volt, h a mutyi http klienskent letolti es kesz. A triggert a webconfig ui-bol kapja. semmi automata update.
- problema viszont a verzioszam ellenorzese. el akarom kerulni azt, h a mutyi github/gitlab api-t hasznaljon. Erre kene vmi megoldas. Akar az is lehet, h a webconfig felulet intezi. (lekeri a verzioszamot a mutyitol, felnez githubra lekeri, mik a lehetosegek, es ha van ujabb, akkor ratolja. Igy lehet, h a progress-kijelzes is egyszerusodik)

# Dokumentálás
Ahogy az IKEA csinalja. Celkozonseg: telefont kezelni tudo, de SIP-hez semmit nem erto emberek
https://www.overleaf.com/project/6087b99d3619c884e0701cfa

# Tesztelés
androidon, iphoneon

# Beüzemelés
1. Tápot kell neki adni. Szét kell szerelni és a USB micro aljzatba be kell dugni egy micro USB telefontöltőt vagy micro USB kábelt.
2. Konfigurációs mód: a kapunyitő gombbal lehetséges: úgy, hogy a beszélő a helyén van. Mivel a kapunyito gomb csak úgy nyomható meg, hogy le van véve a beszélő, ezért a hook switchet (amit a bészelő megnyom, amikor a helyen van),
   a beüzemelőnek kell nyomnia, miközben a kapunyitót nyomkodja. 
   
   Lépések: 
    - beszélőt levenni
    - hookswitch gombot benyomni és nyomva tartani kézzel
    - (kapunyito gomb) hosszan nyomni : STA mód
    - (kapunyito gomb) három gyors egymásutáni rövid benyomása:  AP mód

Kesőbb APSTA mód lesz, nem lesz kettő.

## Infó
AP vagy STA módban is:
- kapunyitó gomb rövid nyomás: teszt hívás
- kapunyito gomb hosszú nyomás: WPS PBS session (ezzel lehet a router-hez egyszerűen WPS használatával kapcsolódni)

A beszélő visszahelyezésével a konfigárciós mód véget ér.

## Known issues
Mivel az az uzemallapot, amikor 5V (USB) van, viszont vonali feszultseg nincs, nalam nem fordul elo, ezert ez igy kevesse  tesztelt. Igy az van, hogy minden session utan, amikor amugy resetbe/sleepbe mene a kutyu, itt nem megy.
 -> ilyenkor manualisan ki kell huzni az tapot es vissza kell dugni.

## Fejlesztési infó
Index.html tömörített formátum előállítása:
```
gzip -f < index.html > index.html.gz
```
###Travis build
https://app.travis-ci.com/github/dobrosi/jozsefutca
###Releases
https://github.com/dobrosi/jozsefutca/releases

# REST API
Első draft HTML:

```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><html><head><META http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>
<div>
    <form action="http:///kapu" method="post" target="_blank" onsubmit="try {return window.confirm(&quot;Lehetséges, hogy ez az űrlap nem fog megfelelően működni bizonyos biztonsági okokból kifolyólag.\nFolytatja?&quot;);} catch (e) {return false;}">
        <h3>Kaputelefon Típus</h3>
        <input type="radio" name="type" value="codefon" checked>
        <label>Codefon</label><br>
        <input type="radio" name="type" value="MKT" disabled>
        <label>MKT</label><br>
        <input type="radio" name="type" value="proel" disabled>
        <label>Rainman</label><br><br>
        <label>Kód:</label>
        <input type="text" name="code" title="1-127"><br>
        <input type="submit" name="submitbutton" value="Submit">
    </form>
    <form action="http:///auth" method="post" target="_blank" onsubmit="try {return window.confirm(&quot;Lehetséges, hogy ez az űrlap nem fog megfelelően működni bizonyos biztonsági okokból kifolyólag.\nFolytatja?&quot;);} catch (e) {return false;}">
        <h3>Wifi</h3>
        <label>SSID:</label>
        <input type="text" name="SSID"><br>
        <label>Jelszó:</label>
        <input type="password" name="wpass"><br>
        <input type="submit" name="submitbutton" value="Submit">
    </form>
    <form action="http:///contact" method="post" target="_blank" onsubmit="try {return window.confirm(&quot;Lehetséges, hogy ez az űrlap nem fog megfelelően működni bizonyos biztonsági okokból kifolyólag.\nFolytatja?&quot;);} catch (e) {return false;}">
        <h3>VOIP kontakt</h3>
        <label>Hivandó kontakt:</label>
        <input type="text" name="contact"><br><br>
        <input type="submit" name="submitbutton" value="Submit">
    </form>
    <form action="http:///account" method="post" target="_blank" onsubmit="try {return window.confirm(&quot;Lehetséges, hogy ez az űrlap nem fog megfelelően működni bizonyos biztonsági okokból kifolyólag.\nFolytatja?&quot;);} catch (e) {return false;}">
        <h3>VOIP regisztráció</h3>
        <label>Account:</label>
        <input type="text" name="acc"><br>
        <label>Jelszó:</label>
        <input type="password" name="spass"><br>
        <label>Transfer:</label>
        <select name="ttype">
            <option value="UDP">UDP</option>
            <option value="TCP">TCP</option>
        </select><br>
        <label>Outbound:</label>
        <input type="text" name="outbound"><br>
        <input type="submit" name="submitbutton" value="Submit">
    </form>
</div>
</body></html>
```
Vannak a fileok, amik a sip stack-bol vannak:
- /accounts, 
- /config (ez szerintem nem lesz vegul)
- /contacts. Csatolok peldakat. Egyszerusodne az eletem, ha ezek igy maradnanank, de nem nagy munka atcsinalni ezeket.

Van meg a /ota, ahova PUT-tal be lehet tolteni az applikacio binarist. Az update fejlesztes kozben is igy megy.
Tehat:
/ota: binaris applikacio update
pelda: (az elso sor lekeri az IP-t multicast dnssel. ezt tamogatja az android meg az ios is)
```bash
$(eval IP := $(shell avahi-resolve -n kaputelefon.local | head -1 | cut -f 2))
curl -# -X PUT --data-binary @$(APP_BIN) $(IP)/ota -o /dev/null
curl -X PUT $(IP)/reset   --> ujrainditas, lasd lejjebb
```
## Fájlok

### /file/accounts - *GET, PUT*
Lista a SIP accountokrol.
[Formatum](https://github.com/baresip/baresip/blob/master/docs/examples/accounts)

```
#
# SIP accounts - one account per line
#
# Displayname <sip:user@domain;uri-params>;addr-params
#
#  uri-params:
#    ;transport={udp,tcp,tls}
#
#  addr-params:
#    ;answermode={manual,early,auto}
#    ;audio_codecs=opus/48000/2,pcma,...
#    ;auth_user=username
#    ;auth_pass=password
#    ;call_transfer=no
#    ;mediaenc={srtp,srtp-mand,srtp-mandf,dtls_srtp,zrtp}
#    ;medianat={stun,turn,ice}
#    ;mwi=no
#    ;outbound="sip:primary.example.com;transport=tcp"
#    ;outbound2=sip:secondary.example.com
#    ;ptime={10,20,30,40,...}
#    ;regint=3600
#    ;pubint=0 (publishing off)
#    ;regq=0.5
#    ;sipnat={outbound}
#    ;stunuser=STUN/TURN/ICE-username
#    ;stunpass=STUN/TURN/ICE-password
#    ;stunserver=stun:[user:pass]@host[:port]
#    ;video_codecs=h264,h263,...
#
# Examples:
#
#  <sip:user@domain.com;transport=tcp>;auth_pass=secret
#  <sip:user@1.2.3.4;transport=tcp>;auth_pass=secret
#  <sip:user@[2001:df8:0:16:216:6fff:fe91:614c]:5070;transport=tcp>;auth_pass=secret
#
#<sip:root@domain>;auth_pass=PASSWORD
<sip:kapu@sip.antisip.com;transport=udp>;auth_pass=12345678;outbound="sip:sip.antisip.com:9090"

```
### /file/contacts - *GET, PUT*
Lista a kontaktokrol. Az elsot hivja csongeteskor. Ez veglegesben szerintem az elso 2 lesz. 
[Formatum](https://github.com/baresip/baresip/blob/master/docs/examples/)

```
"boborjan" <sip:boborjan@sip.antisip.com>
"kgyuszi" <sip:kgyuszi@sip.antisip.com>
"echo" <sip:echo@sip.antisip.com>
"andris" <sip:dobrosi@sip.antisip.com>
```

Pl. shell scriptbol:

```bash
#!/bin/bash

IP=`avahi-resolve -n kaputelefon.local | head -1 | cut -f 2`

if test $1 = put; then
echo uploading $2
curl -X PUT --data-binary @$2 $IP/$2
else
curl $IP/$2
fi
```

### / *GET, (PUT)*
Es akkor valszeg lesz egy /index.html, ahova feltoltheted az uit. Legalabbi fejlesztes alatt, mert a shipping verzioban valszeg bele kell forditani (legalabbis az appal egyutt kell updatelni a html uit is) Ez egy tomoritett gzip fajl es az eszkoz igy kuldi:
```
Content-Encoding: gzip
```

## Nem fájlok

### /api/restart - *GET*
Újraindítás.

### /api/restart_to_conf - *GET*
Újraindítás a konfigurációs módban maradással.

### /api/auth - *GET, PUT*
wifi parameterek

```
curl -X PUT 192.168.0.20/wifi_settings?password=12345678\&ssid=f
```

### /api/icom - *GET, PUT*
Itt ezeket lehet beallitani:
- gvol: kapu volume (csengetes hangero)
- rvol: ring volume (ajtocsengo hangero)
- cvol: config mode beep hangero
- mvol: microphone volume
- hvol: headphone volume
- type: kaputelefon tipus: codefon,mkt,laskomex (jelenleg csak codefon)
- code: kapukod (marmint a keszulek kodja: 1-255)

```
curl -X PUT 192.168.0.47/icom?gvol=8
```

### /api/factory_reset - *GET, PUT*
Factory reset.

### /api/mac - *GET*
MAC cim. Ennek majd az eol deploymentnel lesz ertelme.

### /api/testcall - *GET*
Teszthivas. Ilyen button is kell majd a guira.

### /api/appversion - *GET*
Applikacio verziot lehet itt lekerni.

### /api/ota - *PUT*
Firmware feltöltés.

```
curl -X PUT --binary-data @kapu_voip-kapu_voip.0.1.14.fw 192.168.0.47/api/ota
```

### /file/html - *PUT*
Index.html feltöltés.

```
curl -X PUT --binary-data @index.html.gz 192.168.0.47/file/html
```
