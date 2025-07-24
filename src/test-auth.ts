import { supabase } from './lib/supabase';

async function testAuth() {
  console.log('🔐 Testing Supabase Authentication System...\n');

  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
    }
  } catch (err) {
    console.error('❌ Connection error:', err);
  }

  // Test 2: Test user registration
  console.log('\n2. Testing user registration...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          username: `testuser${Date.now()}`
        }
      }
    });

    if (error) {
      console.error('❌ Registration failed:', error.message);
    } else {
      console.log('✅ User registered successfully!');
      console.log('   Email:', testEmail);
      console.log('   User ID:', data.user?.id);
    }
  } catch (err) {
    console.error('❌ Registration error:', err);
  }

  // Test 3: Test sign in
  console.log('\n3. Testing sign in...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ Sign in failed:', error.message);
    } else {
      console.log('✅ Signed in successfully!');
      console.log('   Session:', data.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('❌ Sign in error:', err);
  }

  // Test 4: Test profile creation
  console.log('\n4. Testing profile access...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Profile fetch failed:', error.message);
      } else {
        console.log('✅ Profile accessed successfully!');
        console.log('   Username:', profile?.username);
        console.log('   Full Name:', profile?.full_name);
      }
    }
  } catch (err) {
    console.error('❌ Profile error:', err);
  }

  // Test 5: Test sign out
  console.log('\n5. Testing sign out...');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out failed:', error.message);
    } else {
      console.log('✅ Signed out successfully!');
    }
  } catch (err) {
    console.error('❌ Sign out error:', err);
  }

  console.log('\n✨ Authentication tests completed!');
}

// Run the tests
testAuth();