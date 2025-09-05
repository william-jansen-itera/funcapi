const { app } = require('@azure/functions');

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';


        // Log all headers for debugging
        context.log('Request headers:', JSON.stringify(request.headers, null, 2));

        // Check for Static Web Apps authentication header
        const principalHeader = request.headers["x-ms-client-principal"];
        if (!principalHeader) {
            return { body: "No header found" };
        }

        // Decode and parse the principal
        let principal;
        try {
            principal = JSON.parse(Buffer.from(principalHeader, 'base64').toString('utf8'));
        } catch (e) {
            return { body: "Header could not be parsed" };
        }

        return { body: `Hello from func API, ${principal.userDetails}!` };
    }
});
