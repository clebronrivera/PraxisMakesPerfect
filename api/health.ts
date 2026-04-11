/**
 * GET /api/health
 * Basic health check endpoint. Returns 200 OK with timestamp.
 */
export async function handler() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  };
}
