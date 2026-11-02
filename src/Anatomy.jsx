import {memo} from 'react';
const rear=new Set(['Espalda','Deltoides posteriores','Femorales','Glúteos','Gemelos']);
const zones={
 Pecho:['M45 50 Q54 44 63 51 L63 67 Q51 72 43 62Z','M67 51 Q76 44 85 50 L87 62 Q79 72 67 67Z'],
 Espalda:['M43 53 L62 64 61 95 Q49 89 45 72Z','M87 53 L68 64 69 95 Q81 89 85 72Z'],
 Bíceps:['M35 58 Q43 60 41 76 L35 87 30 81Z','M95 58 Q87 60 89 76 L95 87 100 81Z'],
 Tríceps:['M32 56 L42 62 40 80 33 87 29 78Z','M98 56 L88 62 90 80 97 87 101 78Z'],
 'Deltoides laterales':['M44 43 Q31 43 30 59 L40 65 48 54Z','M86 43 Q99 43 100 59 L90 65 82 54Z'],
 'Deltoides posteriores':['M44 43 Q31 43 30 59 L40 65 48 54Z','M86 43 Q99 43 100 59 L90 65 82 54Z'],
 Cuádriceps:['M48 114 Q57 110 61 121 L59 157 50 166 44 151Z','M82 114 Q73 110 69 121 L71 157 80 166 86 151Z'],
 Femorales:['M47 121 L60 122 58 156 51 165 45 150Z','M83 121 L70 122 72 156 79 165 85 150Z'],
 Glúteos:['M47 99 Q57 94 64 104 L63 122 Q49 132 43 118Z','M83 99 Q73 94 66 104 L67 122 Q81 132 87 118Z'],
 Aductores:['M58 118 L64 120 59 155 53 146Z','M72 118 L66 120 71 155 77 146Z'],
 Abductores:['M45 102 L52 108 48 133 42 123Z','M85 102 L78 108 82 133 88 123Z'],
 Gemelos:['M48 171 Q58 164 59 180 L54 204 49 201Z','M82 171 Q72 164 71 180 L76 204 81 201Z'],
 Abdomen:['M59 73 L71 73 73 96 66 106 57 96Z']
};
export default memo(function Anatomy({muscle}){
 return <svg className="exercise-anatomy" data-muscle={muscle} data-view={rear.has(muscle)?'posterior':'frontal'} viewBox="0 0 130 230" aria-hidden="true" focusable="false">
  <g fill="#ADA8A2" stroke="#F2F0EB" strokeWidth=".7" strokeLinejoin="round">
   <path d="M56 9 Q65 2 74 9 L76 25 70 34 70 40 88 44 Q99 47 101 63 L107 98 105 118 99 117 94 92 85 70 81 96 88 116 84 159 82 174 85 210 92 218 91 224 77 223 70 196 67 164 65 138 63 164 60 196 53 223 39 224 38 218 45 210 48 174 46 159 42 116 49 96 45 70 36 92 31 117 25 118 23 98 29 63 Q31 47 42 44 L60 40 60 34 54 25Z"/>
  </g>
  <g fill="none" stroke="#0B0B0D" strokeWidth="1.5" opacity=".8"><path d={rear.has(muscle)?'M65 42V100M45 52L65 67 85 52M45 96Q65 107 85 96M65 103V125':'M45 52Q55 47 65 54Q75 47 85 52M65 51V102M58 76H72M58 86H72M58 95H72'}/><path d="M45 118L61 128M85 118L69 128M48 167L58 168M72 168L82 167"/></g>
  <g fill="#E10600" stroke="#FF3B1F" strokeWidth=".7">{(zones[muscle]??[]).map((path,i)=><path key={i} d={path}/>)}</g>
 </svg>;
});
