import { useEffect, useState } from 'react';
// Portal-based mobile conversation: no panel/header ancestor can constrain the viewport.
export default function useMobileConversation(id,onClose){
 const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:899px)').matches);
 useEffect(()=>{const query=window.matchMedia('(max-width:899px)'),change=()=>setMobile(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
 useEffect(()=>{
  if(!mobile||!id)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const frame=requestAnimationFrame(()=>document.querySelector('.chat-mobile-fullscreen .chat-thread-close')?.focus());
  const key=event=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key!=='Tab')return;
   const root=document.querySelector('.chat-mobile-fullscreen');
   const items=[...(root?.querySelectorAll('button,a,input,textarea,select')||[])].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
   const first=items[0],last=items.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
 },[mobile,id,onClose]);
 return mobile;
}
