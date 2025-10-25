import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projectId = 'arcane-rigging-473104-k3';
    const location = 'global';
    const agentId = '1f0172a0-5c53-4417-8713-83b66cbb5a24';

    // Get access token from metadata server
    const tokenResponse = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const { access_token } = await tokenResponse.json();

    // Use Dialogflow CX ListConversations API (v3beta1 for conversations support)
    const parent = `projects/${projectId}/locations/${location}/agents/${agentId}`;
    
    // Get latest conversation (no time filter - get most recent regardless of age)
    const url = `https://dialogflow.googleapis.com/v3beta1/${parent}/conversations?pageSize=1`;
    
    console.log('Fetching latest conversation from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId
      }
    });

    const responseText = await response.text();
    console.log('API Response status:', response.status);
    console.log('API Response:', responseText);

    if (!response.ok) {
      console.error('ListConversations API error:', response.status, responseText);
      // Return most recent from your console list
      return NextResponse.json({ 
        sessionId: 'session-1761318928565',
        source: 'fallback-api-error',
        error: `API returned ${response.status}`,
        timestamp: new Date().toISOString()
      });
    }

    const data = JSON.parse(responseText);
    
    if (data.conversations && data.conversations.length > 0) {
      // Extract session ID from conversation name
      // Format: projects/.../conversations/{sessionId}
      const latestConv = data.conversations[0];
      const sessionId = latestConv.name.split('/').pop();
      
      console.log('Found latest session:', sessionId);
      
      return NextResponse.json({ 
        sessionId,
        source: 'dialogflow-api',
        timestamp: new Date().toISOString(),
        conversationName: latestConv.name
      });
    } else {
      console.warn('No conversations found in API response');
      // Return most recent from your console list
      return NextResponse.json({ 
        sessionId: 'session-1761318928565',
        source: 'fallback-no-conversations',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Latest session error:', error);
    
    // Return the most recent known session from your console
    return NextResponse.json({ 
      sessionId: 'session-1761318928565',
      source: 'fallback-error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
