#!/usr/bin/env node
// -*- js -*-

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    child_process = require('child_process'),
    uglifyjs = require('../tools/uglifyjs/uglify-js.js'),
    spawn = child_process.spawn, 
	exec = child_process.exec,
    root_path = process.argv[1];
    
var VERSION = '0.0.0',
    ENCODE = 'utf8',
    PKG_CON,
    PWD = './',
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
        return fs.readFileSync(f1, ENCODE).toString();
    } else if (fs.existsSync(f2)) {
        return fs.readFileSync(f2, ENCODE).toString();
    }
}

// mkdir -p
function mkdirpSync (pathes, mode) {
    mode = mode || 0777;
    var dirs = pathes.trim().split('/');
    if (dirs[0] == '.') {
        // ./aaa
        dirs.shift();
    }
    if (dirs[0] == '..') {
        // ../aaa
        dirs.splice(0, 2, dirs[0] + '/' + dirs[1]);
    }
    
    dirs.length && mkdir(dirs.shift());
    // mkdir
    function mkdir (d) {
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d, mode);
        }
        
        dirs.length && mkdir(d + '/' + dirs.shift());
    }
}

function runCmds(dirname, cmds) {
	var opt = {
			cwd : dirname, 
			encoding : ENCODE
		},
		cmd;

	if (cmds.length) {
		cmd = cmds.shift();
		exec(cmd, opt, function(error, stdout, stderr) {
			stdout && util.log(stdout);
			(error || stderr) && util.error(error || stderr);
			runCmds(dirname, cmds);
		});

		util.debug(new Date().toTimeString().match(/\d{1,2}\:\d{1,2}\:\d{1,2}/g)[0] + 
					' - [run] ' + cmd + ' ');
	}
}

function compressByUglify (file) {
    if (!fs.existsSync(file)) {
        util.error('file not found: ' + file);
        process.exit(1);
    }
    
    var jsp = uglifyjs.parser;
    var pro = uglifyjs.uglify;

    try {
        var orig_code = fs.readFileSync(file, ENCODE).toString();;
        var ast = jsp.parse(orig_code); // parse code and get the initial AST
        ast = pro.ast_mangle(ast); // get a new AST with mangled names
        ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
        var final_code = pro.gen_code(ast); // compressed code here
    } catch (e) {
        util.error(e.message);
    }
    
    return final_code;
}

function writeToFile(path, str) {
    fs.writeFileSync(path, str, ENCODE);
}

function f2f(from, to) {
    to = to || from;
    // check path
    var dirpath = path.dirname ? path.dirname(to) : to.substring(0, to.lastIndexOf('/'));
    !fs.existsSync(dirpath) && mkdirpSync(dirpath);
    
    var ccode = compressByUglify(from);
    writeToFile(to, ccode);
    
    util.puts('SUCCESS: ' + from + ' => ' + to);
}

function readNodecc() {
    var absP = path.resolve('./', PWD);
    util.print('nodecc active in "'+ PWD +'"['+ absP +']\n\n');
    
    var ncc = PWD + '.nodecc';
    if (!fs.existsSync(ncc)) {
        util.error('file [.nodecc] not found in ['+ absP +']!');
        process.exit(1);
    }
    
    NODECC_CON = fs.readFileSync(ncc, ENCODE).toString();
    try {
        NODECC_CON = JSON.parse(NODECC_CON);
    } catch (e) {
        util.error('invalid .nodecc file' + '\n' + e.message);
    }
    
    ENCODE = NODECC_CON.encode || 'utf8';
    
    return NODECC_CON;
}

function dealCClist () {
    var cc = NODECC_CON.cc;

    cc.forEach(function (o, i) {
        var sPath = o.source,
            tPath = o.target;
        if (sPath && tPath) {
            if (typeof sPath == 'string') {
                sPath = sPath.trim();
                if (sPath[sPath.length-1] === '/') {
                    // dir
                    var files = fs.readdirSync(sPath);
                    files.forEach(function (file) {
                        f2f(sPath + file, tPath + file);
                    });
                } else {
                    // file
                    f2f(sPath, tPath);
                }
            } else if (typeof sPath == 'object' && sPath.forEach) {
                fs.existsSync(tPath) && fs.unlinkSync(tPath);
                var dirpath = path.dirname ? path.dirname(tPath) : tPath.substring(0, tPath.lastIndexOf('/'));
                !fs.existsSync(dirpath) && mkdirpSync(dirpath);
    
                util.puts('merging...');
                
                var fd = fs.openSync(tPath, 'a', 0666);
                sPath.forEach(function (file, i) {
                    file = file.trim();
                    var _f = file.split('|');
                    if (_f.length == 2) {
                        if (_f[0] == '!') {
                            // no compress
                            fs.writeSync(fd, '\n' + fs.readFileSync(_f[1], ENCODE).toString(), null, ENCODE);
                        }
                    } else if (_f.length == 1) {
                        var ccode = compressByUglify(file);
                        fs.writeSync(fd, '\n' + ccode, null, ENCODE);
                    }
                });
                fs.closeSync(fd);
                
                util.puts('SUCCESS: ' + sPath + ' => ' + tPath);
                
            }
        }
    });
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
                    PWD = v;
                    break;
            }
        }
    }
    
    readNodecc();
    dealCClist();
}

//exports
if (require.main === module) {
    main(process.argv.slice(2));
} else {
    module.exports = main;
}
    
   
