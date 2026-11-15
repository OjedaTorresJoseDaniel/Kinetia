export type TreatmentPoint = {model:'H'|'M';view:string;x:number;y:number}
export type TreatmentNode = {key:number;id_Trata:number;point?:TreatmentPoint;connections?:number[]}
export function canConnect(a:TreatmentNode,b:TreatmentNode){return a.key!==b.key&&!!a.point&&!!b.point&&a.id_Trata>0&&a.id_Trata===b.id_Trata&&a.point.model===b.point.model&&a.point.view===b.point.view}
export function cleanConnections<T extends TreatmentNode>(nodes:T[]):T[]{
 const byId=new Map(nodes.map(n=>[n.key,n]));const edges=new Set<string>()
 for(const a of nodes)for(const id of a.connections??[]){const b=byId.get(id);if(b&&canConnect(a,b))edges.add(`${Math.min(a.key,id)}:${Math.max(a.key,id)}`)}
 return nodes.map(n=>({...n,connections:[...edges].filter(e=>Number(e.split(':')[0])===n.key).map(e=>Number(e.split(':')[1]))}))
}
export function connectedNodes<T extends TreatmentNode>(nodes:T[],key:number):T[]{
 const found=new Set([key]);let changed=true
 while(changed){changed=false;for(const a of nodes)for(const id of a.connections??[])if(found.has(a.key)||found.has(id)){if(!found.has(a.key)||!found.has(id))changed=true;found.add(a.key);found.add(id)}}
 return nodes.filter(n=>found.has(n.key))
}
export function geometrySignature(nodes:TreatmentNode[],key:number){return JSON.stringify(connectedNodes(nodes,key).map(n=>[n.key,n.id_Trata,n.point,n.connections??[]]))}
