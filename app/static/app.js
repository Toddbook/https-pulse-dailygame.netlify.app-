// App-only script, added to the page by scripts/build-www.mjs.
// Android's web view has no navigator.share, so route the game's Share button to the native share sheet.
(function(){
  var Share=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Share;
  if(!Share)return;
  navigator.share=function(data){return Share.share({text:data.text,title:data.title,url:data.url,dialogTitle:'Share your PULSE result'});};
})();
