'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'portabase_onboarding';
const DONE_VALUE = 'done';

export async function isOnboardingDone() {
    return (await cookies()).get(COOKIE_NAME)?.value === DONE_VALUE;
}

export async function markOnboardingDone() {
    (await cookies()).set(COOKIE_NAME, DONE_VALUE, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
    });
}
