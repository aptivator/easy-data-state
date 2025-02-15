import {expect}        from 'chai';
import {EasyDataState} from '../../src/easy-data-state';

describe('EasyDataState read()', () => {
  let state;
  beforeEach(() => state = new EasyDataState());

  describe('operations', () => {
    it('returns an entire state', () => {
      state.write('one.two.three', 3);
      expect(state.read()).to.eql({one: {two: {three: 3}}});
    });
  
    it('outputs a value of a single accessed property when no configs are specified', () => {
      state.write('one.two', 2);
      expect(state.read('one.two')).to.equal(2);
    });
  
    it('produces an object of values (by default) when more than one property is requested', () => {
      state.write({one: 1, two: 2, three: 3});
      expect(state.read(['one', 'two'])).to.eql({one: 1, two: 2});
    });
  
    it('uses last part of multi-part addresses when returning values as object', () => {
      state.write({one: {two: 2, three: 3}});
      expect(state.read(['one.two', 'one.three'])).to.eql({two: 2, three: 3});
    });
  
    it('overwrites multi-level data reads that have the same last part', () => {
      state.write({one: {two: 2}, two: {two: '2'}, three: {two: 'two'}});
      expect(state.read(['one.two', 'two.two', 'three.two'])).to.eql({two: 'two'});
    });
  
    it('allows specifying a key/alias under which a read datum is stored within a return object', () => {
      let reads = [{'one.two': 'two1'}, {'two.two': 'two2'}, {'three.two': 'two3'}];
      state.write({one: {two: 2}, two: {two: '2'}, three: {two: 'two'}});
      let read = state.read(reads);
      expect(read).to.eql({two1: 2, two2: '2', two3: 'two'});
    });
  
    it('accepts namespaced array addresses', () => {
      let namespacedAddresses = [['profile', [['collection', ['name', 'type']]]], 'info'];
      state.write({profile: {collection: {name: 'name', status: true, type: 'type'}}, info: 'i'});
      expect(state.read(namespacedAddresses)).to.eql({name: 'name', type: 'type', info: 'i'});
    });
  
    it('can read an array subaddress within a namespaced array address', () => {
      let namespacedAddresses = [['profile', [['collection', [['name', 'type']]]]], 'start'];
      state.write({start: 'start', profile: {collection: {name: {type: 'type'}}}});
      expect(state.read(namespacedAddresses)).to.eql({type: 'type', start: 'start'});
    });
  
    it('supports data aliases within a namespaced array address', () => {
      let namespacedAddresses = [['profile', [['collection', [{name: 'collectionName'}]]]], 'name'];
      state.write({profile: {collection: {name: 'name', status: true, type: 'type'}}, name: 'i'});
      let read = state.read(namespacedAddresses);
      expect(read).to.eql({collectionName: 'name', name: 'i'});
    });
  
    it('responds with undefined when a property does not exist', () => {
      expect(state.read('one.two')).to.be.undefined;
    });

    it('can take configs as the only parameter and return a global state', () => {
      let data = {one: 1, two: 2};
      state.write(data);
      let read = state.read({asArray: true});
      expect(read).to.eql([data]);
    });
  });

  describe('configurations', () => {
    it('gives a single value when asObject configuration is true', () => {
      state.write({one: 1, two: 2});
      expect(state.read('one', {asObject: true})).to.eql({one: 1});
    });

    it('presents a single value when asArray configuration is true', () => {
      state.write({one: 1, two: 2});
      expect(state.read('two', {asArray: true})).to.eql([2]);
    });

    it('fetches a subset of an actual state when cloneReadData is false', () => {
      state.write({one: {two: {three: 3}}});
      let read1 = state.read('one.two', {cloneReadData: false});
      let read2 = state.read('one.two', {cloneReadData: false});
      expect(read1).to.equal(read2);
    });
  });
});
