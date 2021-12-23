// Import Essentia types.
import Essentia from "essentia.js/dist/core_api";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EsJs = require("essentia.js");

const essentia = new EsJs.Essentia(EsJs.EssentiaWASM) as Essentia;

// prints version of the essentia wasm backend
console.log(essentia.version);

// prints all the available algorithm methods in Essentia
console.log(essentia.algorithmNames);
