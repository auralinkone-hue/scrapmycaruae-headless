import {modelLabel} from '../lib/manufacturer-models';
import type {buildCarGallery} from '../lib/car-gallery';
type GalleryItem=ReturnType<typeof buildCarGallery>[number];
function initialiseCarHub(){
 const root=document.querySelector<HTMLElement>('[data-car-hub]');if(!root||root.dataset.hubReady)return;root.dataset.hubReady='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const gallery=root.querySelector<HTMLElement>('[data-make-gallery]');
 const items=JSON.parse(gallery?.querySelector('[data-gallery-config]')?.textContent||'[]') as GalleryItem[];
 const tabs=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-make-choice]'));
 const make=root.querySelector<HTMLSelectElement>('[data-manufacturer-quote] [data-make]');
 const model=root.querySelector<HTMLSelectElement>('[data-manufacturer-quote] [data-model]');
 const panel=root.querySelector<HTMLElement>('[data-featured-vehicle]');
 const modelList=root.querySelector<HTMLElement>('[data-featured-models]');
 const status=root.querySelector<HTMLElement>('[data-gallery-status]');let syncing=false;let activeMake=items[0]?.make||'';
 const animate=(element:HTMLElement|null)=>{if(!element||reduced.matches)return;element.classList.remove('hub-changed');void element.offsetWidth;element.classList.add('hub-changed');};
 const setText=(selector:string,text:string)=>{const el=gallery?.querySelector(selector);if(el)el.textContent=text;};
 const setVehicle=(item:GalleryItem,value?:string)=>{
  if(!make||make.disabled||!Array.from(make.options).some(o=>o.value===item.make))return false;
  syncing=true;try{
   if(make.value!==item.make){make.value=item.make;make.dispatchEvent(new Event('change',{bubbles:true}));}
   if(value&&model&&!model.disabled&&item.models.includes(value)&&Array.from(model.options).some(o=>o.value===value)){model.value=value;model.dispatchEvent(new Event('change',{bubbles:true}));}
  }finally{syncing=false;}return true;
 };
 const render=(index:number,updateForm=true)=>{
  const item=items[index];if(!item||!gallery)return;activeMake=item.make;
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  panel?.setAttribute('aria-labelledby',tabs[index].id);
  setText('[data-featured-name]',item.name);setText('[data-featured-copy]',item.description);setText('[data-featured-note]',item.note);setText('[data-featured-index]',String(index+1).padStart(2,'0')+' / 10');
  const image=gallery.querySelector<HTMLImageElement>('[data-featured-image]');if(image){image.srcset=`/sections/${item.image}-640.webp 640w, /sections/${item.image}-960.webp 960w, /sections/${item.image}.webp 1440w`;image.src=`/sections/${item.image}.webp`;image.alt=item.alt;}
  const action=gallery.querySelector<HTMLAnchorElement>('[data-featured-action] a');if(action){action.href=`/cars/${item.slug}/`;if(action.firstChild)action.firstChild.textContent=`Explore ${item.name} Scrap Valuation `;}
  modelList?.replaceChildren(...item.models.slice(0,6).map(value=>{const button=document.createElement('button');button.type='button';button.textContent=modelLabel(value);button.dataset.galleryModel=value;button.setAttribute('aria-pressed',String(make?.value===item.make&&model?.value===value));button.addEventListener('click',()=>{const applied=setVehicle(item,value);updateModelSelection();if(status)status.textContent=applied?`${item.name} ${modelLabel(value)} added to your valuation form.`:'Vehicle options are unavailable. Please contact us.';});return button;}));
  setText('[data-model-caption]',item.models.length?`Models from the current ${item.name} catalogue. Choose one to add it to the form.`:'Model options are temporarily unavailable. Contact us about your vehicle.');
  const applied=updateForm&&setVehicle(item);updateModelSelection();
  if(status)status.textContent=updateForm?`${item.name} selected.${applied?' Make updated in your valuation form.':''}`:`${item.name} preview. Select a make or model here to update the form.`;
  animate(panel);
 };
 function updateModelSelection(){modelList?.querySelectorAll<HTMLButtonElement>('[data-gallery-model]').forEach(b=>b.setAttribute('aria-pressed',String(make?.value===activeMake&&model?.value===b.dataset.galleryModel)));}
 tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>render(index));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();render(next);tabs[next].focus({preventScroll:true});});});
 make?.addEventListener('change',()=>{if(syncing)return;const index=items.findIndex(item=>item.make===make.value);if(index>=0)render(index,false);else{updateModelSelection();if(status)status.textContent=`The form is set to ${make.value?modelLabel(make.value):'no make'}. The ten manufacturer guides remain available below.`;}});
 model?.addEventListener('change',updateModelSelection);if(items.length)render(Math.max(0,items.findIndex(item=>item.make===make?.value)),false);
 const process=root.querySelector<HTMLElement>('[data-hub-process]');
 const steps=Array.from(process?.querySelectorAll<HTMLButtonElement>('[data-process-step]')||[]);const panels=Array.from(process?.querySelectorAll<HTMLElement>('[data-process-panel]')||[]);
 const selectStep=(index:number)=>{steps.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});panels.forEach((p,i)=>p.hidden=i!==index);if(process)process.dataset.step=String(index);animate(panels[index]);};
 steps.forEach((tab,index)=>{tab.addEventListener('click',()=>selectStep(index));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%steps.length;else if(event.key==='ArrowLeft')next=(index+steps.length-1)%steps.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=steps.length-1;else return;event.preventDefault();selectStep(next);steps[next].focus({preventScroll:true});});});if(steps.length)selectStep(0);
 root.querySelectorAll<HTMLAnchorElement>('a[href="#cars-quote"]').forEach(link=>link.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();root.querySelector('[data-manufacturer-quote]')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});make?.focus({preventScroll:true});}));
}
initialiseCarHub();document.addEventListener('astro:page-load',initialiseCarHub);
