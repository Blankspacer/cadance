import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check Settings > Secrets to ensure a valid API key is attached.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleAIError(res: express.Response, err: unknown) {
  console.error('Gemini API error:', err);
  const message = err instanceof Error ? err.message : 'Unexpected AI service error';
  const status = message.includes('GEMINI_API_KEY') ? 500 : 502;
  res.status(status).json({ error: message });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // 1. Generate Facebook and/or LinkedIn posts with captions & hashtags
  app.post('/api/ai/generate-post', async (req, res) => {
    try {
      const { brand, platform, topic, goal, tone, callToAction } = req.body;
      if (!topic || !brand?.name) {
        res.status(400).json({ error: 'Brand profile and topic are required.' });
        return;
      }

      const ai = getAIClient();
      const targetPlatforms =
        platform === 'both' ? 'both LinkedIn and Facebook' : platform === 'linkedin' ? 'LinkedIn' : 'Facebook';

      const prompt = `Create high-converting social media posts for ${targetPlatforms}.
Brand Name: ${brand.name}
Customer Category: ${brand.category}
Industry & Offering: ${brand.industry}
Target Audience: ${brand.audience}
Brand Voice: ${brand.voice}

Campaign Topic / Brief: ${topic}
Campaign Goal: ${goal || 'Engagement & brand awareness'}
Desired Tone: ${tone || brand.voice}
Preferred Call-to-Action: ${callToAction || 'Invite comments or link click'}

Requirements:
- Tailor each post specifically to the platform's native format and audience behavior:
  - LinkedIn: strong opening hook (first 2 lines), scannable paragraphs or concise bullets, professional insight or story, thoughtful closing question.
  - Facebook: warm, community-oriented, conversational hook, clear value or offer, approachable call-to-action.
- Include 5 to 8 relevant, non-spammy hashtags per post (formatted without # or with #, let's return clean hashtag strings starting with #).
- Suggest an optimal posting time window and brief rationale.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert senior social media strategist for marketing agencies, restaurants, retailers, and SMEs. Write authentic, conversion-oriented, zero-fluff social media copy tailored to Facebook and LinkedIn.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING, description: 'Either "linkedin" or "facebook"' },
                    headline: { type: Type.STRING, description: 'Short internal title or hook summary' },
                    caption: { type: Type.STRING, description: 'Complete ready-to-publish post body' },
                    hashtags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '5 to 8 targeted hashtags including # prefix',
                    },
                    bestTime: { type: Type.STRING, description: 'Recommended posting window e.g. Tue 09:30 AM' },
                    rationale: { type: Type.STRING, description: 'Why this structure fits the audience' },
                    cta: { type: Type.STRING, description: 'Primary call to action used' },
                  },
                  required: ['platform', 'headline', 'caption', 'hashtags', 'bestTime', 'rationale', 'cta'],
                },
              },
            },
            required: ['posts'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{"posts":[]}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 2. Repurpose a blog post / article into Facebook & LinkedIn social posts
  app.post('/api/ai/repurpose-blog', async (req, res) => {
    try {
      const { brand, blogTitle, blogContent } = req.body;
      if (!blogContent || !brand?.name) {
        res.status(400).json({ error: 'Brand profile and blog content are required.' });
        return;
      }

      const ai = getAIClient();
      const prompt = `Repurpose the following blog article into 4 distinct, ready-to-schedule social media posts (2 for LinkedIn, 2 for Facebook) for ${brand.name} (${brand.category} — ${brand.industry}).
Brand Voice: ${brand.voice}
Target Audience: ${brand.audience}

Blog Title: ${blogTitle || 'Untitled Article'}
Blog Content:
${blogContent.slice(0, 12000)}

Produce:
1. A brief 2-sentence executive summary of the article.
2. 3 key takeaways extracted from the article.
3. 4 tailored social posts:
   - LinkedIn Post 1: Thought-leadership / key insight breakdown
   - LinkedIn Post 2: Story / practical checklist angle driving readers to the full article
   - Facebook Post 1: Community discussion question sparked by the article
   - Facebook Post 2: Quick actionable tip + soft promotional tie-in
Each post must include tailored caption, 5-7 hashtags starting with #, and recommended posting window.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a content repurposing specialist transforming long-form blog posts into high-engagement Facebook and LinkedIn campaigns.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING, description: 'Either "linkedin" or "facebook"' },
                    angle: { type: Type.STRING, description: 'Content angle label e.g. Thought Leadership' },
                    caption: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    bestTime: { type: Type.STRING },
                  },
                  required: ['platform', 'angle', 'caption', 'hashtags', 'bestTime'],
                },
              },
            },
            required: ['summary', 'keyTakeaways', 'posts'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 3. Build a monthly cross-platform content calendar
  app.post('/api/ai/generate-calendar', async (req, res) => {
    try {
      const { brand, monthLabel, daysInMonth, postsPerWeek, campaignFocus } = req.body;
      if (!brand?.name || !monthLabel) {
        res.status(400).json({ error: 'Brand profile and month are required.' });
        return;
      }

      const totalEntries = Math.min(Math.max(Number(postsPerWeek || 3) * 4, 8), 20);
      const maxDay = Number(daysInMonth) || 30;
      const ai = getAIClient();

      const prompt = `Build a monthly social media content calendar for ${monthLabel} (days 1 to ${maxDay}).
Brand: ${brand.name} (${brand.category} — ${brand.industry})
Target Audience: ${brand.audience}
Brand Voice: ${brand.voice}
Monthly Campaign Focus: ${campaignFocus || 'Consistent audience growth, customer proof, and seasonal offers'}
Target Volume: Generate exactly ${totalEntries} balanced posts spread evenly across days 1 to ${maxDay}, alternating between "linkedin" and "facebook".

Each calendar entry must include:
- dayOfMonth (integer between 1 and ${maxDay})
- time (e.g. "09:30", "12:15", "17:45")
- platform ("linkedin" or "facebook")
- pillar (e.g. "Behind the Scenes", "Customer Proof", "Educational Tip", "Seasonal Offer", "Industry Insight")
- title (concise 4-7 word topic title)
- caption (complete, ready-to-approve social caption with hook and CTA)
- hashtags (4-6 hashtags starting with #)`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a senior social media calendar planner creating balanced, realistic monthly editorial schedules for agencies, restaurants, retailers, and SMEs.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategyNote: { type: Type.STRING },
              entries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayOfMonth: { type: Type.INTEGER },
                    time: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    pillar: { type: Type.STRING },
                    title: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['dayOfMonth', 'time', 'platform', 'pillar', 'title', 'caption', 'hashtags'],
                },
              },
            },
            required: ['strategyNote', 'entries'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{"entries":[]}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 4. Draft automated audience engagement reply
  app.post('/api/ai/engagement-reply', async (req, res) => {
    try {
      const { brand, platform, authorName, commentText, postContext } = req.body;
      if (!commentText || !brand?.name) {
        res.status(400).json({ error: 'Brand and comment text are required.' });
        return;
      }

      const ai = getAIClient();
      const prompt = `Draft a concise, authentic public reply on ${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} for ${brand.name} (${brand.category}).
Brand Voice: ${brand.voice}
Original Post Topic: ${postContext || 'Recent campaign post'}
Commenter Name: ${authorName || 'Follower'}
Incoming Comment / Inquiry: "${commentText}"

Return a warm, helpful reply that builds trust and nudges toward the next natural step (booking, DM, link visit, or conversation).`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a community manager drafting natural, human-sounding replies to customer comments on Facebook and LinkedIn.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              toneNote: { type: Type.STRING },
              followUpAction: { type: Type.STRING },
            },
            required: ['reply', 'toneNote', 'followUpAction'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
