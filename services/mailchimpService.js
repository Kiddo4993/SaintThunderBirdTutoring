/**
 * Provides integration with Mailchimp Marketing API to sync users.
 */

async function subscribeUser({ email, firstName, lastName, userType }) {
    const apiKey = process.env.MAILCHIMP_MARKETING_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., 'us21'

    if (!apiKey || !listId || !serverPrefix) {
        console.log(`⚠️ Mailchimp credentials missing. Skipping subscription for ${email}`);
        return null;
    }

    if (typeof fetch !== 'function') {
        console.error('❌ Global fetch is unavailable; Mailchimp provider requires Node 18+');
        return null;
    }

    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
                email_address: email,
                status: 'subscribed', // 'subscribed' means they are opted in right away
                merge_fields: {
                    FNAME: firstName || '',
                    LNAME: lastName || '',
                    UTYPE: userType || '' // Optional, if you add this merge field in Mailchimp
                }
            })
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text();
            // 400 with title "Member Exists" is common and safe to ignore
            if (response.status === 400 && body.includes('Member Exists')) {
                console.log(`ℹ️ Mailchimp: User ${email} is already subscribed.`);
                return true;
            }
            throw new Error(`Mailchimp API failed (${response.status}): ${body.slice(0, 300)}`);
        }

        console.log(`✅ Mailchimp: Successfully subscribed ${email}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        // We log the error but don't throw it, so it doesn't break the signup flow
        console.error('❌ Mailchimp subscription error:', error.message);
        return null;
    }
}

module.exports = {
    subscribeUser
};
