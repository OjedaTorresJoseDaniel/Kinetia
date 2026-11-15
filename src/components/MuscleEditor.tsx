import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Plus, Trash2, Expand, X, Link2, Unlink } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button, Card, Field, Input, Select, Textarea, ImageDrop } from './ui'
import { ModeloToggle, VISTAS, nombreVista, estiloLamina, cargarPixeles, sobreCuerpo, imagenTratamiento, zonasTratamiento, zonaTratamientoCercana, type Modelo } from './BodyMap'
import type { Vista } from '../types'
import { muscleName } from '../data/muscleNames'
import { canConnect, cleanConnections, connectedNodes, geometrySignature } from '../lib/treatmentConnections'
import catalog from '../data/muscleCatalog.json'

export type MuscleRecord = {key:number;Nombre_Musculo:string;imag_Musculo:string|null;id_Trata:number;Descripcion_DiagCH:string; point?:{model:Modelo;view:Vista;x:number;y:number};regionId?:string;connections?:number[]}
const muscles=Array.from(new Map(catalog.map(p=>[muscleName(p.name),{...p,label:muscleName(p.name)}])).values()).sort((a,b)=>a.label.localeCompare(b.label,'es'))
const colors=['#b15d42','#2563a6','#6d55a3','#21816f','#b47a16','#a14371','#617b32','#566477']
const colorFor=(id:number)=>colors[(Math.max(1,id)-1)%colors.length]
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
function MuscleSearch({value,onChange,label,items=muscles}:{value:string;onChange:(v:string)=>void;label:string;items?:{id:string;name:string;label:string}[]}){
 const [search,setSearch]=useState(''),[open,setOpen]=useState(false),[highlight,setHighlight]=useState(0)
 const options=items.filter(m=>normalize(m.label+' '+m.name).includes(normalize(search)))
 const pick=(name:string)=>{onChange(name);setOpen(false);setSearch('');setHighlight(0)}
 return <div className="relative" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}}>
 <Input role="combobox" aria-label={label} aria-expanded={open} aria-autocomplete="list" value={open?search:value} placeholder="Escribe para buscar…" onFocus={()=>{setSearch('');setOpen(true)}} onChange={e=>{setSearch(e.target.value);setHighlight(0);setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setHighlight(i=>Math.min(i+1,options.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setHighlight(i=>Math.max(0,i-1))}if(e.key==='Enter'&&open){e.preventDefault();if(options[highlight])pick(options[highlight].label)}}}/>
 {open&&<div role="listbox" aria-label="Resultados de músculos" className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl">{options.map((m,i)=><button type="button" role="option" aria-selected={i===highlight} key={m.id} onMouseDown={e=>e.preventDefault()} onClick={()=>pick(m.label)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-soft ${i===highlight?'bg-surface-2':''}`}>{m.label}</button>)}{!options.length&&<p className="p-3 text-sm text-muted">No se encontraron resultados. Prueba con otro nombre.</p>}</div>}
 </div>
}
export default function MuscleEditor({value,onChange,modelo,onModelo,newKey,treatmentIds,onTreatments,onBusy}:{value:MuscleRecord[];onChange:(v:MuscleRecord[])=>void;modelo:Modelo;onModelo:(m:Modelo)=>void;newKey:()=>number;treatmentIds:number[];onTreatments:(ids:number[])=>void;onBusy:(busy:boolean)=>void}){
 const data=useData()
 const [view,setView]=useState<Vista>('F'),[zoom,setZoom]=useState(1),[expanded,setExpanded]=useState(false)
 const [treatment,setTreatment]=useState(treatmentIds[0]??0),[addingTreatment,setAddingTreatment]=useState(!treatmentIds.length),[picked,setPicked]=useState(0)
 const [active,setActive]=useState<number|null>(null),[mode,setMode]=useState<'select'|'add'|'move'|'connect'>('select')
 const [saved,setSaved]=useState('')
 const [pendingMuscle,setPendingMuscle]=useState('')
 const bodyRef=useRef<HTMLDivElement>(null),[scrollRequest,setScrollRequest]=useState(0)
 useEffect(()=>{if(treatment)bodyRef.current?.scrollIntoView({behavior:'smooth',block:'start'})},[treatment,scrollRequest])
 const [query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [freshPoint,setFreshPoint]=useState<number|null>(null)
 const lock=useRef(false),latest=useRef(value);latest.current=value
 const current=value.find(m=>m.key===active&&m.id_Trata===treatment)
 const zones=value.filter(m=>m.id_Trata===treatment)
 const src=`${modelo}-${view}`
 const title=(m:MuscleRecord)=>m.Nombre_Musculo||`Zona ${value.indexOf(m)+1}`
 const reset=()=>{setMode('select');setError('');setQuery('')}
 useEffect(()=>{cargarPixeles(src)},[src])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMode('select');setExpanded(false)}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 useEffect(()=>{if(!expanded)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[expanded])
 const update=(patch:Partial<MuscleRecord>)=>{setSaved('');if(!lock.current)onChange(value.map(m=>m.key===active?{...m,...patch}:m))}
 const commitGeometry=async(proposed:MuscleRecord[])=>{
  if(lock.current)return false
  setSaved('');lock.current=true;setBusy(true);onBusy(true);setError('')
  try{const before=latest.current;const next=cleanConnections(proposed)
   const rendered=await Promise.all(next.map(async n=>{
    if(!n.point||geometrySignature(before,n.key)===geometrySignature(next,n.key)&&n.imag_Musculo)return n
    const members=connectedNodes(next,n.key);const points=members.flatMap(m=>m.point?[m.point]:[])
    const segments=members.flatMap(m=>(m.connections??[]).flatMap(id=>{const p=members.find(r=>r.key===id)?.point;return m.point&&p?[{x1:m.point.x,y1:m.point.y,x2:p.x,y2:p.y}]:[]}))
    const p=n.point;return {...n,imag_Musculo:await imagenTratamiento(p.model,p.view,p.x,p.y,colorFor(n.id_Trata),{points,segments})}
   }));latest.current=rendered;onChange(rendered);return true
  }catch{setError('No se pudo actualizar la imagen del tramo. Inténtalo de nuevo.');return false}finally{lock.current=false;setBusy(false);onBusy(false)}
 }

 const chooseTreatment=(id:number)=>{if(lock.current)return;setTreatment(id);setPendingMuscle('');setActive(null);reset();setMode('add');setScrollRequest(n=>n+1);setSaved('');setAddingTreatment(false)}
 const addTreatment=()=>{if(!picked||lock.current)return;if(!treatmentIds.includes(picked))onTreatments([...treatmentIds,picked]);chooseTreatment(picked);setMode('add');setPicked(0)}
 const chooseRecord=(m:MuscleRecord)=>{if(lock.current)return;if(m.id_Trata!==treatment)setSaved('');setTreatment(m.id_Trata);setPendingMuscle('');setActive(m.key);reset();if(m.point){onModelo(m.point.model);setView(m.point.view)}}
 const connectTo=async(target:MuscleRecord)=>{
  if(!current||lock.current)return
  if(!canConnect(current,target)){setError('Elige otro punto de este tratamiento en la misma vista.');return}
  if(await commitGeometry(value.map(m=>m.key===current.key?{...m,connections:[...(m.connections??[]),target.key]}:m)))reset()
 }
 const mark=async(e:MouseEvent<HTMLDivElement>)=>{
  if(lock.current||!treatment)return
  if(mode==='connect'){setError('Pulsa un punto existente para completar la conexión.');return}
  const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100
  if(!sobreCuerpo(src,x,y)){setError('Coloca la marca sobre el cuerpo.');return}
  if(mode==='move'&&current){if(await commitGeometry(value.map(m=>m.key===current.key?{...m,Nombre_Musculo:zonaTratamientoCercana(modelo,view,x,y).name,regionId:zonaTratamientoCercana(modelo,view,x,y).name,point:{model:modelo,view,x,y}}:m)))reset();return}
  const key=newKey()
  if(await commitGeometry([...value,{key,id_Trata:treatment,Nombre_Musculo:pendingMuscle||zonaTratamientoCercana(modelo,view,x,y).name,regionId:zonaTratamientoCercana(modelo,view,x,y).name,Descripcion_DiagCH:'',imag_Musculo:null,point:{model:modelo,view,x,y}}])){setActive(key);setPendingMuscle('');setFreshPoint(key);reset()}
 }
 const selectRegion=async(name:string)=>{
  if(lock.current)return
  const region=zonasTratamiento(modelo,view).find(r=>r.name===name);if(!region)return
  let {x,y}=region
  // Keep the preset on the actual visible silhouette if an anchor is near its edge.
  if(!sobreCuerpo(src,x,y)){
   const candidates=[]
   for(let dy=-4;dy<=4;dy++)for(let dx=-6;dx<=6;dx++)if(sobreCuerpo(src,x+dx,y+dy))candidates.push({x:x+dx,y:y+dy,d:dx*dx+dy*dy})
   candidates.sort((a,b)=>a.d-b.d)
   if(candidates.length)({x,y}=candidates[0]);else{setError('La imagen aún no está lista o no se encontró un punto en esta zona. Puedes marcarla directamente sobre el cuerpo.');return}
  }
  const key=current?.key??newKey()
  const patch={Nombre_Musculo:name,regionId:name,point:{model:modelo,view,x,y}}
  const next=current?value.map(m=>m.key===key?{...m,...patch}:m):[...value,{key,id_Trata:treatment,Descripcion_DiagCH:'',imag_Musculo:null,...patch}]
  if(await commitGeometry(next)){setActive(key);setPendingMuscle('');setFreshPoint(key);reset()}
 }
 const remove=async(key:number)=>{if(await commitGeometry(value.filter(m=>m.key!==key))){if(active===key)setActive(null);reset()}}
 const removeTreatment=async()=>{if(await commitGeometry(value.filter(m=>m.id_Trata!==treatment))){const ids=treatmentIds.filter(id=>id!==treatment);onTreatments(ids);setTreatment(ids[0]??0);setActive(null);setAddingTreatment(!ids.length);reset()}}
 const edges=value.flatMap(a=>(a.connections??[]).flatMap(id=>{const b=value.find(m=>m.key===id);return b&&canConnect(a,b)?[{a,b}]:[]}))
 const disconnect=async(a:number,b:number)=>{await commitGeometry(value.map(m=>({...m,connections:(m.connections??[]).filter(id=>!((m.key===a&&id===b)||(m.key===b&&id===a)))})))}
 const filtered=muscles.filter(p=>normalize(p.label+' '+p.name).includes(normalize(query)))

 const saveTreatment=()=>{
  if(lock.current)return
  if(!zones.length){setError('Marca al menos una zona sobre el cuerpo antes de guardar.');return}
  const incomplete=zones.find(m=>!m.Nombre_Musculo.trim()||!m.imag_Musculo)
  if(incomplete){chooseRecord(incomplete);setError(`Completa la zona ${value.indexOf(incomplete)+1}: ${!incomplete.Nombre_Musculo.trim()?'elige el músculo':'agrega su imagen'}.`);return}
  reset();setSaved('Tratamiento confirmado en este diagnóstico. Puedes agregar otro o pulsar Siguiente. El guardado definitivo se realiza al finalizar el diagnóstico.')
 }
 const pending=zones.filter(m=>!m.Nombre_Musculo.trim()||!m.imag_Musculo).length
 return <div className={expanded?'fixed inset-3 z-50 overflow-auto rounded-2xl border border-line bg-surface p-5 shadow-2xl':'space-y-4'} role={expanded?'dialog':undefined} aria-modal={expanded||undefined} aria-label={expanded?'Mapa de tratamientos':undefined}>
  <fieldset disabled={busy} className="min-w-0 space-y-4 border-0 p-0">
   <div><h2 className="text-xl font-bold">Músculos y tratamientos</h2><p className="mt-1 text-sm text-muted">Todos los tratamientos comparten el mismo cuerpo. Elige el tratamiento activo para agregar sus puntos; los anteriores permanecen visibles.</p></div>
   <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tratamiento activo para marcar">{treatmentIds.map(id=><button key={id} type="button" aria-pressed={id===treatment} onClick={()=>chooseTreatment(id)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${id===treatment?'border-accent bg-accent-soft':'border-line bg-surface hover:bg-surface-2'}`}><span className="size-2.5 rounded-full" style={{backgroundColor:colorFor(id)}}/>{data.getTratamiento(id)?.Nombre_Trata}<span className="text-xs text-muted">{value.filter(m=>m.id_Trata===id).length} zonas</span></button>)}</div>
   <Button variant="secondary" disabled={!saved||pending>0||!zones.length} onClick={()=>setAddingTreatment(!addingTreatment)}><Plus size={16}/>{treatmentIds.length?'Agregar otro tratamiento':'Agregar tratamiento'}</Button>{treatmentIds.length>0&&!saved&&<p className="text-xs text-muted">Guarda el tratamiento actual para agregar otro.</p>}
   {addingTreatment&&<Card className="flex flex-wrap items-end gap-3 p-4"><div className="min-w-[220px] flex-1"><Field label="Tratamiento que vas a registrar"><Select aria-label="Nuevo tratamiento" value={picked} onChange={e=>setPicked(Number(e.target.value))}><option value={0}>Selecciona un tratamiento</option>{data.tratamientos.rows.filter(t=>!treatmentIds.includes(t.id_Trata)).map(t=><option key={t.id_Trata} value={t.id_Trata}>{t.Nombre_Trata}</option>)}</Select></Field></div><Button disabled={!picked} onClick={addTreatment}>Usar tratamiento</Button>{!!treatmentIds.length&&<Button variant="ghost" onClick={()=>setAddingTreatment(false)}>Cancelar</Button>}</Card>}
   {!treatment&&<Card className="p-8 text-center text-muted">Agrega el primer tratamiento para comenzar a marcar las partes del cuerpo.</Card>}
   {!!treatment&&<div id="treatment-panel" role="region" aria-label={data.getTratamiento(treatment)?.Nombre_Trata} className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Tratamiento activo: {data.getTratamiento(treatment)?.Nombre_Trata}</h3><p className="text-xs text-muted">Cada zona tiene su músculo y descripción opcional.{pending>0?` Faltan datos en ${pending} zona(s).`:zones.length?' Zonas listas.':''}</p></div><Button variant="ghost" size="sm" onClick={removeTreatment}><Trash2 size={14}/>Eliminar tratamiento</Button></div>

    {error&&<p role="alert" className="rounded-lg border border-danger p-3 text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap items-center gap-3"><Button onClick={saveTreatment}>Guardar tratamiento</Button>{saved&&<p role="status" className="max-w-xl text-sm text-muted">{saved}</p>}</div>
    <div ref={bodyRef} className="scroll-mt-20 grid items-start gap-5 lg:grid-cols-[minmax(320px,1fr)_minmax(300px,380px)]">
     <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3"><ModeloToggle value={modelo} onChange={m=>{onModelo(m);setActive(null);reset()}}/><div className="flex items-center gap-2"><label className="text-xs">Zoom <select aria-label="Zoom del mapa de tratamientos" value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="rounded border border-line bg-surface p-2">{[1,1.5,2,3].map(z=><option key={z} value={z}>{z*100} %</option>)}</select></label><Button variant="ghost" aria-label={expanded?'Cerrar mapa ampliado':'Ampliar mapa de tratamientos'} onClick={()=>setExpanded(!expanded)}>{expanded?<X/>:<Expand/>}</Button></div></div>
      <div className="flex flex-wrap gap-1 p-3">{VISTAS.map(v=><Button key={v.id} variant={view===v.id?'primary':'secondary'} onClick={()=>{setView(v.id);setActive(null);setZoom(1);reset()}}>{v.label}</Button>)}</div>
      <div className="flex flex-wrap items-center gap-3 border-y border-line bg-surface-2 p-3"><Button variant={mode==='add'?'primary':'secondary'} onClick={()=>{setActive(null);reset();setMode('add')}}><Plus size={16}/>Nueva zona</Button><p className="flex-1 text-xs" role="status">{busy?'Guardando imagen…':mode==='add'?'Haz clic en la parte del cuerpo que trataste.':mode==='move'?'Haz clic en la nueva ubicación.':mode==='connect'?'Selecciona el otro extremo del tramo.':'Haz clic sobre el cuerpo para agregar una zona o en una marca para editarla.'}</p>{(mode==='connect'||mode==='move')&&<Button variant="ghost" onClick={reset}>Cancelar</Button>}</div>
      <div className="h-[620px] overflow-auto bg-white p-3"><div role="group" aria-label={`Mapa de tratamientos · ${nombreVista(view)}`} className="relative mx-auto select-none bg-white" style={{width:290*zoom,height:290*zoom*470/230,cursor:busy?'wait':mode==='connect'?'default':'crosshair'}} onClick={mark}>
       <div className="pointer-events-none absolute inset-0" style={estiloLamina(src)}/>
       <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 230 470" preserveAspectRatio="none" aria-label="Conexiones de tratamientos">{edges.filter(({a})=>a.point?.model===modelo&&a.point.view===view).map(({a,b})=><g key={`${a.key}-${b.key}`}><line x1={a.point!.x*2.3} y1={a.point!.y*4.7} x2={b.point!.x*2.3} y2={b.point!.y*4.7} stroke="white" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke"/><line x1={a.point!.x*2.3} y1={a.point!.y*4.7} x2={b.point!.x*2.3} y2={b.point!.y*4.7} stroke={colorFor(a.id_Trata)} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></g>)}</svg>
       {value.map(m=>m.point?.model===modelo&&m.point.view===view&&<div key={m.key} className={`treatment-marker absolute size-7 -translate-x-1/2 -translate-y-1/2 hover:z-30 focus-within:z-30 ${m.key===active?'z-20':'z-10'}`} style={{left:`${m.point.x}%`,top:`${m.point.y}%`}} onMouseLeave={()=>{if(freshPoint===m.key)setFreshPoint(null)}} onClick={e=>e.stopPropagation()}>
        <button type="button" title={`${title(m)} · ${data.getTratamiento(m.id_Trata)?.Nombre_Trata}`} aria-label={`Punto ${value.indexOf(m)+1}: ${title(m)} · ${data.getTratamiento(m.id_Trata)?.Nombre_Trata}`} aria-pressed={m.key===active} onClick={()=>{if(mode==='connect')void connectTo(m);else chooseRecord(m)}} className={`flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${m.key===active?'ring-2 ring-gray-800 ring-offset-2':''} ${mode==='connect'&&current&&canConnect(current,m)?'ring-2 ring-green-600 ring-offset-2':''}`} style={{backgroundColor:colorFor(m.id_Trata)}}>{value.indexOf(m)+1}</button>
        {mode==='select'&&freshPoint!==m.key&&<div className={`treatment-marker-menu absolute bottom-full pb-[2px] ${m.point.x>50?'right-0':'left-0'}`}><button type="button" aria-label={`Conectar punto ${value.indexOf(m)+1} con otro`} onClick={()=>{chooseRecord(m);setMode('connect')}} className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-fg shadow-lg"><Link2 size={14}/>Conectar con otro punto</button></div>}
       </div>)}
      </div></div><p className="border-t border-line p-3 text-xs text-muted">Se muestran los puntos de todos los tratamientos de esta vista. Cada color identifica un tratamiento. Pulsa cualquier punto para consultar o editar lo que se realizó. Para indicar un tramo tratado, pasa el cursor sobre una marca y elige «Conectar con otro punto».</p>
     </Card>
     <div className="space-y-4">
      <Card className="space-y-3 p-4"><Field label="Nombre de la zona o músculo"><MuscleSearch label="Nombre de la zona o músculo" value={current?.Nombre_Musculo??pendingMuscle} onChange={name=>{if(current)update({Nombre_Musculo:name});else setPendingMuscle(name)}}/></Field><p className="text-xs text-muted">{current?'Puedes precisar el músculo de la marca seleccionada.':'Marca una zona en el cuerpo o busca el músculo y después indica su ubicación con un clic.'}</p></Card>
      <Card className="p-4"><h4 className="mb-3 font-bold">Todas las zonas · {value.length}</h4>{!value.length?<p className="text-sm text-muted">Marca en el cuerpo la primera zona donde aplicaste este tratamiento.</p>:<ul className="space-y-2">{value.map(m=><li key={m.key}><button type="button" onClick={()=>chooseRecord(m)} className={`w-full rounded-lg border p-3 text-left ${active===m.key?'border-accent bg-accent-soft':'border-line hover:bg-surface-2'}`}><span className="text-sm font-semibold">{value.indexOf(m)+1}. {title(m)}</span><span className="mt-1 flex items-center gap-2 text-xs font-semibold"><span className="size-2.5 rounded-full" style={{backgroundColor:colorFor(m.id_Trata)}}/>{data.getTratamiento(m.id_Trata)?.Nombre_Trata}</span><span className="mt-1 block text-xs text-muted">{m.point?nombreVista(m.point.view):'Imagen registrada'} · {m.Nombre_Musculo.trim()&&m.imag_Musculo?'Lista':'Faltan datos'}</span></button></li>)}</ul>}</Card>
      {current?<Card className="space-y-4 p-5"><div className="flex items-center justify-between"><h4 className="font-bold">Editar zona {value.indexOf(current)+1}</h4><Button variant="ghost" size="sm" aria-label="Eliminar zona seleccionada" onClick={()=>remove(current.key)}><Trash2 size={16}/></Button></div>

       <details><summary className="cursor-pointer text-xs text-muted">Escribir otro nombre de músculo</summary><Input className="mt-2" aria-label="Nombre personalizado del músculo" value={current.Nombre_Musculo} onChange={e=>update({Nombre_Musculo:e.target.value})}/></details>
       <Field label="¿Qué hiciste en esta zona? (Opcional)"><Textarea aria-label="Descripción del tratamiento en esta zona" value={current.Descripcion_DiagCH} onChange={e=>update({Descripcion_DiagCH:e.target.value})} placeholder="Observaciones o detalles de lo realizado en esta parte del cuerpo (opcional)."/></Field>
       <p className="text-xs text-muted">Músculo e imagen son obligatorios; la descripción es opcional.</p>
       <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>{reset();setMode('move')}}>Mover punto</Button><Button variant="ghost" onClick={()=>{setActive(null);reset();setMode('add')}}><Plus size={16}/>Marcar otra zona</Button></div>
       <details><summary className="cursor-pointer text-xs font-semibold">Ver imagen registrada</summary><ImageDrop value={current.imag_Musculo} onChange={v=>update({imag_Musculo:v})} label="Imagen de la zona" aspect="aspect-[1/2]"/></details>
      </Card>:zones.length>0&&<p className="px-2 text-sm text-muted">Elige una zona de la lista o del mapa para consultar su descripción.</p>}
      {edges.length>0&&<Card className="p-4"><h4 className="mb-3 font-bold">Tramos tratados</h4>{edges.map(({a,b})=><div key={`${a.key}-${b.key}`} className="flex items-center justify-between gap-2 border-t border-line py-3 text-xs"><span><span className="block font-semibold" style={{color:colorFor(a.id_Trata)}}>{data.getTratamiento(a.id_Trata)?.Nombre_Trata}</span>{value.indexOf(a)+1}. {title(a)} → {value.indexOf(b)+1}. {title(b)}</span><Button variant="ghost" size="sm" aria-label={`Desconectar puntos ${value.indexOf(a)+1} y ${value.indexOf(b)+1}`} onClick={()=>disconnect(a.key,b.key)}><Unlink size={14}/></Button></div>)}</Card>}
     </div>
    </div>
   </div>}
  </fieldset>
 </div>
}
