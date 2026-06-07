import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { task } = await request.json();

    if (!task || typeof task !== 'string') {
      return NextResponse.json({ error: 'Task description required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: `You generate quest text for a gamified RPG productivity app called QuestLog. Users turn real-life tasks into quests.

Given a brief task description, produce:
- title: A short, creative RPG-style quest name (modern English, not old English). Keep it punchy (2-5 words).
- description: A brief quest objective in RPG style (modern English, 1-2 sentences). Describe the task as if it were an actual quest.
- flavorText: A short atmospheric line written in old English / medieval fantasy style. This should sound like it comes from an ancient scroll or wise sage.

Respond ONLY with valid JSON in this exact format:
{"title":"...","description":"...","flavorText":"..."}`,
      messages: [{ role: 'user', content: `Task: ${task}` }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response generated' }, { status: 500 });
    }

    let raw = textBlock.text.trim();
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1].trim();

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: 'Failed to parse response', raw }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
