# redux-subs
This package implements the declarative [Subscriptions pattern](https://www.elm-tutorial.org/en/03-subs-cmds/01-subs.html) seen in the [Elm architecture](https://guide.elm-lang.org/architecture/) to be used in Redux.

> npm install redux-subs

## What is a subscription?

```javascript
const sub = dispatch => {
  // setup and start
  const socket = new Socket()

  // dispatch at will
  socket.on('message', data =>
    dispatch({type: 'MESSAGE', payload: data})
  )

  // return a way to stop
  return () => socket.close()
}
```

## How to declare them?
```javascript
// declarative subscriptions
const subs = state =>
  state === 'listening' ?
    {socket: sub} :
    {}
```

## How do I start?
```javascript
import install from 'redux-subs'
import {createStore, applyMiddleware} from 'redux'

const store = createStore(reducer, install(subs))
```

## (:
