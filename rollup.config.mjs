import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/perf-monitor-sdk.umd.js',
      format: 'umd',
      name: 'PerfMonitor',
      sourcemap: true,
    },
    {
      file: 'dist/perf-monitor-sdk.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
    }),
  ],
};
