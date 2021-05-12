import test, {ExecutionContext} from 'ava';
import {createStore, applyMiddleware, Dispatch, Action, Reducer, Middleware, AnyAction} from 'redux';
import {createAsyncThunk, configureStore, createSlice, ThunkDispatch} from '@reduxjs/toolkit';
import install from '.';

const validStates = <const>['init', 'sub0', 'sub1', 'sub2', 'sub3'];
type States = (typeof validStates)[number];

type State = States | undefined;

type ActionType =
	States
	| 'sub1-enabled'
	| 'sub2-enabled'
	| 'sub1-disabled'
	| 'sub2-disabled'
	| 'sub1-enabled'
	| 'sub1-disabled'
	| 'sub2-enabled'
	| 'sub1-enabled';

interface TestAction extends Action<ActionType> {}

type TestDispatch = Dispatch<TestAction>;
type DispatchExt = Record<string, unknown>;

function isStateAction(type: ActionType): type is States {
	return validStates.includes(type as States);
}

function createSpyMiddleware<S>(t: ExecutionContext, expectations: string[]) {
	const receivedActions: string[] = [];
	const spy: Middleware<DispatchExt, S> = _ => next => action => {
		const {type} = action as Action<string>;
		receivedActions.push(type);
		return next(action);
	};

	const assert = () => {
		t.deepEqual(receivedActions, expectations);
	};

	return {spy, assert};
}

test('middleware', t => {
	const actions: TestAction[] = [
		{type: 'init'},
		{type: 'sub0'},
		{type: 'sub1'},
		{type: 'sub2'},
		{type: 'sub3'}
	];

	const expectations: ActionType[] = [
		'init',
		'sub1-enabled',
		'sub2-enabled',
		'sub0',
		'sub1-disabled',
		'sub2-disabled',
		'sub1',
		'sub1-enabled',
		'sub2',
		'sub1-disabled',
		'sub2-enabled',
		'sub3',
		'sub1-enabled'
	];

	const reducer: Reducer<State, TestAction> = (state, {type}) => isStateAction(type) ? type : state;

	const sub1 = (dispatch: TestDispatch) => {
		dispatch({type: 'sub1-enabled'});

		return () => dispatch({type: 'sub1-disabled'});
	};

	const sub2 = (dispatch: TestDispatch) => {
		dispatch({type: 'sub2-enabled'});

		return () => dispatch({type: 'sub2-disabled'});
	};

	const subs = (state: State) => {
		switch (state) {
			case 'sub0':
				return {};
			case 'sub1':
				return {sub1};
			case 'sub2':
				return {sub2};
			default:
				return {sub1, sub2};
		}
	};

	const {spy, assert} = createSpyMiddleware(t, expectations);

	const store = createStore(reducer,
		applyMiddleware(spy, install(subs))
	);
	for (const action of actions) {
		store.dispatch(action);
	}

	assert();
});

test.cb('createAsyncThunk helper', t => {
	let promise: Promise<any> = Promise.resolve();
	const thunk = createAsyncThunk('testThunk', () => {
		// Placeholder
	});

	const validStates = ['init', 'pending', 'rejected'];
	type States = (typeof validStates)[number];

	const {reducer} = createSlice({
		name: 'states',
		initialState: 'init' as States,
		reducers: {},
		extraReducers: builder => builder
			.addCase(thunk.pending, () => 'pending')
			.addCase(thunk.rejected, () => 'rejected')
	});

	const sub1 = (dispatch: ThunkDispatch<States, unknown, AnyAction>) => {
		const api = dispatch(thunk());
		promise = api;
		return () => {
			api.abort();
		};
	};

	const subs = (state: States) => {
		const nextSubs = (state === 'init') ? {sub1} : {};
		return nextSubs;
	};

	const initAction = {type: 'any'};

	const {spy, assert} = createSpyMiddleware(t, [initAction.type, thunk.pending.type, thunk.rejected.type]);

	const store = configureStore({
		reducer,
		middleware: getDefaultMiddleware => getDefaultMiddleware().concat(install(subs), spy)
	});

	store.dispatch(initAction);

	const end = () => {
		assert();
		t.end();
	};

	promise.then(end, () => {
		t.fail();
	});
});
