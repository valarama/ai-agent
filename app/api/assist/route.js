import { NextResponse } from 'next/server';
import { SessionsClient } from '@google-cloud/dialogflow-cx';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    const projectId = 'arcane-rigging-473104-k3';
    const location = 'global';
    const agentId = '1f0172a0-5c53-4417-8713-83b66cbb5a24';

    const client = new SessionsClient();
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      `assist-${Date.now()}`
    );

    // Get context-aware suggestions from Dialogflow CX
    const dialogflowRequest = {
      session: sessionPath,
      queryInput: {
        text: {
          text: `Analyze this conversation and provide agent suggestions: ${transcript}`,
        },
        languageCode: 'en',
      },
    };

    const [response] = await client.detectIntent(dialogflowRequest);

    const responseText = response.queryResult?.responseMessages
      ?.map(msg => msg.text?.text?.[0])
      .filter(Boolean)
      .join(' ') || '';

    // Parse response into suggestions
    const suggestions = [];
    
    if (responseText) {
      // Split by sentences and create suggestion objects
      const lines = responseText.split(/[.!?]+/).filter(line => line.trim());
      lines.slice(0, 3).forEach(line => {
        suggestions.push({
          text: line.trim() + '.',
          confidence: 0.85
        });
      });
    }

    // Add default helpful suggestions if none found
    if (suggestions.length === 0) {
      suggestions.push(
        { text: 'I understand you need help. Let me assist you with that.', confidence: 0.9 },
        { text: 'Could you please provide more details so I can better assist you?', confidence: 0.85 },
        { text: 'I\'m here to help. What specific issue are you experiencing?', confidence: 0.8 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Assist API Error:', error);
    return NextResponse.json({
      success: false,
      suggestions: [
        { text: 'Thank you for contacting us. How may I assist you today?', confidence: 0.9 }
      ],
      error: error.message
    }, { status: 500 });
  }
}
