export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || "https://upright-bluebird-30.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
