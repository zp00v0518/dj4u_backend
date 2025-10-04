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
    // uploadDir: path.resolve('C:/Users/zp00v/Desktop/Projects/dj4u/dj4u_backend/', 'uploads'),
    // mixesDir: path.resolve('C:/Users/zp00v/Desktop/Projects/dj4u/dj4u_backend/', 'mixes'),
    uploadDir: path.resolve(path.dirname(process.argv[1]), 'uploads'),
    mixesDir: path.resolve(path.dirname(process.argv[1]), 'mixes'),
  }
};
