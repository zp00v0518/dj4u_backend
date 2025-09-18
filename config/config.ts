import path from "node:path";

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
  },
  files: {
    uploadDir: path.resolve(path.dirname(process.argv[1]), 'uploads'),
    mixinDir: 'mixins'
  }
};
