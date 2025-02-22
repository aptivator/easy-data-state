import {expect}        from 'chai';
import {EasyDataState} from '../../src/easy-data-state';
import {trap}          from '../_lib/traps';

describe('EasyDataState subscribe()', () => {
  let state;
  beforeEach(() => state = new EasyDataState());
  afterEach(() => trap.u.run().clear());

  describe('operations', () => {
    it(`associates a callback with a state's value`, () => {
      let stateValue;
      let writeValue = 1;
      let callback = (value) => stateValue = value;
      trap.u = state.subscribe('one', callback);
      state.write('one', writeValue)
      expect(stateValue).to.equal(writeValue);
    });
  
    it('links a callback to multiple state values', () => {
      let stateData;
      let writeData = {one: 1, two: 2, three: 3};
      let callback = (data) => stateData = data;
      trap.u = state.subscribe(['one', 'two', 'three'], callback)
      state.write(writeData);
      expect(stateData).to.eql(writeData);
    });

    it('connects a callback to multiple state values and triggers it when just one value changes', () => {
      let stateData;
      let callback = (data) => stateData = data;
      trap.u = state.subscribe(['one', 'two', 'three'], callback)
      state.write({one: 1});
      expect(stateData).to.eql({one: 1, two: undefined, three: undefined});
    });

    it('triggers a callback right after rigistration if its associated state value(s) already exist', () => {
      let writeValue = 1;
      state.write('one', writeValue);
      let stateValue;
      trap.u = state.subscribe('one', (value) => stateValue = value);
      expect(stateValue).to.equal(writeValue);
    });
    
    it('registers and invokes multiple callbacks', () => {
      let callCount = 0;
      let callback = () => callCount++;
      trap.u = state.subscribe('one', callback);
      trap.u = state.subscribe('one', callback);
      state.write('one', 1);
      expect(callCount).to.equal(2);
    });
  
    it('executes a callback only when its associated new data is strictly unequal to the existing value', () => {
      let callCount = 0;
      trap.u = state.subscribe('one', () => callCount++);
      state.write('one', 1);
      state.write('one', 1);
      expect(callCount).to.equal(1);
    });
  
    it('calls a callback when one of its state values is deleted', () => {
      let stateValue;
      trap.u = state.subscribe(['one.two', 'two.three'], (value) => stateValue = value);
      state.write({'one.two': 2, 'two.three': 3});
      state.delete('one.two');
      expect(stateValue).to.eql({two: undefined, three: 3});
    });
  
    it(`invokes callbacks for ancestors when a descendant's value is changed`, () => {
      let callCount = 0;
      trap.u = state.subscribe('one', () => callCount++);
      trap.u = state.subscribe('one.two', () => callCount++);
      trap.u = state.subscribe('one.three', () => callCount++);
      state.write('one.two.three', '3');
      expect(callCount).to.equal(2);
    });
  
    it(`provides data at the ancestor level when a descendant's value is changed`, () => {
      let dataOne;
      let dataOneTwo;
      trap.u = state.subscribe('one', (data) => dataOne = data);
      trap.u = state.subscribe('one.two', (data) => dataOneTwo = data);
      state.write('one.two.three', '3');
      expect(dataOne).to.eql({two: {three: '3'}});
      expect(dataOneTwo).to.eql({three: '3'});
    });

    it(`executes callbacks for descendants when an ancestor's value is changed`, () => {
      let callCount = 0;
      trap.u = state.subscribe('one.two.three', () => callCount++);
      trap.u = state.subscribe('one.two.four.five', () => callCount++);
      trap.u = state.subscribe('one.two.four.five.seven', () => callCount++);
      state.write('one.two', {three: 3, four: {five: {seven: 'seven'}}});
      expect(callCount).to.equal(3);
    });
  
    it(`triggers callbacks for descendants even if an ancestor's value is a primitive`, () => {
      let callCount = 0;
      trap.u = state.subscribe('one.two.three', () => callCount++);
      trap.u = state.subscribe('one.two.four.five', () => callCount++);
      trap.u = state.subscribe('one.two.four.five.seven', () => callCount++);
      state.write('one.two', 5);
      expect(callCount).to.equal(3);
    });
  
    it('provides unsubscription method to deregister callbacks', () => {
      let callCount = 0;
      let unsubscribe = state.subscribe('one.two', () => callCount++);
      state.write('one.two', 2);
      state.write('one.two', 'two');
      expect(callCount).to.equal(2);
      unsubscribe();
      state.write('one.two', 2);
      state.write('one.two', 'two');
      expect(callCount).to.equal(2);
    });
  
    it('accepts namespaced array paths', () => {
      let callCount = 0;
      let namespacedPaths = [['profile.collection', ['name', {type: 'collectionType'}]], 'info'];
      trap.u = state.subscribe(namespacedPaths, (data) => {
        expect(data).to.eql({name: 'name', collectionType: undefined, info: 'i'});
        callCount++;
      });
  
      state.write({profile: {collection: {name: 'name', status: true}}, 'info': 'i'});
      expect(callCount).to.equal(1);
    });
  
    it('allows registering global callbacks that respond to all data changes', () => {
      let callCount = 0;
      let callback = () => callCount++;
      let writes = [1, 2, 3, 4, 5, 6];
      let finalState = writes.reduce((finalState, datum) => Object.assign(finalState, {[datum]: datum}), {});
      trap.u = state.subscribe(callback);
      writes.forEach((datum) => state.write(datum, datum));
      expect(state.read()).to.eql(finalState);
      expect(callCount).to.equal(writes.length);
    });
  
    it('provides addresses of the changed data to the callback', () => {
      let addresses = [];
      let callback = (data, changedAddresses) => addresses.push(...changedAddresses);
      trap.u = state.subscribe(callback);
      state.write({one: 1});
      state.write({two: 2});
      state.write({one: {three: {four: 4}}});
      expect(addresses).to.eql([['one'], ['two'], ['one', 'three', 'four']]);
    });
  });

  describe('configurations', () => {
    it('accepts a configuration object with an asObject data packaging option', () => {
      let stateValue;
      let callback = (value) => stateValue = value;
      trap.u = state.subscribe('one', callback, {asObject: true});
      state.write({one: 1});
      expect(stateValue).to.eql({one: 1});
    });

    it('allows callback to receive its data as an array when asArray is set to true', () => {
      let stateValue;
      let callback = (value) => stateValue = value;
      trap.u = state.subscribe(['one', 'two'], callback, {asArray: true});
      state.write({one: 1, two: 2});
      expect(stateValue).to.eql([1, 2]);
    });

    it('passes data to a callback without cloning it when cloneReadData is false', () => {
      let options = {cloneReadData: false};
      state.write('one.two', 2);
      trap.u = state.subscribe('one', (data) => {
        expect(data).to.equal(state.read('one', options));
      }, options);
    });
  });
});
