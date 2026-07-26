// config/passport.js — Google + GitHub OAuth strategies
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

/**
 * Google OAuth 2.0 Strategy
 * Finds or creates a user record based on the Google profile.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already has Google OAuth linked
        let user = await User.findOne({
          'oauthProviders.provider': 'google',
          'oauthProviders.providerId': profile.id,
        });

        if (user) return done(null, user);

        // Check if email already registered
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            // Link Google to existing account
            user.oauthProviders.push({ provider: 'google', providerId: profile.id });
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const username = await generateUniqueUsername(profile.displayName || profile.id);
        user = await User.create({
          displayName: profile.displayName,
          username,
          email,
          avatar: profile.photos?.[0]?.value,
          isVerified: true, // OAuth users are pre-verified
          oauthProviders: [{ provider: 'google', providerId: profile.id }],
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/**
 * GitHub OAuth 2.0 Strategy
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          'oauthProviders.provider': 'github',
          'oauthProviders.providerId': String(profile.id),
        });

        if (user) return done(null, user);

        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.oauthProviders.push({ provider: 'github', providerId: String(profile.id) });
            await user.save();
            return done(null, user);
          }
        }

        const username = await generateUniqueUsername(profile.username || profile.id);
        user = await User.create({
          displayName: profile.displayName || profile.username,
          username,
          email,
          avatar: profile.photos?.[0]?.value,
          isVerified: true,
          oauthProviders: [{ provider: 'github', providerId: String(profile.id) }],
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/**
 * Generate a unique username from a display name, appending a number if taken.
 */
async function generateUniqueUsername(base) {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 20);

  let username = slug;
  let count = 0;

  while (await User.findOne({ username })) {
    count++;
    username = `${slug}${count}`;
  }

  return username;
}

// Passport serialize/deserialize (used for session-based flow, not JWT)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
