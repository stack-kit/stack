/** The reason prop of a ReasonButton: none while the action may run, so that no undefined reaches the prop. */
export const reasonOf = (reason: string | undefined): { reason?: string } => (reason === undefined ? {} : { reason });
