import {expect}        from 'chai';
import chalk           from 'chalk';
import {performance}   from 'node:perf_hooks';
import {EasyDataState} from '../../src/easy-data-state';

describe('EasyDataState performance (basic)', () => {
  let state;
  let performanceMessage = '';
  beforeEach(() => state = new EasyDataState());

  it('performed 10,000 writes and respective callback executions for 50-level nested data address', () => {
    let callCount = 0;
    let executions = 10_000;
    let address = Array(50).fill('a'.repeat(20)).join('.');
    let unsubscribe = state.subscribe(address, () => callCount++);
    let time = performance.now();

    for(let i = 0; i < executions; i++) {
      state.write(address, i);
    }

    unsubscribe();
    time = ((performance.now() - time) / executions).toFixed(3);
    performanceMessage = `executed one write and its respective callback invocation in ${chalk.bold(time)}ms`;
    expect(callCount).to.equal(executions);
  });

  it('', function() {
    this._runnable.title = performanceMessage;
  });
});
