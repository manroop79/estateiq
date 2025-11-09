import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set!");
    }
    
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}