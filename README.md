# redux-subs
elm subscriptions in redux

## Interface

```javascript
/* How to use */

import createSubs from 'redux-subs'

import {createStore, applyMiddleware} from 'redux'
import subscriptions from './subscriptions'
import reducer from './reducer'

const subs = createSubs(subscriptions)
const store = createStore(reducer, applyMiddleware(subs))

/* Definitions */

type Sub<A, B> = {
  [string, (A => ()) => (() => ())]
  identifier: string,
  enable: (A => ()) => B,
  disable: B => ()
}

/**/
```
