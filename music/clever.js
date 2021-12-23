"use strict";
exports.__esModule = true;
// eslint-disable-next-line @typescript-eslint/no-var-requires
var EsJs = require("essentia.js");
var essentia = new EsJs.Essentia(EsJs.EssentiaWASM);
// prints version of the essentia wasm backend
console.log(essentia.version);
// prints all the available algorithm methods in Essentia
console.log(essentia.algorithmNames);
