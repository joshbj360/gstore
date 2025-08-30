import states from '~/assets/nigeria-states-lgas.json'

export const nigerianStates = Object.keys(states);
export interface StateInterface {
    state: string,
    localGovernmentAreas: string[],
}
    
export const statesAndLGAs = Object.keys(states)
    .map((state) => ({
        state,
        localGovernmentAreas: states[state as keyof typeof states],
    })) as StateInterface[];
    1