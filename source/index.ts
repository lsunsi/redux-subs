type Consumer<A> = (a: A) => void;
type Disable = () => void;
type Enable<A, B> = (c: Consumer<A>) => B;
type Sub<A> = Enable<A, Disable>;
type Subs<A, B> = (a: A) => Sub<B>[];

const Subs = subs => ({dispatch, getState}) => next => {
	const activeSubs = {};

	return action => {
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
			activeSubs[id] = currentSubs[id](dispatch);
		});

		return a;
	};
};
