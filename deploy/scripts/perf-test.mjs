/**
 * OA 办公知识库 - 性能压测脚本（零依赖，Node.js 运行）
 *
 * 用法：
 *   node deploy/scripts/perf-test.mjs [target-url] [duration-sec] [concurrency]
 *
 * 默认：
 *   target-url = http://localhost/health
 *   duration   = 15s
 *   concurrency= 50
 *
 * 考核要求：单机 QPS 不低于 100
 */
import http from 'node:http';
import { URL } from 'node:url';

const target = process.argv[2] || 'http://localhost/health';
const durationSec = parseInt(process.argv[3] || '15', 10);
const concurrency = parseInt(process.argv[4] || '50', 10);

const url = new URL(target);
const isHttps = url.protocol === 'https:';
const lib = isHttps ? await import('node:https') : http;

let success = 0;
let fail = 0;
let totalLatency = 0;
let minLatency = Infinity;
let maxLatency = 0;
const latencies = [];
let stopped = false;

function oneRequest() {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: { 'User-Agent': 'perf-test/1.0', Accept: 'application/json' },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          const ms = Number(process.hrtime.bigint() - start) / 1e6;
          if (res.statusCode >= 200 && res.statusCode < 400) {
            success++;
            totalLatency += ms;
            if (ms < minLatency) minLatency = ms;
            if (ms > maxLatency) maxLatency = ms;
            latencies.push(ms);
          } else {
            fail++;
          }
          resolve();
        });
      },
    );
    req.on('error', () => {
      fail++;
      resolve();
    });
    req.end();
  });
}

async function worker() {
  while (!stopped) {
    await oneRequest();
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

console.log('================ 压测开始 ================');
console.log(`目标: ${target}`);
console.log(`时长: ${durationSec}s | 并发: ${concurrency}`);
console.log('-----------------------------------------');

const workers = Array.from({ length: concurrency }, () => worker());
const endAt = Date.now() + durationSec * 1000;
const timer = setInterval(() => {
  const total = success + fail;
  process.stdout.write(`\r进行中: ${total} 请求 | 成功 ${success} | 失败 ${fail}`);
  if (Date.now() >= endAt) {
    clearInterval(timer);
    stopped = true;
  }
}, 500);

await Promise.all(workers);
process.stdout.write('\n');

const total = success + fail;
const qps = (total / durationSec).toFixed(1);
const avgLatency = success ? (totalLatency / success).toFixed(1) : '0';
latencies.sort((a, b) => a - b);

console.log('-----------------------------------------');
console.log('压测结果:');
console.log(`  总请求数:   ${total}`);
console.log(`  成功 / 失败: ${success} / ${fail}`);
console.log(`  QPS:        ${qps}`);
console.log(`  平均延迟:   ${avgLatency} ms`);
console.log(`  最小/最大:  ${success ? minLatency.toFixed(1) : '-'} / ${maxLatency.toFixed(1)} ms`);
console.log(`  P95 延迟:   ${percentile(latencies, 95).toFixed(1)} ms`);
console.log(`  P99 延迟:   ${percentile(latencies, 99).toFixed(1)} ms`);
console.log('=========================================');

// 考核判定
const PASS_THRESHOLD = 100;
const passed = parseFloat(qps) >= PASS_THRESHOLD && fail === 0;
console.log(passed ? '✓ 考核通过: QPS ≥ 100 且无失败' : `✗ 未达标: 需 QPS ≥ 100（当前 ${qps}）`);
process.exit(passed ? 0 : 1);
