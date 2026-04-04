async function subscribeUser({ email, firstName, lastName, userType }) {
    const apiKey = process.env.MAILCHIMP_MARKETING_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;

    if (!apiKey || !listId || !serverPrefix) {
        console.log(`⚠️ Mailchimp credentials missing. Skipping subscription for ${email}`);
        return null;
    }

    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                email_address: email,
                status: 'subscribed',
                merge_fields: { FNAME: firstName || '', LNAME: lastName || '', UTYPE: userType || '' }
            })
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text();
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
        console.error('❌ Mailchimp subscription error:', error.message);
        return null;
    }
}

module.exports = { subscribeUser };
