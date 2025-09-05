const { app } = require('@azure/functions');

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';

            // Check for Static Web Apps authentication header
            const principalHeader = request.headers["x-ms-client-principal"];
            if (!principalHeader) {
                context.res = {
                    status: 401,
                    body: "Unauthorized: No authentication header found."
                };
                return;
            }

            // Decode and parse the principal
            let principal;
            try {
                principal = JSON.parse(Buffer.from(principalHeader, 'base64').toString('utf8'));
            } catch (e) {
                context.res = {
                    status: 400,
                    body: "Invalid authentication header."
                };
                return;
            }

            // Optionally check for required role/group
            // Example: require 'mdsuser' role
            if (!principal.userRoles || !principal.userRoles.includes("mdsuser")) {
                context.res = {
                    status: 403,
                    body: "Forbidden: Insufficient role."
                };
                return;
            }

            context.res = {
                status: 200,
                body: `Hello ${principal.userDetails || "user"}! You are authorized as: ${principal.userRoles.join(", ")}`
            };
    }
});
