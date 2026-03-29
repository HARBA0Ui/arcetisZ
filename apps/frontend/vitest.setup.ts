const env = process.env as Record<string, string | undefined>;

env.NODE_ENV = env.NODE_ENV ?? "test";
env.JWT_SECRET = env.JWT_SECRET ?? "arcetis-test-jwt-secret-key-123456";
env.AUTH_SECRET = env.AUTH_SECRET ?? "arcetis-test-auth-secret-key-123456";
env.APP_ENCRYPTION_SECRET = env.APP_ENCRYPTION_SECRET ?? "arcetis-test-encryption-secret-123456";
env.DATABASE_URL = env.DATABASE_URL ?? "mongodb://localhost:27017/arcetis-test";
