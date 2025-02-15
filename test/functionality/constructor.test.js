import {expect}                               from 'chai';
import {EasyDataState, easyDataStateValueKey} from '../../src/easy-data-state';

describe('EasyDataState constructor', () => {
  let state;
  beforeEach(() => state = new EasyDataState());

  it('sets all read data to be returned as array', () => {
    let state = new EasyDataState({asArray: true});
    state.write({one: 1, two: 2});
    expect(state.read(['one', 'two'])).to.eql([1, 2]);
  });

  it('configures all read data to be produced as an object', () => {
    let state = new EasyDataState({asObject: true});
    state.write('one', 1);
    expect(state.read('one')).to.eql({one: 1});
  });

  it('is instantiated with cloneReadData set to true by default', () => {
    state.write('one', 1);
    let read1 = state.read();
    let read2 = state.read();
    expect(read1).to.not.be.undefined;
    expect(read2).to.not.be.undefined;
    expect(read1).to.not.equal(read2);
  });

  it('is initialized with cloneWriteData set to true by default', () => {
    let state = new EasyDataState({cloneReadData: false});
    let map = new Map();
    state.write('map', map);
    let readMap = state.read('map');
    expect(readMap).to.not.be.undefined;
    expect(readMap).to.not.equal(map);
  });

  it('can write and read a piece of data without cloning', () => {
    let func = () => {};
    let state = new EasyDataState({cloneReadData: false, cloneWriteData: false});
    func[easyDataStateValueKey] = true;
    state.write('func', func);
    expect(state.read('func')).to.equal(func);
  });
});
