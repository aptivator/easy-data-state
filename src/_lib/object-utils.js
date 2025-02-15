import {isObject} from './utils';
import {root}     from './vars';

export function deleteValue(o, address) {
  let parentAddress = address.slice(0, -1);
  let parentValue = getValue(o, parentAddress);

  if(isObject(parentValue)) {
    let deleteAddress = address.at(-1);

    if(Object.hasOwn(parentValue, deleteAddress)) {
      let value = parentValue[deleteAddress];
      delete parentValue[deleteAddress];

      if(value !== undefined) {
        return true;
      }
    }
  }
}

export function getData(o, addresses, configs) {
  let {asArray, asObject} = configs;

  if(addresses.length === 1) {
    if((addresses[0] === root || !(asArray || asObject))) {
      return getValue(o, addresses[0]);
    }
  }

  if(asArray) {
    return addresses.reduce((data, address) => {
      return data.concat(getValue(o, address));
    }, []);
  }

  return addresses.reduce((data, address) => {
    let value = getValue(o, address);
    data[address.storeAs] = value;
    return data;
  }, {});
}

export function getValue(o, address, existence = false) {
  for(let part of address) {
    if(!Object.hasOwn(o, part)) {
      return;
    }

    o = o[part];
  }

  return existence ? true : o;  
}

export function hasValue(o, address) {
  return getValue(o, address, true)
}

export function setValue(o, address, value) {
  for(var i = 0, lastIndex = address.length - 1; i < lastIndex; i++) {
    let part = address[i];

    if(!isObject(o[part])) {
      o[part] = {};
    }

    o = o[part];
  }

  return (o[address[i]] = value);
}

export function setValueIfNotSet(o, address, factory) {
  for(var i = 0, lastIndex = address.length - 1; i < lastIndex; i++) {
    o = (o[address[i]] ??= {});
  }

  return (o[address[i]] ??= factory());
}
