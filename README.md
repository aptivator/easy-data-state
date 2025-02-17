# `easy-data-state`

## Table of Contents

* [Introduction](#introduction)
* [Usage](#usage)
  * [Installation](#installation)
  * [Distributed Versions](#distributed-versions)
  * [Creating a Data State](#creating-a-data-state)
    * [Instantiating a Data State Object](#instantiating-a-data-state-object)
    * [Instantiating a Configured Data State Object](#instantiating-a-configured-data-state-object)
      * [asArray Setting](#asarray-setting)
      * [asObject Setting](#asobject-setting)
      * [cloneReadData Setting](#clonereaddata-setting)
      * [cloneWriteData Setting](#clonewritedata-setting)
      * [triggerImmediately Setting](#triggerimmediately-setting)
      * [Default Settings](#default-settings)
  * [Working with Data State](#working-with-data-state)
    * [Writing Data](#writing-data)
    * [Writing Custom Data](#writing-custom-data)
    * [Reading Data](#reading-data)
    * [Deleting Data](#deleting-data)
    * [Subscribing to Data Changes](#subscribing-to-data-changes)
    * [Using Namespaced Array Addresses](#using-namespaced-array-addresses)
  * [Integrations with UI Frameworks](#integrations-with-ui-frameworks)
    * [React](#react)
    * [Other Frameworks](#other-frameworks)
* [Development](#development)
  * [Development Setup](#development-setup)
  * [Contributing Changes](#contributing-changes)
* [Performance](#performance)
* [Caveats](#caveats)

<a name="introduction"></a>
## Introduction

`easy-data-state` is a data state management solution.  The library utilizes a
publish/subscribe model to respond to data state alterations by triggering
respective callback(s) assigned to receive the changing data.  `easy-data-state`
is framework-agnostic and may be used with React, Angular, and other
implementations to translate data modifications to user interface (UI) updates.
The library may also be used just as a store and includes a mechanism to read
nested data.  `easy-data-state` stands at under 400 lines of code and provides a
simpler alternative to some of the mainstream solutions.

<a name="usage"></a>
## Usage 

<a name="installation"></a>
### Installation 

To fetch the library, run the following command.

```
npm install --save @easy-data-state/core
```

<a name="distributed-versions"></a>
### Distributed Versions

`easy-data-state`'s default import (from `@easy-data-state\core`) is either an
EcmaScript (ES) or a CommonJS (as an UMD) module that bundles the source code without
transpilation.  For example, the library makes use of private class methods,
latest native methods (e.g., `Array`'s `at`, `Object.hasOwn`), and data structures
such as `Set` and `Map`.   The defaults are provided as such with the expectations
that the library will be augmented as a dependency to a host project that, in
turn, will be transpiled for some target environment or used, as is, in a browser
or server-side environment (e.g., Node 20+) that supports the utilized language
features.

For those rare circumstances when `easy-data-state` has to be utilized in older backend
environments or included in a larger bundle without transpilation (for older browsers),
the EcmaScript 5 distributable is available from `@easy-data-state\core\es5`.

<a name="creating-a-data-state"></a>
### Creating a Data State 

<a name="instantiating-a-data-state-object"></a>
#### Instantiating a Data State Object 

Import `EasyDataState` constructor and create as many data state objects as needed for
an application.  One object is sufficient for most cases.

*data-state.js*
```javascript
import {EasyDataState} from '@easy-data-state/core';

export const state = new EasyDataState();
```

*some-application-file.js*
```javascript
import {state} from './data-state.js';

//use data state
state.write('loggedIn', false);
```

<a name="instantiating-a-configured-data-state-object"></a>
#### Instantiating a Configured Data State Object 

`EasyDataState` can be instantiated with the following global options: `asArray`,
`asObject`, `cloneReadData`, `cloneWriteData` and `triggerImmediately`.  Configurations
passed to the constructor apply to all `read()`, `subscribe()`, and `write()` calls unless
overridden at a method's invocation.

<a name="asarray-setting"></a>
##### asArray Setting 

The flag instructs a value or collection of values to be returned as an array.

```javascript
import {EasyDataState} from '@easy-data-state/core';

let state = new EasyDataState({asArray: true});
state.write({loggedIn: true, authorized: false});
state.read(['loggedIn', 'authorized']); // [true, false]
```

<a name="asobject-setting"></a>
##### asObject Setting 

This configuration directs the library to return a value or collection of values
as an object.

```javascript
let state = new EasyDataState({asObject: true});
state.write({loggedIn: true, authorized: false});
state.read('loggedIn'); // {loggedIn: true}
```

<a name="clonereaddata-setting"></a>
##### cloneReadData setting 

The setting is `true` by default and specifies whether a retrieved state data is to
be deeply cloned before returning.

```javascript
let state = new EasyDataState({cloneReadData: false});
state.write({auth: {loggedIn: true, authorized: false}});
state.read('auth') === state.read('auth') // true
```

<a name="clonewritedata-setting"></a>
##### cloneWriteData setting 

The configuration is `true` by default and specifies whether a written data is to be
deeply cloned before being merged with the data state.  The setting may be used in
conjunction with `cloneReadData` to allow distribution of an original piece of data.

```javascript
let map = new Map();
let state = new EasyDataState({cloneReadData: false, cloneWriteData: false});
state.write('map', map);
state.read('map') === map; // true
```

NOTE: It is probably better to create an `EasyDataState` instance with cloning
defaults and override them (where appropriate) at `read()` and `write()` invocations.

```javascript
let map = new Map();
let state = new EasyDataState();
state.write({map}, {cloneWriteData: false});
state.read('map', {cloneReadData: false}) === map; // true
```

<a name="triggerimmediately-setting"></a>
#### triggerImmediately Setting

This option is `true` by default and specifies whether a data listening callback
is to be invoked right after the registration if one of the data it is assigned
to already exists.

```javascript
let state = new EasyDataState();
state.write({auth: {loggedIn: true}});
let unsubscribe = state.subscribe('auth', (data) => {
  console.log(data); // will not trigger until next write() that affects 'auth'
}, {triggerImmediately: false});

unsubscribe();
```

<a name="default-settings"></a>
#### Default Settings 

`asArray` and `asObject` options are not set (i.e., `undefined`) internally.  By
default, `easy-data-state` will return data as an object for multiple retrieved
pieces.  Whenever only one piece of data state is fetched, it will be returned as is.

```javascript
let state = new EasyDataState();
state.write({loggedIn: true, authorized: false});
state.read(['loggedIn', 'authorized']); // {loggedIn: true, authorized: false}
state.read('loggedIn'); // true
```

<a name="working-with-data-state"></a>
### Working with Data State 

<a name="writing-data"></a>
#### Writing Data

`write()` writes new or overwrites existing data.  The method accepts an address-value pair, 
an object of addresses-values, an address-callback pair, or an object of address-value and
address-callback pairs.  For the callback arrangements, a function will receive a data subset
addressed by its address and will return the revised subset that is then stored under the address.

A data address can be single- or multi-level.  Multi-level addresses include a dot (e.g., `auth.name`)
or can be expressed as an array (e.g., `['auth', 'name]`) and `easy-data-state` will store an
address's value at the appropriate nesting level.  For example, calling `state.write('auth.loggedIn', true)`
will place `loggedIn` under `auth` object.

The method also accepts a configuration object that will override `cloneWriteData` parameter
set at instantiation.

```javascript
let state = new EasyDataState();
state.write('auth.profile.loggedIn', true);
state.read(); // {auth: {profile: {loggedIn: true}}}
```

```javascript
let state = new EasyDataState();
state.write({auth: {profile: {loggedIn: true}, 'permissions.name': null}});
state.read(); // {auth: {profile: {loggedIn: true}, permissions: {name: null}}}
```

```javascript
let state = new EasyDataState();
state.write('visitsCount', (count = 0) => ++count);
state.read(); // {visitsCount: 1}
```

<a name="writing-custom-data"></a>
#### Writing Custom Data

Some rare situations may call on storing/distributing functions or custom objects
as is.  This can be accomplished by turning off write and read cloning and marking
an object as an `easy-data-state` value.

```javascript
import {EasyDataState, easyDataStateValueKey} from '@easy-data-state/core';

let state = new EasyDataState();
let someFunction = () => {};
someFunction[easyDataStateValueKey] = true;
let unsubscribe = state.subscribe('func', (func) => {
  //use func() in some way;
}, {cloneReadData: false});

state.write('func', someFunction, {cloneWriteData: false});
unsubscribe();
```

<a name="reading-data"></a>
#### Reading Data

`read()` reads one or more properties from a data state.  To fetch multiple data, an
array of addresses must be provided.  The method also accepts a configuration object that
will override `asArray`, `asObject`, and `cloneReadData` parameters set at instantiation.
When specifying multi-level data to be returned as an object, `easy-data-state` will use
the last part of the multi-level address as the reference under which the fetched  datum will
be stored.  If the last part of multiple multi-level addresses is the same, then a unique
alias should be provided under which the data will be stored.

```javascript
let state = new EasyDataState();
state.write('auth.loggedIn', true);
state.read('auth.loggedIn'); // true
state.read('auth.loggedIn', {asArray: true}); // [true]
state.read('auth.loggedIn', {asObject: true}); // {loggedIn: true}
```

```javascript
let state = new EasyDataState();
state.write({profile: {name: 'admin', permissions: []}});
state.read(['profile.name', 'profile.permissions']); // {name: 'admin', permissions: []}
```

```javascript
let state = new EasyDataState();
state.write({profile: {name: 'admin'}, user: {name: 'name'}});
state.read(['profile.name', 'user.name']); // {name: 'name'}
state.read(['profile.name', {'user.name': 'userName'}]) // {name: 'admin', userName: 'name'}
```

<a name="deleting-data"></a>
#### Deleting Data 

`delete()` removes one or more properties from a data state.  If a property marked for
deletion does not exist, the library will "fail" silently.

```javascript
let state = new EasyDataState();
state.write({profile: {name: 'admin', permissions: []}});
state.delete('profile.permissions');
state.read(); // {profile: {name: 'admin'}}
```

```javascript
let state = new EasyDataState();
state.write({profile: {name: 'admin', permissions: []}});
state.delete(['profile.permissions', 'profile.name']);
state.read(); // {profile: {}}
```

```javascript
let state = new EasyDataState();
state.write({profile: {name: 'admin'}});
state.delete('profile.permissions');
state.read(); // {profile: {name: 'admin'}}
```

<a name="subscribing-to-data-changes"></a>
#### Subscribing to Data Changes 

The main feature of the library is registration of callbacks to respond to data state
changes.  `subscribe()` pairs a callback to one or more data state entries.  Whenever a
subscribed-to property's value changes, all callbacks bound to it will be invoked.  If a
subscription is added for a property for which a value already exists, the callback will
be triggered immediately after the registration.  `easy-data-state` uses `read()` internally
to fetch data that will be passed to a callback.  Callbacks also receive, as a second
parameter, an array of addresses of the just-altered data.

`subscribe()` can be called with options that direct how the data is to be processed and
packaged.  Registered callbacks are triggered by `write()` and `delete()` calls.  `easy-data-state`
uses strict equality (`===`) to check if the new value is different from the existing.
Callbacks are run when strict non-equality is satisfied.  `delete()` operations that change
the data state always trigger the respective callbacks.  If, during registration, one of the
subscribing-to data already exists, then a callback will be immediately fired.  Set
`triggerImmediately` configuration to `false` to prevent such invocation.  `subscribe()`
returns an unsubscription function.

`easy-data-state` supports global subscriptions.  Callbacks registered without an explicit
data address(es) will respond to all data state changes.  Such listening may be useful for
logging purposes.

```javascript
let state = new EasyDataState();
let unsubscribe = state.subscribe(['items', 'auth.loggedIn'], (data) => {
  console.log(data); // {items: undefined, loggedIn: true} after write() call
});

state.write('auth.loggedIn', true); //triggers callback
unsubscribe();
```

```javascript
let state = new EasyDataState();
state.write('auth.loggedIn', false);
let unsubscribe = state.subscribe('auth.loggedIn', (loggedIn) => {
  console.log(loggedIn); // [false] and triggered immediately
}, {asArray: true});

unsubscribe();
```

```javascript
let state = new EasyDataState();
state.write('profile.name', 'admin');
let unsubscribe = state.subscribe('profile.name', (profileName) => {
  console.log(profileName); // 'admin' and triggered immediately
                            // undefined after delete() call
});

state.delete('profile.name'); //triggers callback the second time
unsubscribe();
```

```javascript
let state = new EasyDataState();
state.write({auth: {loggedIn: true}, name: {first: 'first', last: 'last'}});
let unsubscribe = state.subscribe((data, changedDataAddresses) => {
  console.log(changedDataAddresses); // [['auth', 'loggedIn']]
}, {triggerImmediately: false});

state.write('auth.loggedIn', false);
unsubscribe();
```

<a name="using-namespaced-array-addresses"></a>
#### Using Namespaced Array Addresses 

Reading, deleting, or subscribing to multi-level data requires full-address usage,
e.g., `state.read(['profile.name', 'profile.permissions'])`.  As in the above
example, sometimes requested entries will have the same ancestor(s).  To minimize
addressing redundancies, `easy-data-state` accepts namespaced array addresses.
For the situations when the last part of several addresses is the same, the
namespaced address should include aliases.

```javascript
let namespacedAddresses = [['profile.collection', ['name', 'type']], 'info'];
state.write({profile: {collection: {name: 'name', status: true, type: 'type'}}, 'info': 'i'});
state.read(namespacedAddresses); // {name: 'name', type: 'type', info: 'i'}
```

```javascript
let namespacedAddresses = [['profile', ['name', 'type']], ['auth', [{type: 'authType'}]]];
state.write({profile: {name: 'name', status: true, type: 'type'}}, {auth: {type: 'closed'}});
state.read(namespacedAddresses); // {name: 'name', type: 'type', authType: 'closed'}
```

<a name="integration-with-ui-frameworks"></a>
### Integrations with UI Frameworks 

<a name="react"></a>
#### React 

[easy-data-state-react](https://github.com/aptivator/easy-data-state-react.git)
repository includes bindings to connect an `easy-data-state` instance to React
components.  Usage instructions are provided there.

<a name = "other-frameworks"></a>
#### Other Frameworks

`easy-data-state` was originally developed as a simpler alternative to Redux,
Recoil, and other data management React-oriented libraries.  `easy-data-state`
can be used with other frameworks; contributions of such integrations are welcome.

<a name="development"></a>
## Development 

<a name="development-setup"></a>
### Development Setup 

Perform the following steps to setup the repository locally.

```
git clone https://github.com/aptivator/easy-data-state.git
cd easy-data-state
npm install
```

To start development mode run `npm run dev` or `npm run dev:coverage`.

<a name="contributing-changes"></a>
### Contributing Changes

The general recommendations for contributions are to use the latest JavaScript
features, have tests with complete code coverage, and include documentation.
The latter may be necessary only if a new feature is added or an existing documented
feature is modified.

<a name="performance"></a>
## Performance

Initial performance tests showed `easy-data-state` executing a 50-level address write
and a respective subscription invocation in about a 100th of a millisecond.  More
extensive performance tests will be added in the future.

<a name="caveats"></a>
## Caveats

Data state properties/addresses are meant to address plain JavaScript objects and will not
work for other structures such as Arrays, Maps, and Sets.  The latter can be stored as values.

Callbacks invoked by multiple `delete()` or `write()` calls are executed on the same
thread/tick.  When run in a context of some framework such as React, this may lead to
concurrent updates to multiple UI components and may result in an error.  Pushing one or
some of the `delete()` or `write()` operations towards the end of the microtasking queue
usually solves the problem.  `queueMicrotask()` is an optimal method for such deferrals.

Data stored via `write()` are cloned first.  `structuredClone()` is employed to duplicate
the values.  The function is supported only in modern browsers and latest Node versions.
`structuredClone()` will not copy some objects such as functions.
