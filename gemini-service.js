// ⚠️ NOTE: This file is NOT currently used by the extension
// The ad blocker now works completely offline without any API calls
// This file is kept for reference only

// Gemini API Service for Ad Detection
// This was used in a previous version that relied on AI-powered ad detection
// The current version uses pattern matching instead for better privacy and performance

class GeminiAdDetector {
  constructor() {
    // Use Gemini API directly - you'll need to add your API key here
    this.apiKey = 'AIzaSyBPnqJqRfqWRKzLBgWJnQqUkwQJuqDkJcM'; // Replace with your actual API key
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.cache = new Map();
  }

  async detectAd(elementData) {
    const cacheKey = `${elementData.className}_${elementData.id}_${elementData.tagName}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.createPrompt(elementData);

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;

        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          this.cache.set(cacheKey, result);
          return result;
        }
      }

      // Default response if parsing fails
      return { isAd: false, confidence: 0, reason: 'Unable to parse response' };

    } catch (error) {
      console.error('Gemini API error:', error);
      return { isAd: false, confidence: 0, reason: `Error: ${error.message}` };
    }
  }

  createPrompt(elementData) {
    return `Analyze this HTML element and tell me if it is an ad. 
Respond ONLY with this JSON structure: {"isAd": boolean, "confidence": number, "reason": "string"}.

Element:
Tag: ${elementData.tagName}
Class: ${elementData.className}
ID: ${elementData.id}
Text: ${(elementData.textContent || '').substring(0, 200)}
URLs: ${elementData.urls?.join(', ') || 'none'}
`;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiAdDetector;
}
