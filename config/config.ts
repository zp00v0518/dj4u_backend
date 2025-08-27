export default {
  db: {
    name: "dj4u",
    collections: {
      users: "users",
    },
  },
  server: {
    port: 4000,
  },
  
  cookies: {
    cookieSize: 100,
    names: {
      session: "sessionId",
    }
  }
};
