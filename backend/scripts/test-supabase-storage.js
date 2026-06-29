import 'dotenv/config'
import { supabase } from '../src/lib/supabaseClient.js'

async function test() {
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
  console.log('SUPABASE_SERVICE_KEY set:', !!process.env.SUPABASE_SERVICE_KEY)

  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('❌ Supabase responded with an error:', error)
    } else {
      console.log('✅ Connected successfully. Buckets found:', data.map(b => b.name))
    }
  } catch (err) {
    console.error('❌ Raw network failure — real cause below:')
    console.error('Message:', err.message)
    console.error('Cause:', err.cause)
  }
}

test()