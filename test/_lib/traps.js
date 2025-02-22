import {addTrapDefinitions, createTrapObject} from 'var-trap';

addTrapDefinitions('unsubscribes', {
  storeFactory: () => new Set(),
  valueAdder(unsubscribe, unsubscribes) {
    unsubscribes.add(unsubscribe);
  },
  methods: {
    run(unsubscribes) {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    },
    clear(unsubscribes) {
      unsubscribes.clear();
    }
  }
});

export const trap = createTrapObject({u: 'unsubscribes'});
