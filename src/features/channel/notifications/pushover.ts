import type {EventPayload, DispatchResult} from '@/features/notifications/notifications.types';

export async function sendPushover(
    config: {
        pushoverUserKey: string;
        pushoverApiToken: string;
        pushoverPriority: string;
        pushoverDevice?: string;
    },
    payload: EventPayload
): Promise<DispatchResult> {
    const {pushoverUserKey, pushoverApiToken, pushoverDevice} = config;
    const priority = parseInt(config.pushoverPriority ?? "0", 10);

    const body: Record<string, string | number> = {
        token: pushoverApiToken,
        user: pushoverUserKey,
        title: `[${payload.level.toUpperCase()}] ${payload.title}`,
        message: payload.data
            ? `${payload.message}\n\nData:\n${JSON.stringify(payload.data, null, 2)}`
            : payload.message,
        priority,
    };

    if (pushoverDevice) {
        body.device = pushoverDevice;
    }

    // Emergency priority requires retry + expire
    if (priority === 2) {
        body.retry = 60;
        body.expire = 3600;
    }

    const res = await fetch("https://api.pushover.net/1/messages.json", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const errors = json?.errors?.join(", ") ?? res.statusText;
        throw new Error(`Pushover error ${res.status}: ${errors}`);
    }

    return {
        success: true,
        provider: "pushover",
        message: "Sent via Pushover",
        response: json,
    };
}
