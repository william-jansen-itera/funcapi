const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const tenantId = 'a18232f7-c6f8-48da-b8e1-838c7fac8ab1'; // Replace with your Azure AD tenant ID
const audience = 'b82efeaa-410b-4d9a-9bc1-64a1a3f71ec9'; // Replace with your Azure AD app registration client ID

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // const name = request.query.get('name') || await request.text() || 'world';
        // Log all headers for debugging
        context.log('Request headers:', JSON.stringify(request.headers, null, 2));
        
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { status: 401, body: 'Missing or invalid Authorization header' };
        }

        const token = authHeader.substring(7);

        try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {audience: audience, issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`},
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
        );
      });

      // Log all claims for debugging
      context.log('JWT claims:', JSON.stringify(decoded, null, 2));

      // Token is valid, you can access claims in 'decoded'
      return { body: `Hello from func API, ${decoded.name || decoded.preferred_username || 'user'}!` };
        } catch (err) {
            context.log('JWT validation error:', err);
            return { status: 401, body: 'Invalid token' };
        }
    }
});
