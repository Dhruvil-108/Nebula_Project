const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nebula — Business Operations Hub API',
      version: '1.0.0',
      description:
        'Authentication and core API for Nebula — a multi-tenant enterprise SaaS platform unifying CRM, HRMS, Recruitment, Expenses, Inventory, and Analytics.',
      contact: {
        name: 'Nebula Dev Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your access token here (obtained from /auth/login or /auth/signup)',
        },
      },
      schemas: {
        // ── Request bodies ──
        SignupRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password', 'organizationName'],
          properties: {
            fullName:         { type: 'string', example: 'Sarah Jenkins' },
            email:            { type: 'string', format: 'email', example: 'sarah@apexbiocorp.com' },
            password:         { type: 'string', minLength: 8, example: 'SecurePass1' },
            organizationName: { type: 'string', example: 'Apex BioCorp' },
            companySize: {
              type: 'string',
              enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
              example: '51-200',
            },
            industry: { type: 'string', example: 'Biotechnology' },
            primaryFocus: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics', 'all'],
              },
              example: ['crm', 'hrms'],
            },
            invites: {
              type: 'array',
              items: { $ref: '#/components/schemas/InviteInput' },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'sarah@apexbiocorp.com' },
            password: { type: 'string', example: 'SecurePass1' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        InviteInput: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@apexbiocorp.com' },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'hr', 'recruiter', 'sales', 'finance', 'inventory_manager', 'employee'],
              example: 'hr',
            },
          },
        },
        // ── Response schemas ──
        UserObject: {
          type: 'object',
          properties: {
            id:       { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
            fullName: { type: 'string', example: 'Sarah Jenkins' },
            email:    { type: 'string', example: 'sarah@apexbiocorp.com' },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'manager', 'hr', 'recruiter', 'sales', 'finance', 'inventory_manager', 'employee'],
              example: 'super_admin',
            },
          },
        },
        OrganizationObject: {
          type: 'object',
          properties: {
            id:           { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0e' },
            name:         { type: 'string', example: 'Apex BioCorp' },
            primaryFocus: { type: 'array', items: { type: 'string' }, example: ['crm', 'hrms'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken:  { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user:         { $ref: '#/components/schemas/UserObject' },
            organization: { $ref: '#/components/schemas/OrganizationObject' },
          },
        },
        SignupResponse: {
          allOf: [
            { $ref: '#/components/schemas/AuthResponse' },
            {
              type: 'object',
              properties: {
                invitesSent: { type: 'integer', example: 2 },
              },
            },
          ],
        },
        MeResponse: {
          type: 'object',
          properties: {
            user:         { $ref: '#/components/schemas/UserObject' },
            organization: { $ref: '#/components/schemas/OrganizationObject' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid email or password.' },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Logged out successfully.' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status:    { type: 'string', example: 'ok' },
            service:   { type: 'string', example: 'nebula-api' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  // Scan these files for JSDoc @swagger annotations
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
