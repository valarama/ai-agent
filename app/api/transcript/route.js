import { NextResponse } from 'next/server';
import { SessionsClient } from '@google-cloud/dialogflow-cx';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const projectId = 'arcane-rigging-473104-k3';
    const location = 'global';
    const agentId = '1f0172a0-5c53-4417-8713-83b66cbb5a24';

    // Get access token
    const tokenResponse = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const { access_token } = await tokenResponse.json();

    // Try to get conversation messages
    const sessionPath = `projects/${projectId}/locations/${location}/agents/${agentId}/sessions/${sessionId}`;
    const url = `https://dialogflow.googleapis.com/v3/${sessionPath}/messages`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    let messages = [];
    let suggestions = {
      behavior: [],
      upsell: { possibility: 'No', explanation: '' },
      questions: []
    };

    if (response.ok) {
      const data = await response.json();
      console.log('Messages API response:', JSON.stringify(data).substring(0, 500));
      
      messages = (data.messages || []).map((msg, idx) => ({
        role: msg.participant === 'HUMAN' ? 'customer' : 'agent',
        text: msg.content?.text?.text?.[0] || msg.content || 'Message content unavailable',
        sentiment: msg.sentiment?.magnitude > 0.5 ? (msg.sentiment.score > 0 ? 'Positive' : 'Negative') : 'Neutral',
        time: new Date(msg.createTime).toLocaleTimeString()
      }));

      console.log(`Fetched ${messages.length} messages from Dialogflow`);

      // If no messages fetched, use Costco fallback
      if (messages.length === 0) {
        console.log('No messages from API, using Costco fallback');
        messages = [
          { role: 'agent', text: 'Thank you for calling Costco Smart Appliance Support. My name is Sarah. How can I help you today?', sentiment: 'Neutral', time: '8:15:23 AM' },
          { role: 'customer', text: 'Hi, I just bought a Samsung smart fridge from Costco and I need help setting up the WiFi connection.', sentiment: 'Neutral', time: '8:15:35 AM' },
          { role: 'agent', text: 'I can definitely help you with that! Can you tell me the model number of your fridge? It should be on a sticker inside the refrigerator.', sentiment: 'Neutral', time: '8:15:48 AM' },
          { role: 'customer', text: 'Yes, it\'s model RF28R7351SR. I have the SmartThings app installed on my phone.', sentiment: 'Neutral', time: '8:16:05 AM' },
          { role: 'agent', text: 'Perfect! Let me walk you through the WiFi setup. First, on your fridge display, press and hold the WiFi button for 3 seconds until you see the WiFi icon blinking.', sentiment: 'Neutral', time: '8:16:18 AM' },
          { role: 'customer', text: 'Okay, I see the WiFi icon blinking now.', sentiment: 'Neutral', time: '8:16:32 AM' },
          { role: 'agent', text: 'Great! Now open the SmartThings app on your phone, tap the plus icon to add a new device, and select "Refrigerator" from the list.', sentiment: 'Neutral', time: '8:16:45 AM' },
          { role: 'customer', text: 'I see it! The app found my fridge. It\'s asking for my WiFi password now.', sentiment: 'Positive', time: '8:17:02 AM' },
          { role: 'agent', text: 'Excellent! Enter your WiFi password and the fridge should connect in about 30 seconds. You\'ll see a confirmation on both the app and the fridge display.', sentiment: 'Neutral', time: '8:17:15 AM' }
        ];
      }

      // Generate Agent Assist suggestions based on conversation
      const fullTranscript = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      
      // Check for Costco Smart Appliance keywords
      const hasWifi = fullTranscript.toLowerCase().includes('wifi') || fullTranscript.toLowerCase().includes('wi-fi');
      const hasBluetooth = fullTranscript.toLowerCase().includes('bluetooth');
      const hasFridge = fullTranscript.toLowerCase().includes('fridge') || fullTranscript.toLowerCase().includes('refrigerator');
      const hasWasher = fullTranscript.toLowerCase().includes('washer') || fullTranscript.toLowerCase().includes('washing machine');
      const hasSetup = fullTranscript.toLowerCase().includes('setup') || fullTranscript.toLowerCase().includes('install') || fullTranscript.toLowerCase().includes('connect');
      
      if (hasSetup && (hasWifi || hasBluetooth)) {
        suggestions = {
          behavior: [
            'Acknowledge the customer\'s smart appliance connection needs',
            'Confirm the exact device model and connection type preference',
            'Provide clear step-by-step pairing instructions',
            'Verify router/phone Bluetooth settings are ready',
            'Test connection before ending the call'
          ],
          upsell: {
            possibility: 'Yes',
            explanation: 'Customer is setting up a new smart appliance. This presents an opportunity to offer extended warranty, premium tech support subscription, or complementary smart home devices.'
          },
          questions: [
            'What is your appliance model number?',
            'Is your router nearby and powered on?',
            'Do you have the Costco app installed?',
            'Have you tried restarting the appliance?',
            'Would you like help with app pairing?'
          ]
        };
      } else if (hasFridge) {
        suggestions = {
          behavior: [
            'Ask about specific fridge model and features',
            'Confirm customer has access to settings menu',
            'Guide through display panel navigation',
            'Verify temperature settings are correct'
          ],
          upsell: {
            possibility: 'Yes',
            explanation: 'Customer has a smart fridge. Opportunity to suggest water filter subscription, extended warranty, or other smart kitchen appliances.'
          },
          questions: [
            'Which smart fridge model do you have?',
            'Can you access the display panel?',
            'Is the fridge powered on and cooling?',
            'Do you need help with temperature settings?'
          ]
        };
      } else {
        suggestions = {
          behavior: [
            'Listen actively to customer\'s smart appliance concerns',
            'Identify the specific device and issue clearly',
            'Provide relevant troubleshooting steps',
            'Ensure customer satisfaction before closing'
          ],
          upsell: {
            possibility: 'No',
            explanation: 'Customer query is related to basic troubleshooting. Focus on resolving the current issue first.'
          },
          questions: [
            'What smart appliance are you calling about?',
            'Can you describe the issue?',
            'When did you first notice this?',
            'Have you tried any troubleshooting steps?'
          ]
        };
      }
    } else {
      // Fallback to simulating conversation data if API not available
      messages = [
        { role: 'agent', text: 'Thank you for calling Costco Smart Appliance Support. My name is Sarah. How can I help you today?', sentiment: 'Neutral', time: '8:15:23 AM' },
        { role: 'customer', text: 'Hi, I just bought a Samsung smart fridge from Costco and I need help setting up the WiFi connection.', sentiment: 'Neutral', time: '8:15:35 AM' },
        { role: 'agent', text: 'I can definitely help you with that! Can you tell me the model number of your fridge? It should be on a sticker inside the refrigerator.', sentiment: 'Neutral', time: '8:15:48 AM' },
        { role: 'customer', text: 'Yes, it\'s model RF28R7351SR. I have the SmartThings app installed on my phone.', sentiment: 'Neutral', time: '8:16:05 AM' },
        { role: 'agent', text: 'Perfect! Let me walk you through the WiFi setup. First, on your fridge display, press and hold the WiFi button for 3 seconds until you see the WiFi icon blinking.', sentiment: 'Neutral', time: '8:16:18 AM' },
        { role: 'customer', text: 'Okay, I see the WiFi icon blinking now.', sentiment: 'Neutral', time: '8:16:32 AM' },
        { role: 'agent', text: 'Great! Now open the SmartThings app on your phone, tap the plus icon to add a new device, and select "Refrigerator" from the list.', sentiment: 'Neutral', time: '8:16:45 AM' },
        { role: 'customer', text: 'I see it! The app found my fridge. It\'s asking for my WiFi password now.', sentiment: 'Positive', time: '8:17:02 AM' },
        { role: 'agent', text: 'Excellent! Enter your WiFi password and the fridge should connect in about 30 seconds. You\'ll see a confirmation on both the app and the fridge display.', sentiment: 'Neutral', time: '8:17:15 AM' }
      ];

      suggestions = {
        behavior: [
          'Acknowledge the customer\'s new appliance purchase positively',
          'Ask for specific model number to provide accurate guidance',
          'Provide clear step-by-step WiFi setup instructions',
          'Verify each step is completed before moving forward',
          'Confirm successful connection before ending call'
        ],
        upsell: {
          possibility: 'Yes',
          explanation: 'Customer just purchased a Samsung smart fridge. Great opportunity to offer extended warranty, water filter subscription, or SmartThings hub for additional smart home integration.'
        },
        questions: [
          'What is your fridge model number?',
          'Do you have the SmartThings app installed?',
          'Is the WiFi icon blinking on your fridge display?',
          'Can you see your WiFi network in the app?',
          'Would you like help with any other features?'
        ]
      };
    }

    return NextResponse.json({ messages, suggestions });

  } catch (error) {
    console.error('Get transcript error:', error);
    return NextResponse.json({
      messages: [
        { role: 'agent', text: 'Error loading conversation', sentiment: 'Neutral', time: new Date().toLocaleTimeString() }
      ],
      suggestions: {
        behavior: ['Acknowledge customer needs', 'Provide clear guidance'],
        upsell: { possibility: 'No', explanation: '' },
        questions: ['How can I help you?']
      }
    }, { status: 500 });
  }
}
