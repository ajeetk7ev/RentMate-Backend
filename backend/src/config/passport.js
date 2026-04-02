/**
 * Google OAuth Passport Configuration
 *
 * Configures passport with Google OAuth 2.0 strategy.
 * Handles user creation/login via Google account.
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import env from "./env.js";
import logger from "./logger.js";

const configurePassport = () => {
  // Only configure if Google credentials are present
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn("Google OAuth credentials not found. Google login will be disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
          const avatarUrl = profile.photos?.[0]?.value || "";

          // Check if user already exists by googleId
          let user = await User.findOne({ googleId });

          if (user) {
            // Existing Google user — update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Check if user exists by email (might have signed up locally)
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing local user
              user.googleId = googleId;
              user.authProvider = "google";
              if (!user.avatar.url && avatarUrl) {
                user.avatar.url = avatarUrl;
              }
              user.lastLogin = new Date();
              await user.save();
              return done(null, user);
            }
          }

          // Create new user via Google
          user = await User.create({
            name,
            email,
            googleId,
            authProvider: "google",
            avatar: { url: avatarUrl, publicId: "" },
            isVerified: true, // Google accounts are pre-verified
            lastLogin: new Date(),
          });

          return done(null, user);
        } catch (error) {
          logger.error(`Google OAuth error: ${error.message}`);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user ID into session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  logger.info("Google OAuth strategy configured.");
};

export default configurePassport;
