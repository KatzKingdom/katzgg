import * as T from './vendor/three.module.js';
export function makePavilion() {
 const root=new T.Group(); root.name='Hermann Park lakeside pavilion concept';
 const mat=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.78,...extra});
 const white=mat('#f1eee3'), wood=mat('#ad8059'), stone=mat('#d4cfbd'), dark=mat('#414c45'), sage=mat('#81967b'), teal=mat('#427d80'), coral=mat('#b77759');
 const glass=mat('#b8d5d1',{transparent:true,opacity:.16,roughness:.15,metalness:.2,depthWrite:false,side:T.DoubleSide});
 const ground=mat('#8b9a6c'), water=mat('#557f80',{metalness:.25,roughness:.28});
 function mesh(g,m,p,n){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;o.name=n;root.add(o);return o;}
 function box(p,s,m,n=''){return mesh(new T.BoxGeometry(...s),m,p,n);}
 function cyl(p,r,h,m,n='',r2=r){return mesh(new T.CylinderGeometry(r2,r,h,12),m,p,n);}
 function sphere(p,s,m,n=''){const o=mesh(new T.SphereGeometry(1,8,6),m,p,n);o.scale.set(...s);return o;}
 box([0,-.3,0],[125,.5,125],ground,'Park lawn');
 box([0,-.01,-34],[110,.14,46],water,'Illustrative lake, not a surveyed site');
 box([0,-.04,4],[34,.18,30],stone,'Level terrace and approach');
 box([0,-.07,29],[5,.12,25],stone,'Park approach path');
 box([0,.02,-8.4],[34,.2,5.8],wood,'Lake viewing deck');
 box([0,-.03,17.2],[95,.13,3.3],stone,'Public path');
 // Pavilion frame, interior roof and open shaded terrace.
 box([0,.15,1.3],[22,.24,11],stone,'Interior floor');
 box([0,4.15,1.3],[22,.17,11],white,'Weatherproof interior roof');
 for(let x=-15;x<=15;x+=5) for(const z of [-8,10]) box([x,2.2,z],[.13,4.4,.13],white,'Canopy column');
 for(const z of [-8,1,10])box([0,4.4,z],[30.3,.23,.16],white,'Canopy beam');
 for(let x=-15;x<=15;x+=.36)box([x,4.58,1],[.09,.17,18.3],white,'Shade louver');
 for(const x of [-11,11]) {box([x,2.15,1.3],[.04,3.9,11],glass,'Transparent glazed wall');for(let z=-4.2;z<=6.8;z+=2.2)box([x,2.15,z],[.08,3.9,.08],white,'Window mullion');}
 for(const z of [-4.2,6.8])for(const x of [-8.1,8.1])box([x,2.15,z],[5.8,3.9,.04],glass,'Glazing beside central entrance');
 for(const z of [-4.2,6.8]) for(const x of [-11,-8,-5.2,-2.1,2.1,5.2,8,11])box([x,2.15,z],[.075,3.9,.075],white,'Glazing frame and doorway');
 function chair(x,z,angle=0,m=teal){const g=new T.Group();const old=root.children.length;box([x,.53,z],[.52,.09,.52],m,'Seat');box([x,.88,z+.24],[.52,.65,.06],m,'Chair back');for(const dx of [-.19,.19])for(const dz of [-.19,.19])cyl([x+dx,.28,z+dz],.025,.48,dark,'Chair leg');const parts=root.children.splice(old);for(const o of parts){o.position.x-=x;o.position.z-=z;g.add(o);}g.position.set(x,0,z);g.rotation.y=angle;root.add(g);}
 function table(x,z,round=false){if(round)cyl([x,.88,z],.72,.09,white,'Dining table');else box([x,.88,z],[2.8,.09,.95],wood,'Study table');cyl([x,.45,z],.07,.8,dark,'Table support');}
 for(const x of [-6,-1])for(const z of [-1,3.4]){table(x,z);chair(x-.7,z+.8);chair(x+.7,z+.8);chair(x-.7,z-.8,Math.PI,sage);chair(x+.7,z-.8,Math.PI,sage);}
 for(const x of [-12.7,-7.7,-2.7,2.7,7.7,12.7]){table(x,-6.5,true);chair(x-.95,-6.5,Math.PI/2,coral);chair(x+.95,-6.5,-Math.PI/2,sage);}
 for(const x of [-7,-1,5]){table(x,8.5,true);chair(x-.95,8.5,Math.PI/2);chair(x+.95,8.5,-Math.PI/2,sage);}
 // Food counter and service rooms.
 box([7, .68,-.1],[5.1,1.1,.95],wood,'Cafe food and water counter');box([7,1.26,-.1],[5.5,.12,1.1],white,'Countertop');
 box([9, .86,2.3],[3.4,1.4,1],dark,'Cafe preparation area');box([8.4,2.05,5.1],[4.7,3.7,3.3],white,'Restroom and service block');
 for(const x of [7.2,9.1])box([x,1.17,3.42],[.9,2.2,.05],wood,'Restroom door');
 box([4.4,1.06,5.1],[.4,1.7,.55],teal,'Free water refill station');
 // Simple dishes and food display.
 for(let i=0;i<8;i++){cyl([5.2+i*.48,1.34,-.1],.16,.035,stone,'Food display plate');sphere([5.2+i*.48,1.4,-.1],[.11,.055,.08],coral,'Food concept');}
 // Public benches with backs, some outside the cafe footprint.
 for(const x of [-16,16])for(const z of [-6,3,12]){box([x,.55,z],[.65,.13,2.6],wood,'Public bench');box([x+.3,.9,z],[.07,.75,2.6],wood,'Bench back');for(const zz of [-.9,.9])box([x,.25,z+zz],[.4,.5,.15],dark,'Bench support');}
 for(const x of [-17,17])for(const z of [-8,0,8]){box([x,.35,z],[1.2,.7,2.3],stone,'Planted border');for(let i=0;i<6;i++)sphere([x+(i%2-.5)*.6,.95,z+(Math.floor(i/2)-1)*.6],[.45,.65,.45],sage,'Planting');}
 // Wildlife viewing from the exterior, with feeders represented as optional props.
 for(const x of [-12.5,12.5]){box([x,1.5,-9.8],[.07,3,.07],wood,'Optional feeder pole');box([x,2.85,-9.8],[.55,.3,.4],wood,'Optional bird feeder');}
 let seed=47; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<35;i++){let x=(rand()-.5)*100,z=rand()*64-8;if(Math.abs(x)<20&&z<40){x+=(x<0?-1:1)*25;}const h=5+rand()*4;cyl([x,h/2,z],.23,h,wood,'Park tree trunk');sphere([x,h,z],[2.4+rand(),2.4+rand(),2.4+rand()],mat(['#647c4f','#72875b','#506b46'][i%3]),'Tree canopy');}
 // Abstract figures communicate scale and varied use.
 function person(x,z,m,seated=false){const y=seated?.9:1.05;cyl([x,y,z],.17,.65,m,'Visitor');sphere([x,y+.5,z],[.13,.16,.13],stone,'Visitor head');for(const dx of [-.09,.09])cyl([x+dx,seated?.4:.38,z],.06,seated?.35:.7,dark,'Visitor legs');}
 person(-6.6,-.2,sage,true);person(-.3,4.2,coral,true);person(6.6,-5.6,dark,true);person(-4,14,coral);person(3,11,sage);person(5,1.3,teal);person(14,-5,white);
 return root;
}
