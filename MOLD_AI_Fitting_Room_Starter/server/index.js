import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createDecartClient } from '@decartai/sdk';
const app=express(); app.use(cors()); app.use(express.json());
app.post('/api/realtime-token',async(req,res)=>{
 try{
  if(!process.env.DECART_API_KEY) return res.status(503).json({error:'Set DECART_API_KEY in .env first'});
  const client=createDecartClient({apiKey:process.env.DECART_API_KEY});
  const token=await client.tokens.create();
  res.json(token);
 }catch(e){console.error(e);res.status(500).json({error:'Could not create Decart token'});}
});
const port = process.env.PORT || 8787;
app.listen(port, '0.0.0.0', () => console.log(`MOLD API running on port ${port}`));
