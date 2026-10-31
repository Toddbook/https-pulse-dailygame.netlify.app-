// App-only script, added to the page by scripts/build-www.mjs after the Capacitor plugin scripts in vendor/.
// Adds what only the phone app can do: the native share sheet, haptics, a stats screen and a daily reminder.
// The game itself stays in public/index.html; this file only reads its saved stats and never changes them.
(function(){
  var Share=window.capacitorShare&&capacitorShare.Share;
  var Haptics=window.capacitorHaptics&&capacitorHaptics.Haptics;
  var Notes=window.capacitorLocalNotifications&&capacitorLocalNotifications.LocalNotifications;
  var native=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
  var PRIVACY_URL='https://https-pulse-dailygame-netlify-app.pages.dev/privacy.html';
  var CONTACT='tbookatz@gmail.com';
  var SITE='https://https-pulse-dailygame-netlify-app.pages.dev/';
  // The game adds the page address to shared results. In the app that is https://localhost/, so share the website instead.
  function fixLink(t){return String(t||'').replace(/https?:\/\/localhost\/?\S*/g,SITE);}

  // Android's web view has no navigator.share, and iOS's ignores navigator.vibrate, so route both to native plugins.
  if(native&&Share){
    navigator.share=function(d){return Share.share({text:fixLink(d.text),title:d.title,url:d.url,dialogTitle:'Share your PULSE result'});};
  }
  if(native&&Haptics){
    navigator.vibrate=function(p){
      try{
        if(Array.isArray(p)&&p.length>1)Haptics.notification({type:'ERROR'});
        else Haptics.impact({style:(+p||0)>40?'MEDIUM':'LIGHT'});
      }catch(e){}
      return true;
    };
  }

  function readJSON(key,fallback){try{var raw=localStorage.getItem(key);if(raw)return Object.assign({},fallback,JSON.parse(raw));}catch(e){}return Object.assign({},fallback);}
  function writeJSON(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
  function stats(){var s=readJSON('pulse:web:v1',{streak:0,best:0,lastPlayed:null,results:{}});if(!s.results)s.results={};return s;}
  var prefs=readJSON('pulse:app:v1',{remind:false,hour:18});
  function savePrefs(){writeJSON('pulse:app:v1',prefs);}

  // Same calendar the game uses: the UK date, so a day here matches a day in the game.
  function ukDate(d){
    try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(d||new Date());}
    catch(e){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  }
  function addDays(key,n){var p=key.split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]+n)).toISOString().slice(0,10);}
  function liveStreak(s,today){return (s.lastPlayed===today||s.lastPlayed===addDays(today,-1))?s.streak:0;}

  // ---- daily reminder ----
  // Schedules one notification per day for the next two weeks, skipping today once it's played. It is refreshed
  // whenever the app opens and after each game, so it never nags on a day the pattern is already done.
  var DAYS=14,BASE_ID=100;
  function reschedule(){
    if(!native||!Notes)return Promise.resolve();
    var ids=[];for(var i=0;i<DAYS;i++)ids.push({id:BASE_ID+i});
    return Notes.cancel({notifications:ids}).catch(function(){}).then(function(){
      if(!prefs.remind)return;
      var s=stats(),today=ukDate(),streak=liveStreak(s,today),now=new Date(),list=[];
      for(var i=0;i<DAYS;i++){
        var at=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,prefs.hour,0,0);
        if(at<=now)continue;
        if(i===0&&s.results[today])continue;
        // Mention the streak only on the next reminder that can still save it.
        var saves=i===0||(i===1&&s.results[today]);
        var body=streak>0&&saves?'A new pattern and twist are waiting. Keep your '+streak+'-day streak going.':'A new pattern and twist are waiting. It takes about a minute.';
        list.push({id:BASE_ID+i,title:"Today's PULSE is ready",body:body,schedule:{at:at,allowWhileIdle:true},isExactNotification:false});
      }
      if(list.length)return Notes.schedule({notifications:list});
    }).catch(function(){});
  }
  function setReminder(on){
    if(!on){prefs.remind=false;savePrefs();renderReminder();return reschedule();}
    if(!native||!Notes)return Promise.resolve();
    return Notes.requestPermissions().then(function(r){
      prefs.remind=r.display==='granted';savePrefs();renderReminder();
      if(!prefs.remind)$('remMsg').textContent='Notifications are turned off for PULSE. You can allow them in your phone\'s Settings.';
      return reschedule();
    }).catch(function(){renderReminder();});
  }

  // ---- stats screen ----
  var $=function(id){return document.getElementById(id)};
  function el(tag,attrs,html){var e=document.createElement(tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e;}

  var openBtn=el('button',{type:'button',class:'appbtn',id:'statsOpen','aria-haspopup':'dialog'},
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 20V11M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>Stats</span>');
  var nav=document.querySelector('nav');if(nav)nav.appendChild(openBtn);

  var hours='';for(var h=6;h<=22;h++)hours+='<option value="'+h+'">'+(h%12||12)+':00 '+(h<12?'am':'pm')+'</option>';
  var sheet=el('div',{class:'sheet',id:'statsSheet',role:'dialog','aria-modal':'true','aria-labelledby':'statsTitle',hidden:''},
    '<div class="sheetin">'+
      '<div class="sheethead"><h2 id="statsTitle">Your stats</h2><button class="x" id="statsClose" type="button" aria-label="Close stats">×</button></div>'+
      '<div class="tiles">'+
        '<div class="tile"><b id="aStreak">0</b><span>Day streak</span></div>'+
        '<div class="tile"><b id="aLongest">0</b><span>Longest streak</span></div>'+
        '<div class="tile"><b id="aBest">0</b><span>Best score</span></div>'+
        '<div class="tile"><b id="aPlayed">0</b><span>Days played</span></div>'+
        '<div class="tile"><b id="aAvg">-</b><span>Average score</span></div>'+
        '<div class="tile"><b id="aRounds">0</b><span>Most rounds</span></div>'+
      '</div>'+
      '<h3>Last five weeks</h3>'+
      '<div class="cal" id="aCal" role="img"></div>'+
      '<p class="small">Brighter squares are higher scores. Your stats are kept on this phone only.</p>'+
      '<h3>Daily reminder</h3>'+
      '<div class="remrow"><label class="switch"><input type="checkbox" id="remOn"><span>Remind me to play</span></label>'+
      '<select id="remHour" aria-label="Reminder time">'+hours+'</select></div>'+
      '<p class="small" id="remMsg">One notification a day, skipped once you have played.</p>'+
      '<h3>About</h3>'+
      '<p class="small"><a href="'+PRIVACY_URL+'" target="_blank" rel="noopener">Privacy policy</a> · <a href="mailto:'+CONTACT+'">Contact</a></p>'+
      '<p class="small">PULSE collects no personal data. There are no accounts, ads or tracking.</p>'+
    '</div>');
  document.body.appendChild(sheet);

  function longestStreak(results){
    var keys=Object.keys(results).sort(),best=0,run=0,prev=null;
    keys.forEach(function(k){run=prev&&addDays(prev,1)===k?run+1:1;best=Math.max(best,run);prev=k;});
    return best;
  }
  function renderStats(){
    var s=stats(),today=ukDate(),keys=Object.keys(s.results),scores=keys.map(function(k){return +s.results[k].score||0;});
    $('aStreak').textContent=liveStreak(s,today);
    $('aLongest').textContent=Math.max(longestStreak(s.results),liveStreak(s,today));
    $('aBest').textContent=s.best||0;
    $('aPlayed').textContent=keys.length;
    $('aAvg').textContent=scores.length?Math.round(scores.reduce(function(a,b){return a+b},0)/scores.length):'-';
    $('aRounds').textContent=keys.reduce(function(m,k){return Math.max(m,+s.results[k].rounds||0)},0);
    var top=Math.max.apply(null,scores.concat([1])),cal=$('aCal'),played=0;cal.innerHTML='';
    for(var i=34;i>=0;i--){
      var k=addDays(today,-i),r=s.results[k],c=el('span',{class:'day'+(r?' on':'')+(i===0?' today':''),title:k+(r?': '+r.score:'')});
      if(r){played++;c.style.opacity=String(0.35+0.65*Math.min(1,(+r.score||0)/top));}
      cal.appendChild(c);
    }
    cal.setAttribute('aria-label','Played on '+played+' of the last 35 days');
  }
  function renderReminder(){$('remOn').checked=!!prefs.remind;$('remHour').value=String(prefs.hour);$('remHour').disabled=!prefs.remind;
    $('remMsg').textContent=native&&Notes?'One notification a day, skipped once you have played.':'Reminders work in the phone app.';}

  var lastFocus=null;
  function openSheet(){lastFocus=document.activeElement;renderStats();renderReminder();sheet.hidden=false;document.documentElement.classList.add('locked');$('statsClose').focus();}
  function closeSheet(){sheet.hidden=true;document.documentElement.classList.remove('locked');if(lastFocus)lastFocus.focus();}
  openBtn.addEventListener('click',openSheet);
  $('statsClose').addEventListener('click',closeSheet);
  sheet.addEventListener('click',function(e){if(e.target===sheet)closeSheet();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sheet.hidden)closeSheet();});
  $('remOn').addEventListener('change',function(){setReminder(this.checked);});
  $('remHour').addEventListener('change',function(){prefs.hour=+this.value;savePrefs();reschedule();});
  if(!native||!Notes)$('remOn').disabled=true;

  // Refresh the reminders when a game ends (the result card appears) and whenever the app comes back to the front.
  var result=$('result');
  if(result)new MutationObserver(function(){if(!result.hidden){var t=$('rText');if(t)t.value=fixLink(t.value);reschedule();}}).observe(result,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)reschedule();});
  reschedule();
})();
