import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { filterPostHogEvent, initializePostHogAnalytics, isPostHogProductionHost } from '../src/scripts/posthog-analytics.ts';

const token='phc_examplepublic123';
const pref='smc_cookie_preferences_v1';

function browser({ href='https://www.scrapmycaruae.com/', configuredToken=token, consent, storageBlocked=false, readyState='complete' }={}) {
  const win=new EventTarget(),doc=new EventTarget(),scripts=[];
  let stored=consent===undefined ? null : JSON.stringify({analytics:consent});
  let reloads=0;
  win.location={href,reload(){reloads++}};
  win.document=doc;
  win.localStorage={getItem(key){assert.equal(key,pref);if(storageBlocked)throw Error('blocked');return stored;}};
  doc.readyState=readyState;doc.cookie='';
  doc.querySelector=selector=>{
    if(selector.startsWith('meta'))return configuredToken?{content:configuredToken}:null;
    return scripts.find(x=>x.dataset.smcPosthog||x.src.includes('posthog.com/static/array.js'));
  };
  doc.createElement=tag=>{assert.equal(tag,'script');return {dataset:{}}};
  doc.head={appendChild(s){scripts.push(s)}};
  const choice=granted=>{stored=JSON.stringify({analytics:granted});doc.cookie=`${pref}=analytics-${granted?'yes':'no'}`;const e=new Event('smc:analytics-consent');e.detail={granted};win.dispatchEvent(e)};
  return {win,doc,scripts,choice,initialize:()=>initializePostHogAnalytics(win,doc),get reloads(){return reloads}};
}

test('PostHog integration rejects every preview host and missing/invalid tokens',()=>{
  for(const href of ['http://scrapmycaruae.com','https://preview.scrapmycaruae.com','https://smc-headless-worker.hussain-gscx.workers.dev','https://www.scrapmycaruae.com:8080','https://scrapmycaruae.com.evil.com']){
    assert.equal(isPostHogProductionHost(href),false);
    const ui=browser({href,consent:true});ui.initialize();assert.equal(ui.scripts.length,0);
  }
  for(const configuredToken of ['','invalid']){
    const ui=browser({configuredToken,consent:true});ui.initialize();assert.equal(ui.scripts.length,0);
  }
});
test('Missing or declined consent prevents SDK injection',()=>{
  for(const consent of [undefined,false]){
    const ui=browser({consent});ui.initialize();assert.equal(ui.scripts.length,0);
  }
});
test('Consent grant installs once; only EU endpoint, masked fields and safe pageview',()=>{
  const ui=browser({href:'https://www.scrapmycaruae.com/sell-my-car/?phone=private',consent:true});
  ui.initialize();ui.initialize();ui.choice(true);
  assert.equal(ui.scripts.length,1);
  assert.equal(ui.scripts[0].src,'https://eu-assets.i.posthog.com/static/array.js');
  const config=ui.win.posthog._i[0][1];
  assert.equal(config.api_host,'https://eu.i.posthog.com');
  assert.equal(config.opt_out_capturing_by_default,true);
  assert.equal(config.autocapture,false);
  assert.equal(config.disable_session_recording,true);
  assert.equal(config.mask_all_text,true);
  assert.equal(config.session_recording.maskAllInputs,true);
  const captureCommands=ui.win.posthog.filter(x=>x[0]==='capture');
  assert.equal(captureCommands.length,1);
  assert.deepEqual(captureCommands[0],[ 'capture', '$pageview',{ $current_url:'https://www.scrapmycaruae.com/sell-my-car/',$pathname:'/sell-my-car/'}]);
});
test('Restricted event names and no customer values in event payload',()=>{
  const ui=browser({consent:true});ui.initialize();
  ui.win.smcPostHog.track('generate_lead',{form_name:'valuation_form',page_path:'/free-quote',phone:'1234567890',name:'Customer',email:'test@example.com',destination_type:'whatsapp'});
  const captures=ui.win.posthog.filter(x=>x[0]==='capture');
  assert.equal(captures.length,2);
  assert.equal(captures[1][1],'generate_lead');
  assert.deepEqual(captures[1][2],{form_name:'valuation_form',destination_type:'whatsapp',page_path:'/free-quote'});
});
test('before_send strips URL query, email/phone and referrer fields',()=>{
  const out=filterPostHogEvent({event:'generate_lead',properties:{$current_url:'https://www.scrapmycaruae.com/?email=private@example.com',email:'private@example.com',phone:'1234567890',form_name:'valuation_form',$referrer:'https://sensitive.example'}},'https://www.scrapmycaruae.com/free-quote?name=private#secret');
  assert.equal(out.properties.$current_url,'https://www.scrapmycaruae.com/free-quote');
  assert.equal(out.properties.$referrer,undefined);
  assert.equal(out.properties.email,undefined);
  assert.equal(out.properties.phone,undefined);
  assert.equal(out.properties.form_name,'valuation_form');
  assert.equal(JSON.stringify(out).includes('private'),false);
});
test('Revoked consent opts out and reloads to stop replay',()=>{
  const ui=browser({consent:true});ui.initialize();ui.choice(false);
  assert.equal(ui.reloads,1);
  assert.equal(ui.win.posthog.some(x=>x[0]==='opt_out_capturing'),true);
  assert.equal(ui.win.posthog.some(x=>x[0]==='stopSessionRecording'),true);
});
test('Staging workflow refuses PostHog capture and layout is production-only',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/deploy-development-preview.yml',import.meta.url),'utf8');
  assert.match(workflow,/PUBLIC_POSTHOG_ENABLED:\s*["']false["']/);
  const layout=readFileSync(new URL('../src/layouts/BaseLayout.astro',import.meta.url),'utf8');
  assert.match(layout,/PUBLIC_SEO_ENV === 'production' && analyticsEnabled/);
  assert.match(layout,/smc-posthog-config/);
  assert.doesNotMatch(layout,/static\/array\.js/);
});
test('Deployment guard rejects PostHog on staging',()=>{
  const src=readFileSync(new URL('../scripts/deployment-safety.mjs',import.meta.url),'utf8');
  assert.match(src,/PostHog requires approved production targeting/);
});
