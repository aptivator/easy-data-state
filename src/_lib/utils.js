import {root} from './vars';

function assembleNamespaceAddresses(parentAddress, children, addresses = []) {
  for(let child of children) {
    if(Array.isArray(child)) {
      let [namespace, children] = child;

      if(Array.isArray(children)) {
        let namespaceAddress = normalizeAddress(namespace);
        namespaceAddress = parentAddress.concat(namespaceAddress);
        assembleNamespaceAddresses(namespaceAddress, children, addresses);
      } else {
        addresses.push(parentAddress.concat(child));
      }
    } else {
      child = normalizeAddress(child);
      addresses.push(parentAddress.concat(child));
    }
  }

  return addresses;
}

export function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeAddress(address) {
  if(typeof address === 'string') {
    address = address.split('.');
  } else if(isObject(address)) {
    let [[addressPart, alias]] = Object.entries(address);
    let addressParts = addressPart.split('.');
    let lastIndex = addressParts.length - 1;
    let lastPart = addressParts[lastIndex];
    addressParts[lastIndex] = {[lastPart]: alias};
    address = addressParts;
  }

  return address;
}

export function normalizeAddresses(addresses) {
  let normalizedAddresses = [];
  addresses = [].concat(addresses);

  for(let i = 0, {length} = addresses; i < length; i++) {
    let normalizedAddress = normalizeAddress(addresses[i]);
    let [namespace, children] = normalizedAddress;

    if(Array.isArray(children)) {
      let namespaceAddress = normalizeAddress(namespace);
      let namespaceAddresses = assembleNamespaceAddresses(namespaceAddress, children);
      normalizedAddresses.push(...namespaceAddresses);
      continue;
    }
    
    normalizedAddresses.push(normalizedAddress);
  }

  return normalizedAddresses.map((normalizedAddress) => {
    let rootedNormalizedAddress = [root].concat(normalizedAddress);
    let lastIndex = rootedNormalizedAddress.length - 1;
    let lastPart = rootedNormalizedAddress[lastIndex];

    if(isObject(lastPart)) {
      let [[address, alias]] = Object.entries(lastPart);
      rootedNormalizedAddress[lastIndex] = address;
      lastPart = alias;
    }

    rootedNormalizedAddress.storeAs = lastPart;
    return rootedNormalizedAddress;
  });
}

export function SetFactory() {
  return new Set();
}
