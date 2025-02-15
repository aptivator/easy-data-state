import {expect}        from 'chai';
import {EasyDataState} from '../../src/easy-data-state';

describe('EasyDataState delete()', () => {
  let state;
  beforeEach(() => state = new EasyDataState());

  describe('operations', () => {
    it('deletes a root-level entry', () => {
      state.write({one: 1, two: 2});
      state.delete('one');
      expect(state.read()).to.eql({two: 2});
    });
  
    it('removes a nested entry', () => {
      state.write('one.two.three.four', 4);
      state.delete('one.two.three.four');
      expect(state.read()).to.eql({one: {two: {three: {}}}})
    });
  
    it('does nothing if a delete address does not point to an existing value', () => {
      state.write('one.two', 2);
      state.delete('one.two.three');
      expect(state.read()).to.eql({one: {two: 2}});
    });
  
    it('trims multiple entries', () => {
      state.write({one: 1, two: {three: 3}});
      state.delete(['one', 'two.three']);
      expect(state.read()).to.eql({two: {}});
    });
  
    it('performs nothing when no parameters are passed', () => {
      state.write('one.two', 2);
      state.delete();
      expect(state.read()).to.eql({one: {two: 2}});
    });
  });

  describe('configurations', () => {
    it('does not (at this time) take configurations', () => {});
  });
});
