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
	const enabling = new Set();
	const disabling = new Set();
	const activeSubs: ActiveSubs = {};

	return (action: Action) => {
		const a = next(action);
		const myEnabling = new Set();
		const myDisabling = new Set();
		const currentSubs = subs(getState());

		// Setting up markers
		Object.keys(activeSubs).forEach(id => {
			if (currentSubs[id]) {
				delete currentSubs[id];
			} else if (!disabling.has(id)) {
				myDisabling.add(id);
				disabling.add(id);
			}
		});

		Object.keys(currentSubs).forEach(id => {
			if (!enabling.has(id)) {
				myEnabling.add(id);
				enabling.add(id);
			}
		});

		// Processing markers
		myDisabling.forEach(id => {
			activeSubs[id]();
			delete activeSubs[id];
			myDisabling.delete(id);
			disabling.delete(id);
		});

		myEnabling.forEach(id => {
			activeSubs[id] = currentSubs[id](dispatch);
			myEnabling.delete(id);
			enabling.delete(id);
		});

		return a;
	};
};
