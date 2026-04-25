const ref = name => ({
  $ref: `#/components/schemas/${name}`
});

const jsonRequest = (schema, example) => ({
  required: true,
  content: {
    "application/json": {
      schema,
      ...(example ? { example } : {})
    }
  }
});

const jsonResponse = (description, schema, example) => ({
  description,
  content: {
    "application/json": {
      schema,
      ...(example ? { example } : {})
    }
  }
});

const examples = {
  user: {
    _id: "67b6f2d1b8a8c91d4a6d2201",
    firstName: "Ateek",
    lastName: "Ali",
    userName: "ateek.ali",
    email: "ateek@example.com",
    roles: ["user"],
    image: "uploads/profile.png",
    code: "USR-1001"
  },
  token:
    "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2N2I2ZjJkMWI4YThjOTFkNGE2ZDIyMDEiLCJlbWFpbCI6ImF0ZWVrQGV4YW1wbGUuY29tIiwicm9sZXMiOlsidXNlciJdfQ.signature"
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Watch2Win Auth Service API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for the Watch2Win authentication microservice. This service handles login, signup proxying, and resolving the current authenticated user."
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development"
    }
  ],
  tags: [
    {
      name: "Auth",
      description: "Authentication and signup endpoints exposed by the auth microservice."
    },
    {
      name: "Profile",
      description: "Resolve the currently authenticated user from a JWT token."
    }
  ],
  paths: {
    "/": {
      get: {
        tags: ["Auth"],
        summary: "Health check message",
        responses: {
          200: {
            description: "Service greeting",
            content: {
              "text/html": {
                schema: {
                  type: "string",
                  example: "Hello from auth!"
                }
              }
            }
          }
        }
      }
    },
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate a user with email and password",
        requestBody: jsonRequest(ref("LoginRequest"), {
          email: "ateek@example.com",
          password: "Password123!"
        }),
        responses: {
          200: jsonResponse("Login response", ref("LoginResponse"), {
            success: true,
            data: {
              user: examples.user,
              token: examples.token
            }
          }),
          500: jsonResponse("Unexpected authentication failure", ref("ErrorResponse"), {
            success: false,
            message: "Unable to authenticate user"
          })
        }
      }
    },
    "/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user account through the backend service",
        description:
          "This endpoint forwards the signup payload to the backend service and returns the backend response as-is.",
        requestBody: jsonRequest(ref("SignupRequest"), {
          firstName: "Ateek",
          lastName: "Ali",
          userName: "ateek.ali",
          email: "ateek@example.com",
          password: "Password123!",
          confirm_password: "Password123!",
          roles: "user"
        }),
        responses: {
          200: jsonResponse("Signup response", ref("SignupResponse"), {
            success: true,
            data: {
              user: examples.user,
              token: examples.token,
              message: "User created successfully"
            }
          }),
          500: jsonResponse("Unexpected signup failure", ref("ErrorResponse"), {
            success: false,
            message: "Unable to create user"
          })
        }
      }
    },
    "/me": {
      get: {
        tags: ["Profile"],
        summary: "Get the currently authenticated user",
        security: [{ jwtAuth: [] }],
        responses: {
          200: jsonResponse("Authenticated user", ref("CurrentUserResponse"), {
            success: true,
            data: {
              user: examples.user
            }
          }),
          401: jsonResponse("Missing or invalid JWT token", ref("ErrorResponse"), {
            success: false,
            message: "Not Authorized"
          })
        }
      }
    }
  },
  components: {
    securitySchemes: {
      jwtAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: 'Use the literal format `JWT <token>`.'
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          userName: { type: "string" },
          email: { type: "string", format: "email" },
          roles: {
            type: "array",
            items: { type: "string" }
          },
          image: { type: "string", nullable: true },
          code: { type: "string", nullable: true }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" }
        }
      },
      SignupRequest: {
        type: "object",
        required: ["firstName", "email", "password", "confirm_password"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          userName: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string" },
          confirm_password: { type: "string" },
          roles: {
            type: "string",
            enum: ["user", "admin"],
            default: "user"
          }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              user: ref("User"),
              token: { type: "string" }
            }
          },
          errors: {
            type: "object",
            additionalProperties: true,
            nullable: true
          }
        }
      },
      SignupResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              user: ref("User"),
              token: { type: "string" },
              message: { type: "string" }
            }
          },
          errors: {
            type: "object",
            additionalProperties: true,
            nullable: true
          },
          message: { type: "string", nullable: true }
        }
      },
      CurrentUserResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              user: ref("User")
            }
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      }
    }
  }
};
