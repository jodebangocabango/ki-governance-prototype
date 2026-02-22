/**
 * Functional SSE stream parser for LLM responses.
 * Parses Server-Sent Events and yields text chunks.
 */

export async function* parseSSEStream(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value, { stream: true }).split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.text) yield parsed.text
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
