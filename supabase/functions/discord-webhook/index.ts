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

    // Handle both direct format and Discord/Zapier format
    let content = '';
    let title = null;
    let author_name = 'Majestic RP';
    let author_avatar = null;
    let image_url = null;
    let discord_message_id = null;
    let source_channel = 'Новости Majestic RP';

    // Check if this is raw Discord format from Zapier
    if (body.author && typeof body.author === 'object') {
      // Discord/Zapier format
      console.log('Detected Discord/Zapier format');
      
      // Get author info
      author_name = body.author.global_name || body.author.username || 'Majestic RP';
      if (body.author.avatar && body.author.id) {
        author_avatar = `https://cdn.discordapp.com/avatars/${body.author.id}/${body.author.avatar}.png`;
      }
      
      // Get message ID
      discord_message_id = body.id || null;
      
      // Get content - check for forwarded messages first
      if (body.message_snapshots && typeof body.message_snapshots === 'string') {
        try {
          // Parse message_snapshots if it's a string
          const snapshots = JSON.parse(body.message_snapshots.replace(/'/g, '"'));
          if (snapshots && snapshots.length > 0 && snapshots[0].message) {
            content = snapshots[0].message.content || '';
            
            // Get attachments from forwarded message
            if (snapshots[0].message.attachments && snapshots[0].message.attachments.length > 0) {
              const attachment = snapshots[0].message.attachments[0];
              if (attachment.url && attachment.content_type?.startsWith('image')) {
                image_url = attachment.url.replace(/\s/g, '');
              }
            }
          }
        } catch (e) {
          console.log('Could not parse message_snapshots:', e);
        }
      }
      
      // If no content from snapshots, use direct content
      if (!content && body.content) {
        content = body.content;
      }
      
      // Get attachments for images (direct message)
      if (!image_url) {
        let attachments = body.attachments;
        if (typeof attachments === 'string') {
          try {
            attachments = JSON.parse(attachments.replace(/'/g, '"'));
          } catch (e) {
            attachments = [];
          }
        }
        if (Array.isArray(attachments) && attachments.length > 0) {
          const imageAttachment = attachments.find((a: any) => 
            a.content_type?.startsWith('image') || 
            a.url?.match(/\.(png|jpg|jpeg|gif|webp)/i)
          );
          if (imageAttachment?.url) {
            image_url = imageAttachment.url.replace(/\s/g, '');
          }
        }
      }
      
      // Get embeds for images if no attachment
      if (!image_url) {
        let embeds = body.embeds;
        if (typeof embeds === 'string') {
          try {
            embeds = JSON.parse(embeds.replace(/'/g, '"'));
          } catch (e) {
            embeds = [];
          }
        }
        if (Array.isArray(embeds) && embeds.length > 0) {
          const embedWithImage = embeds.find((e: any) => e.image?.url || e.thumbnail?.url);
          if (embedWithImage) {
            image_url = embedWithImage.image?.url || embedWithImage.thumbnail?.url;
          }
        }
      }
      
    } else {
      // Simple format (direct API call)
      console.log('Detected simple format');
      content = body.content || '';
      title = body.title || null;
      author_name = body.author_name || 'Majestic RP';
      author_avatar = body.author_avatar || null;
      image_url = body.image_url || null;
      discord_message_id = body.discord_message_id || null;
      source_channel = body.source_channel || 'Новости Majestic RP';
    }

    // Clean up content - remove Discord mentions and format
    content = content
      .replace(/<@&?\d+>/g, '') // Remove role/user mentions
      .replace(/<#\d+>/g, '') // Remove channel mentions
      .trim();

    if (!content) {
      console.error('Content is required after processing');
      return new Response(
        JSON.stringify({ error: 'Content is required', received: body }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract title from content if not provided (first line or first 100 chars)
    if (!title) {
      const lines = content.split('\n').filter((l: string) => l.trim());
      if (lines.length > 0) {
        // Remove markdown formatting for title
        title = lines[0]
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s*/, '')
          .substring(0, 100);
      }
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
        title,
        content,
        author_name,
        author_avatar,
        image_url,
        discord_message_id,
        source_channel,
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
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
