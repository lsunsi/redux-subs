import {Middleware, Dispatch} from 'redux';

export type Disable = () => void;
export type Enable<D extends Dispatch> = (d: D) => Disable;
export type GetSubs<D extends Dispatch, State> = (s: State) => CurrentSubs<D>;

export type CurrentSubs<D extends Dispatch> = Record<string, Enable<D> | undefined>;

function disablePlaceholder() {
	// Placeholder to "mark" a subscription before it activates
}

const install = <State, D extends Dispatch>
(subs: GetSubs<D, State>): Middleware<Record<string, unknown>, State, D> =>
	({dispatch, getState}) =>
		next => {
			const activeSubs = new Map<string, Disable>();
			return action => {
				const a = next(action);
				const state = getState();
				const currentSubs = subs(state);

				const keys = [...activeSubs.keys(), ...Object.keys(currentSubs)];

				for (const id of keys) {
					const enabler = currentSubs[id];
					const disabler = activeSubs.get(id);
					if (!enabler && disabler) {
						activeSubs.delete(id);
						disabler();
					} else if (!disabler && enabler) {
						activeSubs.set(id, disablePlaceholder);
						activeSubs.set(id, enabler(dispatch));
					}
				}

				return a;
			};
		};

export default install;
