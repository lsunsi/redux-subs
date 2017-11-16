export type Dispatch<Action> = (a: Action) => void;
export type Next<Action> = (a: Action) => Action;
export type GetState<State> = () => State;

export interface Store<Action, State> {
	dispatch: Dispatch<Action>;
	getState: GetState<State>;
}

export type Disable = () => void;
export type Enable<Action> = (d: Dispatch<Action>) => Disable;
export type GetSubs<Action, State> = (s: State) => CurrentSubs<Action>;

export interface ActiveSubs {
	[id: string]: Disable;
}
export interface CurrentSubs<Action> {
	[id: string]: Enable<Action>;
}

export default
	<State, Action>
	(subs: GetSubs<Action, State>) =>
	({dispatch, getState}: Store<Action, State>) =>
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
