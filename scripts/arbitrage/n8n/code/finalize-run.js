// Finalize Run Log — folds the Supabase upsert result into the run summary.
const run = { ...$('Arbitrage Sanitizer').first().json.run };
try {
  const upsert = $input.first().json || {};
  const status = Number(upsert.statusCode ?? 200);
  if (upsert.error || status >= 300) {
    const detail = upsert.error?.message || JSON.stringify(upsert.body ?? upsert).slice(0, 300);
    run.status = 'error';
    run.error = [run.error, `Supabase upsert failed (${status}): ${detail}`].filter(Boolean).join(' | ');
  }
} catch (error) {
  run.status = 'error';
  run.error = [run.error, `Finalize error: ${error.message}`].filter(Boolean).join(' | ');
}
run.finished_at = new Date().toISOString();
return [{ json: { run } }];
