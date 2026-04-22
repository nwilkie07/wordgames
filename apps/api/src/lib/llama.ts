interface CompletionOptions {
  model?: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  stop?: string[];
}

interface CompletionResponse {
  content: string;
  stop_reason: string;
}

export class LlamaService {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = 'http://localhost:8080',
    model = 'qwen2.5-1.5b-instruct',
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async complete(options: CompletionOptions): Promise<string> {
    const { prompt, max_tokens = 150, temperature = 0.7, stop } = options;

    const response = await fetch(`${this.baseUrl}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: this.model,
        max_tokens,
        temperature,
        stop: stop || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content || data.response || '';
  }

  async generateHints(params: {
    letters: string;
    centerLetter: string;
    foundWords: string[];
    remainingCount: number;
    allValidWords: string[];
  }): Promise<string[]> {
    const { letters, centerLetter, foundWords, remainingCount, allValidWords } =
      params;
    const foundSet = new Set(foundWords.map((w) => w.toLowerCase()));
    const notFound = allValidWords.filter(
      (w) => !foundSet.has(w.toLowerCase()),
    );
    const sampleWords = notFound.slice(0, 50).join(', ');

    const prompt = `<|im_start|>user
You are a word puzzle assistant for a Spelling Bee style game.
The puzzle letters are: ${letters.split('').join(', ')}
The required center letter is: ${centerLetter}

The player has found ${foundWords.length} words.
There are ${remainingCount} words remaining to find.

Here are some valid words they haven't found yet (examples only):
${sampleWords}

Generate 3 short, helpful hints (1-2 sentences each) to help the player find more words.
Focus on patterns like:
- Letter combinations (QU, TH, CH, etc.)
- Word lengths
- Common word structures
- Specific words that might be pangrams

Format your response as a numbered list like:
1. Hint text here
2. Hint text here
3. Hint text here
<|im_end|>
<|im_start|>assistant
`;

    try {
      const response = await this.complete({ prompt });
      const hints = response
        .split(/\n/)
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line) => line.length > 0);

      return hints.length > 0
        ? hints
        : ['Keep trying! Look for common letter patterns.'];
    } catch (error) {
      console.error('Llama API error:', error);
      return ['Hint unavailable. Try exploring different letter combinations.'];
    }
  }
}

export const llamaService = new LlamaService();
