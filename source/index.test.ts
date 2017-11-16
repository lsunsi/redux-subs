import test from 'ava';
import {createStore, compose, applyMiddleware} from 'redux';
import install from '.';

test(t => {
	const actions = [
		{type: 'init'},
		{type: 'sub0'},
		{type: 'sub1'},
		{type: 'sub2'},
		{type: 'sub3'}
	];

	const expectations = [
		'init',
		'sub1-enabled', 'sub2-enabled',
		'sub0',
		'sub1-disabled', 'sub2-disabled',
		'sub1',
		'sub1-enabled',
		'sub2',
		'sub1-disabled', 'sub2-enabled',
		'sub3',
		'sub1-enabled'
	];

	const reducer = (state: string, {type}: any) => type.length === 4 ? type : state;

	const sub1 = (dispatch: any) => {
		dispatch({type: 'sub1-enabled'});

		return () => dispatch({type: 'sub1-disabled'});
	};

	const sub2 = (dispatch: any) => {
		dispatch({type: 'sub2-enabled'});

		return () => dispatch({type: 'sub2-disabled'});
	};

	const subs = (state: any) =>
		state === 'sub0' ? {} :
		state === 'sub1' ? {sub1} :
		state === 'sub2' ? {sub2} :
		{sub1, sub2};

	const spy = (_: any) => (next: any) => (action: any) => {
		t.is(action.type, expectations.shift());

		return next(action);
	};

	const store = createStore(reducer, compose(
		applyMiddleware(install(subs)),
		applyMiddleware(spy)
	));

	t.plan(expectations.length);
	actions.forEach(store.dispatch);
});
