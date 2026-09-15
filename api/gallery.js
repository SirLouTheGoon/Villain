import { createClient } from '@supabase/supabase-js';
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Supabase is not configured'});
 const {data,error}=await supabase.from('submissions').select('id,username,caption,url,created_at').order('created_at',{ascending:false}).limit(100);
 if(error)return res.status(500).json({error:'Could not load the world'});res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=120');return res.status(200).json(data||[]);
}
