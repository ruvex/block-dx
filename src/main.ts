import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import {Localize} from './app/localize/localize.component';

const { ipcRenderer, webFrame } = window.electron;

ipcRenderer.setMaxListeners(0);

const platform = ipcRenderer.sendSync('getPlatform');

String.prototype['capitalize'] = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

if (environment.production) {
  enableProdMode();
}

// Initialize the localize module
const locale = ipcRenderer.sendSync('getUserLocale');
const localeData = ipcRenderer.sendSync('getLocaleData');
Localize.initialize(locale, localeData);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

let alertTimeout;
let count = 0;
ipcRenderer.on('error', (e, { name, message }) => {
  if(count === 0) {
    count++;
    alert(name + ': ' + message);
    alertTimeout = setTimeout(() => {
      count = 0;
    }, 15000);
  } else if(count === 1) {
    count++;
    alert(name + ': ' + message);
  }
  if (name === 'Unsupported Version')
    ipcRenderer.send('quitResetFirstRun');
});

window.document.addEventListener('drop', e => {
  e.preventDefault();
  e.stopPropagation();
});
window.document.addEventListener('dragover', e => {
  e.preventDefault();
  e.stopPropagation();
});

const getZoomFactor = () => {
  return parseInt((webFrame.getZoomFactor() * 100).toFixed(0), 10);
};

const setZoomFactor = (zoomFactor) => {
  zoomFactor = zoomFactor / 100;
  webFrame.setZoomFactor(zoomFactor);
  ipcRenderer.send('setZoomFactor', zoomFactor);
};

window.document.addEventListener('keydown', e => {
  const { key, ctrlKey, metaKey } = e;
  const ctrlCmd = platform === 'darwin' ? metaKey : ctrlKey;
  if(!ctrlCmd) return;
  const zoomFactor = getZoomFactor();
  if(zoomFactor < 150 && key === '=') { // zoom in
    e.preventDefault();
    setZoomFactor(zoomFactor + 10);
  } else if(zoomFactor > 60 && key === '-') { // zoom out
    e.preventDefault();
    setZoomFactor(zoomFactor - 10);
  } else if(key === '0') { // reset zoom
    e.preventDefault();
    setZoomFactor(100);
  }
});

let scrolling = false;
window.addEventListener('mousewheel', e => {
  if(!scrolling) {
    // @ts-ignore
    const { deltaY, ctrlKey, metaKey } = e;
    const ctrlCmd = platform === 'darwin' ? metaKey : ctrlKey;
    if(!ctrlCmd) return;
    e.preventDefault();
    const zoomFactor = getZoomFactor();
    scrolling = true;
    if(zoomFactor < 150 && deltaY < 0 ) { // zoom in
      setZoomFactor(zoomFactor + 10);
    } else if(zoomFactor > 60 && deltaY > 0) { // zoom out
      setZoomFactor(zoomFactor - 10);
    }
    setTimeout(() => {
      scrolling = false;
    }, 50);
  }
});
