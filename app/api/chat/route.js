import { NextResponse } from 'next/server';
import { SessionsClient } from '@google-cloud/dialogflow-cx';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    const projectId = 'arcane-rigging-473104-k3';
    const location = 'global';
    const agentId = '1f0172a0-5c53-4417-8713-83b66cbb5a24';

    const client = new SessionsClient();
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    const dialogflowRequest = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
        },
        languageCode: 'en',
      },
    };

    const [response] = await client.detectIntent(dialogflowRequest);

    const responseText = response.queryResult?.responseMessages
      ?.map(msg => msg.text?.text?.[0])
      .filter(Boolean)
      .join(' ') || 'I apologize, I could not process that request.';

    return NextResponse.json({
      success: true,
      response: responseText
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      success: false,
      response: 'I apologize for the inconvenience. Please try again.',
      error: error.message
    }, { status: 500 });
  }
}
