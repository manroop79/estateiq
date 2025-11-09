import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function docStoragePath(id: string, name: string) {
    return `docs/${id}/${encodeURIComponent(name)}`;
}