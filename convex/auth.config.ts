export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || "https://clerk.kalaburagitech.com",
      applicationID: "convex",
    },
  ],
};
