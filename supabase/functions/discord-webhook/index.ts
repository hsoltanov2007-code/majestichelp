import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('DISCORD_WEBHOOK_SECRET');
    
    console.log('Received webhook request');
    console.log('Has webhook secret header:', !!webhookSecret);
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log('Received payload:', JSON.stringify(body, null, 2));

    // Extract data from Zapier payload
    const {
      title,
      content,
      author_name,
      author_avatar,
      image_url,
      discord_message_id,
      source_channel,
    } = body;

    if (!content) {
      console.error('Content is required');
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate message
    if (discord_message_id) {
      const { data: existing } = await supabase
        .from('discord_news')
        .select('id')
        .eq('discord_message_id', discord_message_id)
        .single();

      if (existing) {
        console.log('Duplicate message, skipping:', discord_message_id);
        return new Response(
          JSON.stringify({ message: 'Duplicate message, skipped' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert news item
    const { data, error } = await supabase
      .from('discord_news')
      .insert({
        title: title || null,
        content,
        author_name: author_name || 'Majestic RP',
        author_avatar: author_avatar || null,
        image_url: image_url || null,
        discord_message_id: discord_message_id || null,
        source_channel: source_channel || 'Новости Majestic RP',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting news:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully inserted news:', data.id);
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
