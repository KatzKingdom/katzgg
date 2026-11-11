import {writeFileSync} from 'node:fs';
import {makePavilion} from './scene.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
globalThis.FileReader=class {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.({target:this});}).catch(error=>this.onerror?.(error));}
 readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.({target:this});}).catch(error=>this.onerror?.(error));}
};
const model=makePavilion();
const buffer=await new GLTFExporter().parseAsync(model,{binary:true});
writeFileSync(new URL('./Pavilion-Concept.glb',import.meta.url),Buffer.from(buffer));
console.log('Exported',model.children.length,'scene objects,',buffer.byteLength,'bytes');
