export const attributeLanguages=['en','fa','ar','tr'];
const isMap=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(code=>attributeLanguages.includes(code));
export function attributeMap(row,field){
 const value=row?.[field]??(field==='name'?row?.key:undefined);
 const result=isMap(value)?{...value}:{};
 for(const code of attributeLanguages){const text=row?.translations?.[code]?.[field];if(typeof text==='string'&&result[code]===undefined)result[code]=text;}
 if(typeof value==='string'&&!Object.keys(result).length)result.en=value;
 return Object.fromEntries(Object.entries(result).filter(([,value])=>typeof value==='string'));
}
export const editableAttributes=rows=>(Array.isArray(rows)?rows:[]).map(row=>({name:attributeMap(row,'name'),value:attributeMap(row,'value')}));
export function attributePayload(rows){
 return editableAttributes(rows).map(row=>Object.fromEntries(['name','value'].map(field=>[field,Object.fromEntries(Object.entries(row[field]).map(([code,text])=>[code,text.trim()]).filter(([,text])=>text))]))).filter(row=>Object.keys(row.name).length||Object.keys(row.value).length);
}
export function validAttributes(rows){
 return rows.length<=8&&rows.every(row=>attributeLanguages.every(code=>{
 const name=row.name[code]||'',value=row.value[code]||'';
 return (!name&&!value)||(name.length>0&&name.length<=80&&value.length>0&&value.length<=500);
 }));
}
export function displayAttributes(rows,locale){
 return editableAttributes(rows).flatMap(row=>{const code=[locale,'en',...attributeLanguages].find(code=>row.name[code]?.trim()&&row.value[code]?.trim());return code?[{name:row.name[code],value:row.value[code]}]:[];});
}
