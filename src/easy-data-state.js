import {deleteValue, getData, getValue}           from './_lib/object-utils';
import {hasValue, setValue, setValueIfNotSet}     from './_lib/object-utils';
import {isObject, normalizeAddresses, SetFactory} from './_lib/utils';
import {baseConfigs, easyDataStateValueKey, root} from './_lib/vars';
export {easyDataStateValueKey}                    from './_lib/vars';

export class EasyDataState {
  #addressesToListeners = {};
  #globalConfigs;
  #state = {};

  constructor(globalConfigs = {}) {
    this.#globalConfigs = Object.assign({}, baseConfigs, globalConfigs);
  }

  delete(addresses) {
    if(addresses) {
      let listenerAddresses = [];
      let normalizedAddresses = normalizeAddresses(addresses);
  
      for(let i = 0, {length} = normalizedAddresses; i < length; i++) {
        let normalizedAddress = normalizedAddresses[i];

        if(deleteValue(this.#state, normalizedAddress)) {
          listenerAddresses.push(normalizedAddress);
        }
      }
  
      if(listenerAddresses.length) {
        this.#triggerListeners(listenerAddresses);
      }
    }
  }

  #getAddressListeners(listenersAddress, address, addressesToListeners, allListeners) {
    let listenersParent = listenersAddress.shift();
    let {children, listeners} = addressesToListeners[listenersParent] || {};

    if(listeners) {
      listeners.forEach((listenerInfo) => {
        let changedAddresses = allListeners.get(listenerInfo);

        if(!changedAddresses) {
          allListeners.set(listenerInfo, changedAddresses = []);
        }

        changedAddresses.push(address.slice());
      });
    }

    if(children) {
      if(listenersAddress.length) {
        return this.#getAddressListeners(listenersAddress, address, children, allListeners);
      }

      for(let child in children) {
        this.#getAddressListeners([child], address, children, allListeners);
      }
    }
  }

  #getAddressesAndValues(writes, addressesAndValues = [], parentAddress = [root]) {
    writes = Object.entries(writes);

    for(let i = 0, {length} = writes; i < length; i++) {
      let [address, value] = writes[i];
      address = parentAddress.concat(address.split('.'));
      
      if(isObject(value) && !value[easyDataStateValueKey]) {
        this.#getAddressesAndValues(value, addressesAndValues, address);
      } else {
        addressesAndValues.push([address, value]);
      }
    }
  
    return addressesAndValues;      
  }

  #makeListenersAddress(address) {
    return address.join('.children.').split('.').concat('listeners');
  }

  #performStateWrites(writes, configs) {
    let addressesAndValues = this.#getAddressesAndValues(writes);
    let listenerAddresses = [];

    for(let i = 0, {length} = addressesAndValues; i < length; i++) {
      let [address, value] = addressesAndValues[i];

      if(getValue(this.#state, address) !== value) {
        listenerAddresses.push(address);

        if(configs.cloneWriteData) {
          value = structuredClone(value);
        }

        setValue(this.#state, address, value);
      }
    }

    this.#triggerListeners(listenerAddresses);
  }

  #read(addresses, configs) {
    let reconciledConfigs = this.#reconcileConfigs(configs);
    let data = getData(this.#state, addresses, reconciledConfigs);
    return reconciledConfigs.cloneReadData ? structuredClone(data) : data;
  }

  read(addresses, configs) {
    let data = this.#state;
    let configsOnly = isObject(addresses);

    if(configsOnly || !addresses) {
      if(configsOnly) {
        configs = addresses;
      }
      
      addresses = [[]];
    }

    configs = this.#reconcileConfigs(configs);
    addresses = normalizeAddresses(addresses);
    data = getData(data, addresses, configs);

    if(configs.cloneReadData) {
      data = structuredClone(data);
    }

    return data;
  }

  #reconcileConfigs(configs) {
    return Object.assign({}, this.#globalConfigs, configs);
  }

  #reconcileSubscribeParams([addresses, listener, configs]) {
    if(typeof addresses === 'function') {
      configs = listener;
      listener = addresses;
      addresses = [[]];
    }

    return [addresses, listener, configs];
  }

  subscribe(...params) {
    let [addresses, listener, configs = {}] = this.#reconcileSubscribeParams(params);
    let normalizedAddresses = normalizeAddresses(addresses);
    let reconciledConfigs = this.#reconcileConfigs(configs);
    let listenerInfo = {addresses: normalizedAddresses, listener, configs: reconciledConfigs};
    let listenersInfoSets = [];
    let changedDataAddresses = [];

    for(let i = 0, {length} = normalizedAddresses; i < length; i++) {
      let address = normalizedAddresses[i];
      let listenersAddress = this.#makeListenersAddress(address);
      let listenersInfo = setValueIfNotSet(this.#addressesToListeners, listenersAddress, SetFactory);
      listenersInfo.add(listenerInfo);
      listenersInfoSets.push(listenersInfo);

      if(reconciledConfigs.triggerImmediately && hasValue(this.#state, address)) {
        changedDataAddresses.push(address.slice(1));
      }
    }

    if(changedDataAddresses.length) {
      let data = this.#read(normalizedAddresses, reconciledConfigs);
      listener(data, changedDataAddresses);
    }

    return () => {
      for(let i = 0, {length} = listenersInfoSets; i < length; i++) {
        listenersInfoSets[i].delete(listenerInfo);
      }

      listenersInfoSets = null;
    };
  }

  #triggerListeners(addresses) {
    let allListeners = new Map();

    for(let i = 0, {length} = addresses; i < length; i++) {
      let address = addresses[i];
      let dataAddress = address.slice(1);
      this.#getAddressListeners(address, dataAddress, this.#addressesToListeners, allListeners);
    }

    allListeners.forEach((changedDataAddresses, {listener, addresses, configs}) => {
      let data = this.#read(addresses, configs);
      listener(data, changedDataAddresses);
    });
  }

  write(address, value, configs) {
    if(!isObject(address)) {
      if(Array.isArray(address)) {
        address = address.join('.');
      }

      address = {[address]: value};
      value = configs;
    }
    
    configs = this.#reconcileConfigs(value);
      
    address = Object.entries(address).reduce((writes, [address, value]) => {
      if(typeof value === 'function' && !value[easyDataStateValueKey]) {
        let read = this.read(address, configs);
        value = value(read);
      }

      return Object.assign(writes, {[address]: value});
    }, {});

    this.#performStateWrites(address, configs);
  }
}
