import test from 'ava';
import {createStore, applyMiddleware, Dispatch, Action, Reducer, Middleware} from 'redux';
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

test('middleware', t => {
	const receivedActions: ActionType[] = [];

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

	const spy: Middleware<DispatchExt, State, TestDispatch> = _ => next => action => {
		const {type} = action as TestAction;
		receivedActions.push(type);
		return next(action);
	};

	const store = createStore(reducer,
		applyMiddleware(spy, install(subs))
	);
	for (const action of actions) {
		store.dispatch(action);
	}

	t.deepEqual(receivedActions, expectations);
});
