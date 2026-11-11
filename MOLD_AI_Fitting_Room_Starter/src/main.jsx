import React,{useState,useRef,useEffect} from 'react';import{createRoot}from'react-dom/client';import{createDecartClient,models}from'@decartai/sdk';import{Camera,Upload,Shirt,Play,Square,ArrowUpRight,Plus,Check}from'lucide-react';import'./style.css';
function App(){
 const [file,setFile]=useState(null),[url,setUrl]=useState(''),[status,setStatus]=useState('Ready to fit'),[live,setLive]=useState(false),[error,setError]=useState('');
 const input=useRef(),out=useRef(),raw=useRef(),rt=useRef(),cam=useRef();
 const products=[{name:'MOLD Oversized Black Jacket',kind:'JACKET',color:'#111',desc:'Oversized fit · Heavyweight'},{name:'MOLD Utility Olive Jacket',kind:'JACKET',color:'#555b42',desc:'Utility cut · Streetwear'},{name:'MOLD Essential Tee',kind:'T-SHIRT',color:'#e8e5df',desc:'Relaxed fit · 240 GSM'}];
 async function start(){
  try{setError('');setStatus('Requesting camera…');
   if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){throw new Error('Camera access needs HTTPS on this device. Open the app over HTTPS, then allow camera access in your browser.');}
   const model=models.realtime('lucy-vton-3.6');
   cam.current=await navigator.mediaDevices.getUserMedia({video:{frameRate:model.fps,width:model.width,height:model.height},audio:false});
   raw.current.srcObject=cam.current;await raw.current.play();
   const tokenRes=await fetch('/api/realtime-token',{method:'POST'});if(!tokenRes.ok)throw new Error((await tokenRes.json()).error||'Token request failed');
   const {apiKey}=await tokenRes.json();const client=createDecartClient({apiKey});
   setStatus('Connecting to Decart…');
   rt.current=await client.realtime.connect(cam.current,{model,mirror:'auto',onRemoteStream:s=>{out.current.srcObject=s;out.current.play();setLive(true);setStatus('LIVE TRY-ON');}});
   if(file){await rt.current.set({prompt:garmentPrompt,image:file});}
   setStatus('Connected — select a garment');setLive(true);
  }catch(e){
   const message=e.name==='NotAllowedError'?'Camera permission was denied. Allow camera access for this site in the browser settings on this device, then try again.':e.name==='NotFoundError'?'No camera was found on this device.':e.message||'Could not start session';
   setError(message);setStatus('Connection failed');stop();
  }
 }
 const garmentPrompt='Replace the current top with the garment in the reference image, accurately matching its design, color, texture and fit.';
 async function applyGarment(f,prompt=garmentPrompt){if(!rt.current){setFile(f);return;}try{setStatus('Applying garment…');await rt.current.set({prompt,image:f});setStatus('LIVE TRY-ON');}catch(e){setError('Garment update failed: '+e.message);}}
 function stop(){try{rt.current?.disconnect();}catch{}rt.current=null;cam.current?.getTracks().forEach(t=>t.stop());cam.current=null;setLive(false);setStatus('Session stopped');}
 function choose(f){setFile(f);setUrl(URL.createObjectURL(f));if(rt.current)applyGarment(f);}
 useEffect(()=>()=>stop(),[]);
 return <div className="app"><header><a className="logo">MOLD<span>®</span></a><nav><a>SHOP</a><a>OUR STORY</a><a className="active">AI FITTING ROOM</a></nav><div className="right">STREETWEAR / 2026 <ArrowUpRight size={15}/></div></header>
 <main><section className="hero"><div className="eyebrow"><span className="dot"/> MOLD LABS — EXPERIMENT 001</div><h1>YOUR FIT.<br/><i>LIVE.</i></h1><p className="sub">Step into MOLD. Try our pieces on your own body in real time, powered by AI.</p></section>
 <section className="workspace"><aside className="products"><div className="section-label">01 / SELECT YOUR PIECE</div>{products.map((p,i)=><button className="product" key={i} onClick={()=>{setStatus(live?'Choose upload to apply':'Upload a garment image to start');}}><div className="swatch" style={{background:p.color}}><Shirt/></div><div className="ptext"><b>{p.name}</b><small>{p.desc}</small><span>{p.kind}</span></div><Plus size={16}/></button>)}
 <div className="upload" onClick={()=>input.current.click()}><Upload/><b>UPLOAD PRODUCT IMAGE</b><small>PNG / JPG / WEBP</small><input ref={input} type="file" accept="image/*" hidden onChange={e=>e.target.files[0]&&choose(e.target.files[0])}/></div>
 {file&&<div className="selected"><Check size={15}/> {file.name}</div>}
 <div className="hint">Tip: Use a clean product image with the garment clearly visible.</div></aside>
 <section className="stage"><div className="stage-top"><span>02 / LIVE MIRROR</span><span className={live?'live':''}><i/> {live?'LIVE':'STANDBY'}</span></div><div className="video-wrap">{!live&&<div className="placeholder"><div className="cam-icon"><Camera/></div><h3>THE MIRROR IS WAITING</h3><p>Start your camera to see yourself in MOLD.</p></div>}<video ref={raw} className="hidden" muted playsInline/><video ref={out} className={live?'output':'hidden'} playsInline/><div className="watermark">MOLD® / FIT CHECK</div></div><div className="controls"><div><b>{status}</b>{error&&<small className="error">{error}</small>}</div>{!live?<button className="primary" onClick={start}><Camera size={16}/> START FITTING</button>:<button className="stop" onClick={stop}><Square size={14}/> END SESSION</button>}</div><div className="privacy">Camera access is used for this session. Keep your API key on the server.</div></section></section>
 <footer><span>MOLD® — BUILT FOR YOUR REAL WORLD</span><span>AI FITTING ROOM / BETA</span></footer></main></div>
}createRoot(document.getElementById('root')).render(<App/>);
