type Constant<A> = () => A;
type Mapper<A, B> = (a: A) => B;
type Consumer<A> = (a: A) => void;

type Enable<A> = Consumer<A>;
type Disable = Constant<void>;
type Sub<A> = Mapper<Enable<A>, Disable>;
type Subs<A, B> = Mapper<A, CurrentSubs<B>>;

interface ActiveSubs {
	[id: string]: Disable;
}
interface CurrentSubs<A> {
	[id: string]: Sub<A>;
}

type Next<Action> = Mapper<Action, Action>;
interface Store<State, Action> {
	dispatch: Consumer<Action>;
	getState: Constant<State>;
}

export default
	<State, Action>
	(subs: Subs<State, Action>) =>
	({dispatch, getState}: Store<State, Action>) =>
	(next: Next<Action>) => {
	const activeSubs: ActiveSubs = {};

	const subscribing = () => {
		throw new Error('subscribing');
	};

	return (action: Action) => {
		const a = next(action);

		const currentSubs = subs(getState());

		Object.keys(activeSubs).forEach(id => {
			if (currentSubs[id]) {
				delete currentSubs[id];
			} else {
				activeSubs[id]();
				delete activeSubs[id];
			}
		});

		Object.keys(currentSubs).forEach(id => {
			activeSubs[id] = subscribing;
		});

		Object.keys(currentSubs).forEach(id => {
			activeSubs[id] = currentSubs[id](dispatch);
		});

		return a;
	};
};
