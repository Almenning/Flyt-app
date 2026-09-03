(()=>{
'use strict';
const VERSION='20260903-2200';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function nextOpen(current,key){return String(current||'')===String(key||'')?null:key}
function item({key,label,count,open,attribute,body='',bodyTop=''}){
  const encoded=encodeURIComponent(String(key??'')),attr=/^data-[a-z0-9-]+$/.test(attribute||'')?attribute:'data-category-toggle',status=Number.isFinite(Number(count))?`<span class="categoryAccordionCount">${Number(count)}</span>`:'';
  return `<section class="categoryAccordion ${open?'isOpen':''}" data-category-accordion-item="${encoded}"><button type="button" class="categoryAccordionHeader" ${attr}="${encoded}" aria-expanded="${open?'true':'false'}"><strong class="grow">${esc(label)}</strong>${status}<span class="categoryAccordionArrow" aria-hidden="true">${open?'⌃':'›'}</span></button>${open?`<div class="categoryAccordionBody">${bodyTop}${body}</div>`:''}</section>`;
}
function capture(button){const top=button?.getBoundingClientRect?.().top;return Number.isFinite(top)?top:null}
function restore(container,selector,top){if(!container||!selector||!Number.isFinite(top))return;const apply=()=>{const header=container.querySelector?.(selector),current=header?.getBoundingClientRect?.().top;if(!Number.isFinite(current))return;container.scrollTop=Math.max(0,(Number(container.scrollTop)||0)+current-top)};requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(apply,140)}
window.FlytCategoryAccordion={VERSION,nextOpen,item,capture,restore};
})();
