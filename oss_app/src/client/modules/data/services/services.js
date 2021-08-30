/*
 * POST Login and Subscribe to Salesforce Streaming API
 */
export async function subscribe(topic, body) {
    const subscriptionEndpoint = `/api/v1/subscribe?topic=${topic}`;
    console.log('connect ' +subscriptionEndpoint);
    try {
        const response = await fetch(subscriptionEndpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response.json();
    } catch (e) {
        return e;
    }
}
/*
 * GET Logout of Salesforce
 */
export async function unsubscribe(topic) {
    const endpoint = `/api/v1/unsubscribe?topic=${topic}`;
    try {
        const response = await fetch(endpoint);
        return response.json();
    } catch (e) {
        return e;
    }
}
/*
 * GET All stored events
 */
export async function getAll() {
    const endpoint = `/api/v1/events/all`;
    try {
        const response = await fetch(endpoint);
        return response.json();
    } catch (e) {
        return e;
    }
}
/*
 * POST Publish Platform Event
 */
export async function publish(body) {
    const endpoint = `/api/v1/publish`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response.json();
    } catch (e) {
        return e;
    }
}


