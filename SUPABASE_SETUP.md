# YANAR — Free-Tier Backend Integration Guide (Supabase / Firebase)

YANAR is engineered with a modular backend adapter architecture. Out-of-the-box, it runs smoothly using a client-side storage engine and realistic mock data. When you are ready to connect a live free-tier backend, follow this 5-minute setup guide.

---

## 1. Supabase Setup (Recommended - 100% Free Tier)

### Step 1: Create a Free Project
1. Go to [https://supabase.com](https://supabase.com) and create an account.
2. Click **New Project** and choose your region and a database password.

### Step 2: Run Database Schema (SQL Editor)
Open the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  name text,
  avatar_url text,
  bio text,
  website text,
  followers_count int default 0,
  following_count int default 0,
  posts_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Posts Table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  type text default 'image' check (type in ('image', 'video')),
  media_url text not null,
  caption text,
  location text,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Reels Table
create table public.reels (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  caption text,
  audio_track text,
  likes_count int default 0,
  comments_count int default 0,
  shares_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Stories Table
create table public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  type text default 'image' check (type in ('image', 'video')),
  expires_at timestamp with time zone default (now() + interval '24 hours') not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Comments Table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Messages Table (Real-time enabled)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  text text,
  media_url text,
  media_type text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Realtime for Messages
alter publication supabase_realtime add table public.messages;
```

### Step 3: Storage Bucket (Free 1GB Storage)
1. In the Supabase Dashboard, click **Storage** -> **New Bucket**.
2. Name the bucket `yanar_media`.
3. Toggle **Public bucket** to `ON` so photos/videos are streamable by followers.
4. Save the bucket.

### Step 4: Environment Variables
Create a `.env` file in the root of the project:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Once defined, `src/services/supabaseClient.ts` will automatically activate the connection.

---

## 2. WebRTC Calling Overview
- **Audio & Video Streams**: Uses `navigator.mediaDevices.getUserMedia` for 720p/1080p webcam and high-fidelity microphone input.
- **Screen Sharing**: Uses `navigator.mediaDevices.getDisplayMedia`.
- **Signaling**: Includes loopback and `BroadcastChannel` signaling for zero-server dual-tab testing, and can be wired to Supabase Realtime Channels (`supabase.channel('call_room')`) for multi-device calling.
