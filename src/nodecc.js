#!/usr/bin/env node
// -*- js -*-

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    child_process = require('child_process'),
    root_path = process.argv[1];
    
var VERSION = '0.0.0',
    PKG_CON,
    NODECC_CON;

function _getVersion () {
    var pkgCon = _getPackageJson();
    if (pkgCon) {
        try {
            PKG_CON = JSON.parse(pkgCon);
        } catch (e) {
            util.print(e.message);
            process.exit(1);
        }
        
        VERSION = PKG_CON.version;
    }
    return VERSION;
}

function _getPackageJson() {
    var f1 = './package.json',
        f2 = '../package.json';
    if (fs.existsSync(f1)) {
        return fs.readFileSync(f1, 'utf8').toString();
    } else if (fs.existsSync(f2)) {
        return fs.readFileSync(f2, 'utf8').toString();
    }
}

function main (args) {
    _getVersion();
    
    if (args && args instanceof Array){
        while (args.length > 0) {
            var v = args.shift();
            switch(v) {
                case '-v':
                case '--version':
                    util.print('version ' + VERSION);
                    process.exit(0);
                default:
                    break;
            }
        }
    }
    
}

//exports
if (require.main === module) {
    main(process.argv.slice(2));
} else {
    module.exports = main;
}
    
   
