const host = process.env.HOST;
const port = process.env.PORT;

/* eslint-disable */
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'Cortisoul API',
    version: '1.0.0',
    description:
      'REST API untuk Cortisoul — mental health journaling dengan prediksi AI.',
  },
  servers: [{ url: `http://${host}:${port}` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    // Users
    '/users': {
      post: {
        tags: ['Users'],
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'fullname'],
                properties: {
                  username: { type: 'string', example: 'johndoe' },
                  password: { type: 'string', example: 'secret123' },
                  fullname: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 201 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        username: { type: 'string' },
                        fullname: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            username: { type: 'string' },
                            fullname: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Not Found — user tidak ditemukan' },
        },
      },
    },

    // Authentications
    '/authentications': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'johndoe' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Refresh Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'Logout',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logout berhasil' },
          400: { description: 'Bad request' },
        },
      },
    },

    // Health
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        uptime: { type: 'number', example: 3600.5 },
                        timestamp: {
                          type: 'string',
                          example: '2026-06-01T08:00:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Journals
    '/journals': {
      get: {
        tags: ['Journals'],
        summary: 'List journal',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        journals: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              title: { type: 'string' },
                              content: { type: 'string' },
                              emotion: { type: 'string', example: 'stress' },
                              stressScore: { type: 'number', example: 0.87 },
                              stressCategory: {
                                type: 'string',
                                example: 'Tinggi',
                              },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              updatedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Journals'],
        summary: 'Tambah journal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'Hari yang melelahkan' },
                  content: {
                    type: 'string',
                    example:
                      'Hari ini saya merasa sangat lelah dan tertekan oleh deadline...',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Journal berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 201 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        journalId: { type: 'string' },
                        prediction: {
                          type: 'object',
                          properties: {
                            prediksi_label: {
                              type: 'string',
                              example: 'stress',
                            },
                            stress_score: { type: 'number', example: 0.87 },
                            kategori_stres: {
                              type: 'string',
                              example: 'Tinggi',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          500: { description: 'Internal Server Error' },
        },
      },
    },
    '/journals/stress-levels': {
      get: {
        tags: ['Journals'],
        summary: 'Weekly stress levels',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        stressLevels: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              date: { type: 'string', example: '2026-06-01' },
                              day: { type: 'string', example: 'Senin' },
                              averageScore: { type: 'number', example: 0.72 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/journals/emotions': {
      get: {
        tags: ['Journals'],
        summary: 'Weekly emotion summary',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        emotionSummary: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              emotion: { type: 'string', example: 'stress' },
                              count: { type: 'integer', example: 3 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/journals/{id}': {
      get: {
        tags: ['Journals'],
        summary: 'Get journal by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Journal ID',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        journal: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            content: { type: 'string' },
                            emotion: { type: 'string' },
                            stressScore: { type: 'number' },
                            stressCategory: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not Found' },
        },
      },
      put: {
        tags: ['Journals'],
        summary: 'Update journal by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Journal ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Journal berhasil diperbarui' },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not Found' },
        },
      },
      delete: {
        tags: ['Journals'],
        summary: 'Delete journal by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Journal ID',
          },
        ],
        responses: {
          200: { description: 'Journal berhasil dihapus' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not Found' },
        },
      },
    },

    '/journals/{id}/reflections': {
      post: {
        tags: ['Reflections'],
        summary: 'Generate AI reflection',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Journal ID',
          },
        ],
        responses: {
          200: {
            description: 'Refleksi sudah ada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        reflection: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            journalId: { type: 'string' },
                            text: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          201: {
            description: 'Refleksi berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 201 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        reflection: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            journalId: { type: 'string' },
                            text: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not Found' },
          500: { description: 'Internal Server Error' },
        },
      },
      get: {
        tags: ['Reflections'],
        summary: 'Get reflection journal',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Journal ID',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        reflection: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            journalId: { type: 'string' },
                            text: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not Found' },
        },
      },
    },

    // Predict
    '/predict': {
      post: {
        tags: ['Predict'],
        summary: 'Prediction mental health label',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: {
                    type: 'string',
                    example:
                      'Saya merasa sangat cemas dan tidak bisa tidur belakangan ini.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Prediction result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        prediction: {
                          type: 'object',
                          properties: {
                            prediksi_label: {
                              type: 'string',
                              example: 'stress',
                            },
                            stress_score: { type: 'number', example: 0.87 },
                            kategori_stres: {
                              type: 'string',
                              example: 'Tinggi',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          500: { description: 'Internal server error' },
        },
      },
    },

    // Notifications
    '/notifications/subscribe': {
      post: {
        tags: ['Notifications'],
        summary: 'Subscribe webpush notification',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['endpoint', 'keys'],
                properties: {
                  endpoint: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://fcm.googleapis.com/fcm/send/xxxxxx',
                  },
                  keys: {
                    type: 'object',
                    required: ['p256dh', 'auth'],
                    properties: {
                      p256dh: { type: 'string' },
                      auth: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Subscription berhasil ditambahkan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 201 },
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        subscriptionId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too Many Requests' },
        },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Unsubscribe webpush notification',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['endpoint'],
                properties: {
                  endpoint: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://fcm.googleapis.com/fcm/send/xxxxxx',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Subscription berhasil dihapus' },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not Found' },
          429: { description: 'Too Many Requests' },
        },
      },
    },
    '/notifications/test': {
      post: {
        tags: ['Notifications'],
        summary: 'Send test push notification to all subscribed devices',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    status: { type: 'string', example: 'success' },
                    message: {
                      type: 'string',
                      example: 'Notification sent to 2 devices',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Not Found' },
          429: { description: 'Too Many Requests' },
        },
      },
    },
  },
};

export default swaggerDocs;
