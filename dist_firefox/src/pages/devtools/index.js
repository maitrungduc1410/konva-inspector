import"../../../assets/js/modulepreload-polyfill.0c213636.js";n();const o=setInterval(n,1e3);function n(){try{chrome.devtools.inspectedWindow.eval(`
      !!(window.Konva && window.Konva.stages.length)
    `,(e,t)=>{t?(console.log(t),clearInterval(o)):e&&(clearInterval(o),chrome.devtools.panels.create("Konva","/icon38.png","/src/pages/panel/index.html"))})}catch(e){clearInterval(o),console.error(e)}}
