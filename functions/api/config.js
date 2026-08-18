export async function onRequestGet({ env }) {
  return Response.json(
    {
      supabaseUrl: env.PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: env.PUBLIC_SUPABASE_ANON_KEY || '',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
