import {expect}                               from 'chai';
import {EasyDataState, easyDataStateValueKey} from '../../src/easy-data-state';

describe('EasyDataState write()', () => {
  let state;
  beforeEach(() => state = new EasyDataState());

  describe('operations', () => {
    it('adds a root-level data entry via a key/value call', () => {
      state.write('one', 1);
      expect(state.read()).to.eql({one: 1});
    });
  
    it('includes a multi-level data entry via a key/value call', () => {
      state.write('one.two.three', 3);
      expect(state.read()).to.eql({one: {two: {three: 3}}});
    });
  
    it('writes a multi-level datum via a key (as an array) and value call', () => {
      state.write(['one', 'two', 'three'], 3);
      expect(state.read()).to.eql({one: {two: {three: 3}}});
    });
  
    it('places a root-level data entry via an object parameter', () => {
      let data = {one: 1};
      state.write(data);
      expect(state.read()).to.eql(data);
    });
  
    it('appends a multi-level data entry using an object parameter', () => {
      let data = {one: {two: {three: 3}}}
      state.write(data);
      expect(state.read()).to.eql(data);
    });
  
    it('mutates an existing value using a callback', () => {
      state.write({two: 2});
      state.write('two', (value) => value * 2);
      expect(state.read('two')).to.equal(4);
    });
  
    it('processes a write object of key/value and key/callback pairs', () => {
      let data = {one: 1, two: 2};
      state.write(data);
      expect(state.read()).to.eql(data);
      state.write({one: 'one', two(two) {return two * 2}});
      expect(state.read()).to.eql({one: 'one', two: 4});
    });
  
    it('processes dot-delimited paths in an object parameter', () => {
      state.write({'one.two.three': 3, 'one.five': 5});
      expect(state.read()).to.eql({one: {two: {three: 3}, five: 5}});
    });
  
    it('appends a new value to an existing state', () => {
      state.write({one: {two: {three: 3}}});
      state.write('one.two.four', 4);
      expect(state.read('one.two')).to.eql({three: 3, four: 4});
    });
  
    it('replaces an existing value', () => {
      let address = 'one.two.three';
      let value = '3'
      state.write({one: {two: {three: 3}}});
      state.write(address, value);
      expect(state.read(address)).to.equal(value);
    });

    it('overwrites a previous primitive with a nested structure', () => {
      state.write('one', 1);
      expect(state.read('one')).to.equal(1);
      state.write({one: {two: {three: 'three'}}});
      expect(state.read('one')).to.eql({two: {three: 'three'}});
    });
  });

  describe('configurations', () => {
    it('puts data as is when cloneWriteData is false', () => {
      let map =  new Map();
      state.write('map', map, {cloneWriteData: false});
      expect(state.read('map', {cloneReadData: false})).to.equal(map);
    });

    it('writes a function as value with cloning turned off and with a function marked as value', () => {
      let output = 'test';
      let func = () => output;
      func[easyDataStateValueKey] = true;
      state.write('func', func, {cloneWriteData: false});
      expect(state.read('func', {cloneReadData: false})()).to.equal(output);
    });

    it('stores an object as is without traversing it with cloning turned off and an object marked as value', () => {
      let o = {one: 1, two: 2, [easyDataStateValueKey]: true};
      state.write('o', o, {cloneWriteData: false});
      expect(state.read('o', {cloneReadData: false})).to.equal(o);
    });
  });
});
