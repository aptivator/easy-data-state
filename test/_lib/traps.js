import {addTrapDefinitions, createTrapObject} from 'var-trap';

addTrapDefinitions('unsubscribes', {
  storeFactory: () => new Set(),
  valueAdder(unsubscribe, unsubscribes) {
    unsubscribes.add(unsubscribe);
  },
  methods: {
    clear(unsubscribes) {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes.clear();
    }
  }
});

export const trap = createTrapObject({u: 'unsubscribes'});
