var fs = require('fs');
if (fs.existsSync('./lib/omnisharp-atom.js')) {
    module.exports = require('./lib/omnisharp-atom');
} else {
    module.exports = require('./dist/omnisharp-atom');
}
