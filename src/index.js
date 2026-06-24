/**
 * fun sport nexus 2026.12 申込システム
 * Cloudflare Workers エントリーポイント
 *
 * /api/*   → APIハンドラー（Phase 3で実装）
 * /admin/* → 管理画面（Phase 4で実装、Cloudflare Access で保護）
 * その他   → public/ の静的ファイル
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============ API ハンドラー（Phase 3 で実装） ============
    if (path.startsWith('/api/')) {
      try {
        // /api/slots → スロット一覧＋残席（Phase 3）
        if (path === '/api/slots' && request.method === 'GET') {
          return await handleSlots(request, env);
        }

        // /api/apply → 申込受付（Phase 3）
        if (path === '/api/apply' && request.method === 'POST') {
          return jsonResponse({ error: 'Not implemented yet (Phase 3)' }, 503);
        }

        // 管理API（Phase 4）
        if (path.startsWith('/api/admin/')) {
          return jsonResponse({ error: 'Admin API not implemented yet (Phase 4)' }, 503);
        }

        return jsonResponse({ error: 'API endpoint not found' }, 404);
      } catch (err) {
        console.error('API error:', err);
        return jsonResponse({ error: 'Internal server error', message: err.message }, 500);
      }
    }

    // ============ 静的アセット ============
    // /admin/ は管理画面、それ以外は申込フォーム
    return env.ASSETS.fetch(request);
  },
};


// ============ Phase 3 でフル実装予定の最小スタブ ============

/**
 * GET /api/slots
 * スロット一覧と残席数を返す
 */
async function handleSlots(request, env) {
  const result = await env.DB.prepare(`
    SELECT
      s.id, s.code, s.program_code, s.program_name,
      s.day, s.date, s.time_start, s.time_end, s.venue,
      s.capacity, s.description, s.is_active, s.sort_order,
      COALESCE(SUM(es.attendees), 0) AS reserved,
      (s.capacity - COALESCE(SUM(es.attendees), 0)) AS remaining
    FROM slots s
    LEFT JOIN entry_slots es ON s.id = es.slot_id
    LEFT JOIN entries e ON es.entry_id = e.id AND e.status = 'confirmed'
    WHERE s.is_active = 1
    GROUP BY s.id
    ORDER BY s.sort_order, s.id
  `).all();

  return jsonResponse({ slots: result.results });
}


// ============ ヘルパー ============

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
