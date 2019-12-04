const fs = require('fs-extra-promise');
const path = require('path');

(async function() {
  try {

    const localesDir = path.join(__dirname, 'locales');

    const locale = 'de';

    const data = await fs.readJsonAsync(path.join(localesDir, 'en.json'));

    for(const key of Object.keys(data)) {
      if(key === 'locale') {
        data[key] = locale;
      } else {
        for(const context of Object.keys(data[key])) {
          data[key][context].val = `${locale}-${data[key][context].val}`;
        }
      }
    }

    await fs.writeJsonAsync(path.join(localesDir, `${locale}.json`), data);

    console.log('Done!');

  } catch(err) {
    console.error(err);
  }
})();
