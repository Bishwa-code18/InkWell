// utils/seeder.js — Automated seeding script for Inkwell
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
// Force Google DNS to bypass ISP routers that block SRV record lookups
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');

const BASE_IMG_URL = 'http://localhost:5000/public/seed_images';

const seed = async () => {
  try {
    console.log('🌱 Starting Seeding Process...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data (Optional - comment out if you want to keep data)
    await User.deleteMany({ isSeed: true });
    await Community.deleteMany({ isSeed: true });
    await Post.deleteMany({ isSeed: true });
    console.log('🧹 Cleared previous seed data');

    // 2. Create Seed Users
    const users = await User.create([
      {
        username: 'inkwell_admin',
        email: 'admin@inkwell.com',
        displayName: 'Inkwell Official',
        role: 'admin',
        bio: 'The official voice of Inkwell.',
        isSeed: true,
      },
      {
        username: 'tech_guru',
        email: 'guru@tech.com',
        displayName: 'Tech Guru',
        bio: 'Exploring the frontiers of technology.',
        isSeed: true,
      },
      {
        username: 'creative_soul',
        email: 'soul@creative.com',
        displayName: 'Creative Soul',
        bio: 'Art is life, life is art.',
        isSeed: true,
      }
    ]);
    console.log(`👤 Created ${users.length} users`);

    // 3. Create Communities
    const communities = await Community.create([
      {
        name: 'tech_horizon',
        displayName: 'Tech Horizon',
        description: 'Discussions on AI, hardware, and the future of tech.',
        banner: `${BASE_IMG_URL}/tech_horizon.png`,
        color: '#3B82F6',
        creator: users[0]._id,
        moderators: [users[0]._id, users[1]._id],
        isSeed: true,
      },
      {
        name: 'creative_ink',
        displayName: 'Creative Ink',
        description: 'A sanctuary for writers, poets, and artists.',
        banner: `${BASE_IMG_URL}/creative_ink.png`,
        color: '#EC4899',
        creator: users[2]._id,
        moderators: [users[2]._id],
        isSeed: true,
      },
      {
        name: 'philosophy_nook',
        displayName: 'Philosophy Nook',
        description: 'Deep dives into ethics, logic, and human existence.',
        banner: `${BASE_IMG_URL}/philosophy_nook.png`,
        color: '#10B981',
        creator: users[0]._id,
        isSeed: true,
      },
      {
        name: 'science_daily',
        displayName: 'Science Daily',
        description: 'Breaking news from the world of research and space.',
        banner: `${BASE_IMG_URL}/science_daily.png`,
        color: '#F59E0B',
        creator: users[1]._id,
        isSeed: true,
      }
    ]);
    console.log(`🏰 Created ${communities.length} communities`);

    // 4. Create Posts
    const posts = await Post.create([
      {
        title: 'The Rise of Agentic AI: What Comes Next?',
        body: '<p>Agentic AI is moving beyond simple chat interfaces. We are looking at a future where AI can autonomously plan and execute complex workflows...</p>',
        author: users[1]._id,
        community: communities[0]._id,
        upvotes: 125,
        score: 125,
        postType: 'text',
        isSeed: true,
      },
      {
        title: 'A Poem for the Digital Age',
        body: '<p>Ink flows in binary streams,<br>Connecting souls across the screen.<br>In every pixel, a shared dream,<br>In every click, a world unseen.</p>',
        author: users[2]._id,
        community: communities[1]._id,
        upvotes: 89,
        score: 89,
        postType: 'text',
        isSeed: true,
      },
      {
        title: 'Why Socrates Still Matters in 2024',
        body: '<p>The Socratic method is more relevant than ever in an era of echo chambers and misinformation. Questioning everything is the first step to true knowledge.</p>',
        author: users[0]._id,
        community: communities[2]._id,
        upvotes: 56,
        score: 56,
        postType: 'text',
        isSeed: true,
      },
      {
        title: 'James Webb Telescope Discovers Ancient Galaxy',
        body: '<p>The latest images from JWST reveal a galaxy that formed just 300 million years after the Big Bang, challenging our current models of the early universe.</p>',
        author: users[1]._id,
        community: communities[3]._id,
        upvotes: 210,
        score: 210,
        postType: 'text',
        isSeed: true,
      }
    ]);
    console.log(`📝 Created ${posts.length} posts`);

    console.log('✨ Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seed();
