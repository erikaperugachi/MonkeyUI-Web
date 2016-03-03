/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	// Simple ffmpeg web worker based on (https://github.com/bgrins/videoconverter.js/blob/master/demo/worker.js)

	importScripts('ffmpeg.js');

	function print(text) {
	    postMessage({
	        'type' : 'stdout',
	        'data' : text
	    });
	}

	function printErr(text) {
	    postMessage({
	        'type' : 'stderr',
	        'data' : text
	    });
	}

	self.addEventListener('message', function(event) {
	    var message = event.data;
	    if (message.type === "command") {
	        postMessage({
	            'type' : 'start',
	        });
	                      
	        var Module = {
	            print: print,
	            printErr: printErr,
	            files: message.files || [],
	            arguments: message.arguments || []
	        };
	                      
	        postMessage({
	            'type' : 'stdout',
	            'data' : 'Received command: ' + Module.arguments.join(" ")
	        });
	        
	        var time = Date.now();
	        var result = ffmpeg_run(Module);
	        var totalTime = Date.now() - time;

	        postMessage({
	            'type' : 'stdout',
	            'data' : 'Finished processing (took ' + totalTime + 'ms)'
	        });
	        
	        // use transferrable objects
	        var buffers = [];
	        for (var i in result.outputFiles) {
	            buffers.push(result.outputFiles[i]);
	        }
	                      
	        postMessage({
	            'type' : 'done',
	            'data' : result
	        }, buffers);
	    }
	}, false);

	// ffmpeg loaded
	postMessage({
	    'type' : 'ready'
	});


/***/ }
/******/ ]);