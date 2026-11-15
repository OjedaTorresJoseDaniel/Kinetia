// Display translations; original atlas labels remain searchable and visible.
const terms: Record<string,string> = {
 'deltoid':'deltoides','pectoralis major':'pectoral mayor','trapezius':'trapecio',
 'biceps brachii':'bíceps braquial','biceps femoris':'bíceps femoral','triceps brachii':'tríceps braquial',
 'gastrocnemius':'gastrocnemio','flexor carpi ulnaris':'flexor cubital del carpo','pronator teres':'pronador redondo',
 'rectus femoris':'recto femoral','vastus lateralis':'vasto lateral','vastus medialis':'vasto medial','vastus intermedius':'vasto intermedio',
 'gluteus maximus':'glúteo mayor','gluteus medius':'glúteo medio','gluteus minimus':'glúteo menor',
 'supraspinatus':'supraespinoso','infraspinatus':'infraespinoso','infraspinatus muscle':'infraespinoso','subscapularis':'subescapular',
 'teres major':'redondo mayor','teres minor':'redondo menor','latissimus dorsi':'dorsal ancho',
 'rhomboid major':'romboides mayor','rhomboid minor':'romboides menor','levator scapulae':'elevador de la escápula',
 'rectus abdominis':'recto abdominal','external oblique':'oblicuo externo','internal oblique':'oblicuo interno','transversus abdominis':'transverso abdominal',
 'brachialis':'braquial','brachioradialis':'braquiorradial','coracobrachialis':'coracobraquial','anconeus':'ancóneo',
 'adductor magnus':'aductor mayor','adductor longus':'aductor largo','adductor brevis':'aductor corto','adductor minimus':'aductor mínimo',
 'gracilis':'grácil','sartorius':'sartorio','pectineus':'pectíneo','semitendinosus':'semitendinoso','semimembranosus':'semimembranoso',
 'soleus':'sóleo','plantaris':'plantar','popliteus':'poplíteo','tibialis anterior':'tibial anterior','tibialis posterior':'tibial posterior',
 'fibularis longus':'fibular largo','fibularis brevis':'fibular corto','fibularis tertius':'fibular tercero',
 'tensor fasciae latae':'tensor de la fascia lata','iliacus':'ilíaco','psoas major':'psoas mayor','piriformis':'piriforme',
 'obturator internus':'obturador interno','obturator externus':'obturador externo','quadratus femoris':'cuadrado femoral','quadratus lumborum':'cuadrado lumbar',
 'gemellus superior':'gemelo superior','gemellus inferior':'gemelo inferior','superior gemellus':'gemelo superior','inferior gemellus':'gemelo inferior',
 'sternocleidomastoid':'esternocleidomastoideo','scalenus anterior':'escaleno anterior','scalenus medius':'escaleno medio','scalenus posterior':'escaleno posterior',
 'anterior scalene':'escaleno anterior','middle scalene':'escaleno medio','posterior scalene':'escaleno posterior',
 'serratus anterior':'serrato anterior','serratus posterior superior':'serrato posterior superior','serratus posterior inferior':'serrato posterior inferior',
 'pectoralis minor':'pectoral menor','supinator':'supinador','pronator quadratus':'pronador cuadrado','palmaris longus':'palmar largo',
 'flexor carpi radialis':'flexor radial del carpo','flexor digitorum profundus':'flexor profundo de los dedos','flexor digitorum superficialis':'flexor superficial de los dedos',
 'flexor digitorum longus':'flexor largo de los dedos','flexor digitorum brevis':'flexor corto de los dedos','flexor hallucis longus':'flexor largo del dedo gordo',
 'flexor hallucis brevis':'flexor corto del dedo gordo','flexor pollicis longus':'flexor largo del pulgar','flexor pollicis brevis':'flexor corto del pulgar',
 'extensor carpi radialis longus':'extensor radial largo del carpo','extensor carpi radialis brevis':'extensor radial corto del carpo','extensor carpi ulnaris':'extensor cubital del carpo',
 'extensor digitorum':'extensor de los dedos','extensor digitorum longus':'extensor largo de los dedos','extensor hallucis longus':'extensor largo del dedo gordo',
 'extensor hallucis brevis':'extensor corto del dedo gordo','extensor indicis':'extensor del índice','extensor digiti minimi':'extensor del meñique',
 'extensor pollicis longus':'extensor largo del pulgar','extensor pollicis brevis':'extensor corto del pulgar','abductor pollicis longus':'abductor largo del pulgar','abductor pollicis brevis':'abductor corto del pulgar',
 'abductor hallucis':'abductor del dedo gordo','adductor hallucis':'aductor del dedo gordo','adductor pollicis':'aductor del pulgar',
 'splenius capitis':'esplenio de la cabeza','splenius cervicis':'esplenio del cuello','longissimus thoracis':'longísimo torácico','longissimus cervicis':'longísimo cervical','longissimus capitis':'longísimo de la cabeza',
 'iliocostalis thoracis':'iliocostal torácico','iliocostalis lumborum':'iliocostal lumbar','iliocostalis cervicis':'iliocostal cervical',
 'spinalis':'espinoso','spinalis thoracis':'espinoso torácico','multifidus lumborum':'multífido lumbar','platysma':'platisma','diaphragm':'diafragma',
 'head, hands and feet musculature (combined)':'Cabeza, manos y pies (grupo combinado)',
}
const modifiers:Record<string,string>={
 'clavicular part':'porción clavicular','acromial part':'porción acromial','spinal part':'porción espinal','abdominal part':'porción abdominal','sternocostal part':'porción esternocostal',
 'descending part':'porción descendente','ascending part':'porción ascendente','transverse part':'porción transversal',
 'long head':'cabeza larga','short head':'cabeza corta','lateral head':'cabeza lateral','medial head':'cabeza medial','humeral head':'cabeza humeral','ulnar head':'cabeza cubital',
 'superficial head':'cabeza superficial','deep head':'cabeza profunda','radial head':'cabeza radial','humero-ulnar head':'cabeza humerocubital','oblique head':'cabeza oblicua','transverse head':'cabeza transversal',
}
export function muscleName(original:string):string {
 let text=original.toLowerCase(),side='';
 if(/\bleft\b/.test(text)){side=' · izquierdo';text=text.replace(/\bleft\s*/,'')}
 if(/\bright\b/.test(text)){side=' · derecho';text=text.replace(/\bright\s*/,'')}
 let result=terms[text];
 if(!result){for(const [prefix,spanish] of Object.entries(modifiers)){if(text.startsWith(prefix+' of ')){const base=text.slice(prefix.length+4);if(terms[base])result=terms[base]+' · '+spanish;break}}}
 if(!result&&text.includes(' · ')){const [base,part]=text.split(' · ');const alias=base==='biceps'?'bíceps braquial':base==='triceps'?'tríceps braquial':terms[base];if(alias)result=alias+' · '+(modifiers[part]||part)}
 if(!result){const matches:Record<string,string>={'anterior deltoid':'deltoides anterior','lateral deltoid':'deltoides lateral','posterior deltoid':'deltoides posterior','upper trapezius':'trapecio superior','middle trapezius':'trapecio medio','lower trapezius':'trapecio inferior','upper pectoralis major':'pectoral mayor clavicular','lower pectoralis major':'pectoral mayor abdominal','sternocostal pectoralis major':'pectoral mayor esternocostal'};result=matches[text]}
 if(!result)return original;
 return result.charAt(0).toUpperCase()+result.slice(1)+side;
}
