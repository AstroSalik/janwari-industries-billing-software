export interface SnapToBillItem {
  description: string;
  quantity: number | null;
  unit: string | null;
  rate: number | null;
  amount: number | null;
  confidence: 'high' | 'low';
}

export interface SnapToBillResult {
  vendor: string | null;
  date: string | null;
  items: SnapToBillItem[];
  total: number | null;
  notes: string | null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeDate(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const directMatch = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!directMatch) return text;

  const day = directMatch[1].padStart(2, '0');
  const month = directMatch[2].padStart(2, '0');
  const year = directMatch[3].length === 2 ? `20${directMatch[3]}` : directMatch[3];
  return `${day}/${month}/${year}`;
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Claude did not return valid JSON');
  }

  return JSON.parse(text.slice(start, end + 1));
}

function normalizeResult(payload: any): SnapToBillResult {
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return {
    vendor: normalizeText(payload?.vendor),
    date: normalizeDate(payload?.date),
    total: normalizeNumber(payload?.total),
    notes: normalizeText(payload?.notes),
    items: items
      .map((item: any) => ({
        description: normalizeText(item?.description) || '',
        quantity: normalizeNumber(item?.quantity),
        unit: normalizeText(item?.unit),
        rate: normalizeNumber(item?.rate),
        amount: normalizeNumber(item?.amount),
        confidence: item?.confidence === 'low' ? 'low' : 'high',
      }))
      .filter((item: SnapToBillItem) => item.description),
  };
}

export class SnapToBillService {
  static async extractFromImage(buffer: Buffer, mediaType: string): Promise<SnapToBillResult> {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY is not configured on the server');
    }

    const base64ImageString = buffer.toString('base64');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64ImageString,
              },
            },
            {
              type: 'text',
              text: `You are reading a bill, invoice, or handwritten chit from 
an auto parts and battery shop in India. Extract all line items you can see.

Return ONLY a valid JSON object, no explanation, no markdown, no backticks.
Format:
{
  "vendor": "vendor name if visible, else null",
  "date": "date if visible in DD/MM/YYYY format, else null",
  "items": [
    {
      "description": "item name as written",
      "quantity": number or null if unclear,
      "unit": "pcs/kg/set etc or null",
      "rate": number or null if unclear,
      "amount": number or null if unclear,
      "confidence": "high" or "low"
    }
  ],
  "total": number or null,
  "notes": "any other relevant text visible on the bill"
}

Mark confidence as "low" for any field you are uncertain about.
If a value is completely unreadable, use null.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Claude API request failed: ${response.status} ${details}`);
    }

    const data = await response.json() as any;
    const textBlock = data?.content?.find((entry: any) => entry?.type === 'text')?.text;

    if (!textBlock) {
      throw new Error('Claude response did not include text output');
    }

    return normalizeResult(extractJsonObject(textBlock));
  }
}
