// =======================================================
// CONFIGURACIÓN DE SUPABASE CLIENT
// =======================================================
const SUPABASE_URL = 'https://blarjnvouvqovlfocmbr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e34jI9zd6gNSJb1wC25hnw_Gj5tR_NX';

// Inicializar el cliente Supabase usando la librería global cargada por CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
