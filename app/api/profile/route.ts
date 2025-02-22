import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseConfig';
import Exa from 'exa-js';
import { fetchTwitterData, isValidTwitterHandle, isValidUrl } from '@/lib/utils';

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twitter_handle, linkedin_url, personal_website, other_links } = body;

    if (twitter_handle && !isValidTwitterHandle(twitter_handle)) {
      return NextResponse.json({ error: 'Invalid Twitter handle' }, { status: 400 });
    }

    if (linkedin_url && !isValidUrl(linkedin_url)) {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
    }

    // Check if profile exists
    let existingProfile = null;
    if (twitter_handle) {
      const { data: existing } = await supabase
        .from('profiles')
        .select()
        .eq('twitter_handle', twitter_handle)
        .single();
      
      if (existing) {
        existingProfile = existing;
      }
    }

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          twitter_handle: twitter_handle || null,
          linkedin_url: linkedin_url || null,
          personal_website: personal_website || null,
          other_links: other_links || null,
          processing_status: 'pending'
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      // Create new profile
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert({
          twitter_handle: twitter_handle || null,
          linkedin_url: linkedin_url || null,
          personal_website: personal_website || null,
          other_links: other_links || null,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      profile = data;
    }

    // Only fetch Twitter data if handle is provided
    if (twitter_handle) {
      try {
        const twitterData = await fetchTwitterData(twitter_handle, exa);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            twitter_data: twitterData,
            processing_status: 'completed'
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
      } catch (error) {
        await supabase
          .from('profiles')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Failed to fetch Twitter data'
          })
          .eq('id', profile.id);
      }
    }

    return NextResponse.json({
      message: existingProfile ? 'Profile updated' : 'Profile created',
      profile_id: profile.id
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const handle = searchParams.get('twitter_handle');
    
    if (!id && !handle) {
      return NextResponse.json({ error: 'ID or handle required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq(id ? 'id' : 'twitter_handle', id || handle)
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('twitter_handle');
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 });

  try {
    const { error } = await supabase.from('profiles').delete().eq('twitter_handle', handle);
    if (error) throw error;
    return NextResponse.json({ message: 'Profile deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 