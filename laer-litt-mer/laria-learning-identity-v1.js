/* Two optional controls in the existing atlas. No renderer or route changes. */
(function(){
 'use strict';
 const world=document.getElementById('world-screen');
 if(!world)return;
 const panels=[...world.querySelectorAll('.laria-atlas-controls details')];
 for(const panel of panels){
  const summary=panel.querySelector('summary');
  summary.addEventListener('click',()=>{
   if(!panel.open)for(const other of panels)if(other!==panel)other.open=false;
  });
  panel.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&panel.open){
    e.preventDefault();e.stopPropagation();panel.open=false;summary.focus();
   }
  });
 }
 world.querySelector('.laria-atlas-more')?.addEventListener('click',e=>{
  if(e.target.closest('button')){
   const panel=e.currentTarget;
   panel.open=false;if(world.classList.contains('active'))panel.querySelector('summary')?.focus({preventScroll:true});
  }
 });
 new MutationObserver(()=>{
  if(!world.classList.contains('active'))for(const panel of panels)panel.open=false;
 }).observe(world,{attributes:true,attributeFilter:['class']});
})();
