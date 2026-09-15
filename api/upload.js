import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';
import crypto from 'crypto';

const BUCKET='maggies-world';
export const config={api:{bodyParser:false}};

export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Supabase is not configured'});
 const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
 try{
  const bb=Busboy({headers:req.headers,limits:{fileSize:10*1024*1024,files:1,fields:2}});let fileBuf=null,fileType='',filename='',username='',caption='';
  bb.on('field',(n,v)=>{if(n==='username')username=v.trim().slice(0,32);if(n==='caption')caption=v.trim().slice(0,140)});
  bb.on('file',(n,file,info)=>{fileType=info.mimeType;filename=info.filename;const chunks=[];file.on('data',d=>chunks.push(d));file.on('end',()=>fileBuf=Buffer.concat(chunks))});
  bb.on('finish',async()=>{try{
   if(!fileBuf||!fileType.startsWith('image/'))return res.status(400).json({error:'Please upload an image'});if(!username)return res.status(400).json({error:'Name is required'});
   const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[fileType]||'bin';const path=`${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
   const {error:up}=await supabase.storage.from(BUCKET).upload(path,fileBuf,{contentType:fileType,upsert:false});if(up)throw up;
   const {data:pub}=supabase.storage.from(BUCKET).getPublicUrl(path);const {data:row,error:db}=await supabase.from('submissions').insert({username,caption,filename,url:pub.publicUrl,storage_path:path}).select().single();if(db)throw db;
   res.status(201).json(row);
  }catch(err){console.error(err);res.status(500).json({error:'Could not save submission'})}});req.pipe(bb);
 }catch(err){console.error(err);res.status(500).json({error:'Upload failed'})}
}
