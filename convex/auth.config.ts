const issuer = process.env.CLERK_ISSUER_URL || "https://clerk.kalaburagitech.com";

// Log the effective Clerk issuer at runtime to help debugging token validation (non-sensitive)
// This will appear in Convex server logs when functions load.
console.log('CONVEX_DEBUG: effective Clerk issuer =', issuer);

export default {
  providers: [
    {
      domain: issuer,
      applicationID: "convex",
    },
  ],
};
