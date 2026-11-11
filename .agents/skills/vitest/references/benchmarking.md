# Benchmarking (v5)

`bench` is no longer a top-level import. It is a test-context fixture used inside a regular `test()`, available only in files that match `benchmark.include` (default `**/*.{bench,benchmark}.?(c|m)[jt]s?(x)`). Benchmarks are powered by [Tinybench](https://github.com/tinylibs/tinybench).

```ts
import { expect, test } from 'vite-plus/test';

test('parse performance', async ({ bench }) => {
  const result = await bench('parse', () => {
    const data = JSON.parse('{"key":"value"}');
    use(data); // consume the result: engines may eliminate dead code
  }).run();

  expect(result.throughput.mean).toBeGreaterThan(10_000);
});
```

```bash
npx vp test bench           # only benchmarks (implicitly enables them)
npx vp test bench parser    # filter by file name
npx vp test bench -t JSON   # filter by test name
```

`benchmark: { enabled: true }` runs them next to the regular tests in a separate isolated group. (Check the exact `vp` form with `vp test --help`.)

## Comparing implementations

```ts
test('compare parsers', async ({ bench }) => {
  const result = await bench.compare(
    bench('JSON.parse', () => {
      JSON.parse(input);
    }),
    bench('custom', { beforeEach: () => reset() }, () => {
      customParse(input);
    }),
    { iterations: 100, time: 1000 }, // shared Tinybench options (last argument)
  );

  expect(result.get('JSON.parse')).toBeFasterThan(result.get('custom'), { delta: 0.1 });
  expect(result.get('custom')).toBeSlowerThan(result.get('JSON.parse'));
});
```

`bench.compare` interleaves iterations to reduce bias and prints a comparison table.

## Storing and replaying baselines

```ts
test('compare against baseline', async ({ bench }) => {
  await bench.compare(
    bench('current', { writeResult: './benchmarks/parse.json' }, () => parse(input)),
    bench.from('previous', './benchmarks/parse.json'), // reads a stored result, runs nothing
  );
});
```

`writeResult` overwrites the JSON file on every successful run. For multi-project workspaces pass `{ perProject: true }` and use `${projectName}` in the path.

## Stability

- Benchmark files run sequentially, never in parallel; `retry` and the `delta` option reduce flakiness.
- Consume the result inside the bench function.
- In Node mode every imported binding goes through Vite's module runner: store hot references locally (`const _parse = parse`) or benchmark the built package.
- v5 removed `bench.skip/only/todo` (use `test.skip/only/todo`) and the `benchmark.reporters`/`outputFile`/`compare` options (use `--reporter=json --outputFile`).
