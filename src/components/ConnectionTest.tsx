import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to run advanced debugging');
  const [loading, setLoading] = useState(false);

  const testAdvancedDebug = async () => {
    setLoading(true);
    setStatus('🔍 Advanced Supabase Debug - Step by Step\n');

    try {
      // Step 1: Test raw HTTP API call first
      setStatus(prev => prev + '\n1️⃣ Testing raw HTTP API call (bypassing JS client)...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      try {
        const httpResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        });
        
        const httpText = await httpResponse.text();
        setStatus(prev => prev + `\n✅ Raw HTTP works! Status: ${httpResponse.status}, Response: ${httpText}`);
        
        // Step 2: Test Supabase JS client with very basic query
        setStatus(prev => prev + '\n\n2️⃣ Testing Supabase JS client with 2s timeout...');
        
        const quickPromise = supabase.from('profiles').select('count', { count: 'exact' });
        const quickTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('JS Client Timeout')), 2000)
        );
        
        const jsResult = await Promise.race([quickPromise, quickTimeout]);
        setStatus(prev => prev + `\n✅ JS Client works! ${JSON.stringify(jsResult)}`);
        
        // Step 3: Test auth status
        setStatus(prev => prev + '\n\n3️⃣ Testing auth status...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setStatus(prev => prev + `\n⚠️ Auth error: ${authError.message}`);
        } else {
          setStatus(prev => prev + `\n📝 User: ${user ? user.email : 'Not signed in'}`);
          
          // Step 4: If user exists, test profile access
          if (user) {
            setStatus(prev => prev + '\n\n4️⃣ Testing profile access with auth...');
            
            const authProfilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id);
            
            const authTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Auth profile timeout')), 3000)
            );
            
            try {
              const authProfileResult = await Promise.race([authProfilePromise, authTimeout]);
              setStatus(prev => prev + `\n✅ Auth profile access works: ${JSON.stringify(authProfileResult)}`);
            } catch (authProfileError: any) {
              setStatus(prev => prev + `\n❌ Auth profile failed: ${authProfileError.message}`);
              
              // Step 5: Try creating profile if missing
              if (authProfileError.message.includes('timeout') || authProfileError.message.includes('No rows')) {
                setStatus(prev => prev + '\n\n5️⃣ Attempting to create missing profile...');
                try {
                  const createResult = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      full_name: user.user_metadata?.full_name || null,
                      avatar_url: user.user_metadata?.avatar_url || null
                    });
                  setStatus(prev => prev + `\n✅ Profile created: ${JSON.stringify(createResult)}`);
                } catch (createError: any) {
                  setStatus(prev => prev + `\n❌ Profile creation failed: ${createError.message}`);
                }
              }
            }
          }
        }
        
        setStatus(prev => prev + '\n\n🎉 Advanced debug complete!');
        
      } catch (httpError: any) {
        setStatus(prev => prev + `\n❌ Raw HTTP failed: ${httpError.message}`);
        setStatus(prev => prev + '\n📋 This suggests a fundamental connection issue');
        setStatus(prev => prev + '\n   - Check Supabase project status');
        setStatus(prev => prev + '\n   - Verify API keys are correct');
        setStatus(prev => prev + '\n   - Check for network/firewall issues');
      }
      
    } catch (error: any) {
      setStatus(prev => prev + `\n💥 Debug failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearStorageAndTest = async () => {
    // Clear any conflicting storage that might cause the multiple client warning
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('music-viz-auth');
    sessionStorage.clear();
    
    setStatus('🧹 Cleared browser storage, running advanced debug...');
    await testAdvancedDebug();
  };

  const testAuthTokenBypass = async () => {
    setLoading(true);
    setStatus('🔓 Testing without authentication to isolate the issue...\n');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Step 1: Get current auth status
      setStatus(prev => prev + '\n1️⃣ Checking current auth status...');
      const { data: { user } } = await supabase.auth.getUser();
      setStatus(prev => prev + `\n📝 User: ${user ? user.email : 'Not signed in'}`);
      
      if (user) {
        // Step 2: Test with auth headers using raw HTTP
        setStatus(prev => prev + '\n\n2️⃣ Testing raw HTTP with auth token...');
        const session = await supabase.auth.getSession();
        const authToken = session.data.session?.access_token;
        
        if (authToken) {
          try {
            const authHttpPromise = fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
              }
            });
            
            const authTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Auth HTTP timeout')), 5000)
            );
            
            const authResponse = await Promise.race([authHttpPromise, authTimeout]) as Response;
            const authText = await authResponse.text();
            
            if (authResponse.ok) {
              setStatus(prev => prev + `\n✅ Raw HTTP with auth works: ${authText}`);
            } else {
              setStatus(prev => prev + `\n❌ Raw HTTP with auth failed: ${authResponse.status} - ${authText}`);
            }
            
          } catch (authHttpError: any) {
            setStatus(prev => prev + `\n❌ Raw HTTP with auth error: ${authHttpError.message}`);
          }
        }
        
        // Step 3: Sign out temporarily and test JS client
        setStatus(prev => prev + '\n\n3️⃣ Temporarily signing out to test JS client...');
        await supabase.auth.signOut();
        
        // Wait a moment for sign out to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStatus(prev => prev + '\n4️⃣ Testing JS client without authentication...');
        try {
          const noAuthPromise = supabase.from('profiles').select('count', { count: 'exact' });
          const noAuthTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('No auth JS timeout')), 3000)
          );
          
          const noAuthResult = await Promise.race([noAuthPromise, noAuthTimeout]);
          setStatus(prev => prev + `\n✅ JS client without auth works: ${JSON.stringify(noAuthResult)}`);
          
          // Now sign back in
          setStatus(prev => prev + '\n\n5️⃣ This proves the issue is with authenticated JS client requests');
          setStatus(prev => prev + '\n⚠️ You\'ll need to sign back in to continue testing');
          
        } catch (noAuthError: any) {
          setStatus(prev => prev + `\n❌ Even without auth, JS client fails: ${noAuthError.message}`);
        }
      } else {
        setStatus(prev => prev + '\n⚠️ Please sign in first to test the authenticated scenario');
      }
      
      setStatus(prev => prev + '\n\n🏁 Auth bypass test complete!');
      
    } catch (error: any) {
      setStatus(prev => prev + `\n💥 Auth bypass test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSingleClientInstance = async () => {
    setLoading(true);
    setStatus('🔧 Testing Single Client Instance (Fixed Multiple Client Issue)...\n');

    try {
      // Clear any existing auth conflicts
      setStatus(prev => prev + '\n🧹 Clearing any existing auth storage conflicts...');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('music-viz-auth');
      localStorage.removeItem('music-viz-supabase-auth');
      
      // Test 1: Basic connection
      setStatus(prev => prev + '\n\n1️⃣ Testing basic connection...');
      
      try {
        const basicPromise = supabase.from('profiles').select('count', { count: 'exact' });
        const basicTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Basic connection timeout')), 3000)
        );
        
        const basicResult = await Promise.race([basicPromise, basicTimeout]);
        setStatus(prev => prev + `\n✅ Basic connection works: ${JSON.stringify(basicResult)}`);
        
      } catch (basicError: any) {
        setStatus(prev => prev + `\n❌ Basic connection failed: ${basicError.message}`);
        throw basicError;
      }
      
      // Test 2: Auth status
      setStatus(prev => prev + '\n\n2️⃣ Testing auth status...');
      
      try {
        const authPromise = supabase.auth.getUser();
        const authTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        );
        
        const { data: { user }, error } = await Promise.race([authPromise, authTimeout]) as any;
        
        if (error) {
          setStatus(prev => prev + `\n⚠️ Auth error: ${error.message}`);
        } else {
          setStatus(prev => prev + `\n✅ Auth check works. User: ${user ? user.email : 'Not signed in'}`);
          
          // Test 3: If signed in, test authenticated query
          if (user) {
            setStatus(prev => prev + '\n\n3️⃣ Testing authenticated query...');
            
            try {
              const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id);
                
              const profileTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile query timeout')), 5000)
              );
              
              const profileResult = await Promise.race([profilePromise, profileTimeout]);
              setStatus(prev => prev + `\n✅ Authenticated query works: ${JSON.stringify(profileResult)}`);
              
              // Test 4: Test visualization save
              setStatus(prev => prev + '\n\n4️⃣ Testing visualization save...');
              
              const savePromise = supabase
                .from('visualizations')
                .insert({
                  user_id: user.id,
                  title: `Test Viz ${Date.now()}`,
                  settings: { type: 'circle', color: '#6366f1' },
                  is_draft: true,
                  is_public: false
                });
                
              const saveTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Save timeout')), 5000)
              );
              
              const saveResult = await Promise.race([savePromise, saveTimeout]);
              setStatus(prev => prev + `\n🎉 Visualization save works: ${JSON.stringify(saveResult)}`);
              
              setStatus(prev => prev + '\n\n🎊 SUCCESS! All operations work with single client instance!');
              
            } catch (profileError: any) {
              setStatus(prev => prev + `\n❌ Authenticated operations failed: ${profileError.message}`);
            }
          }
        }
        
      } catch (authError: any) {
        setStatus(prev => prev + `\n❌ Auth operations failed: ${authError.message}`);
      }
      
    } catch (error: any) {
      setStatus(prev => prev + `\n💥 Single client test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const testSimplifiedSchema = async () => {
    setLoading(true);
    setStatus('🔄 Testing with simplified schema approach...\n');

    try {
      // First check if we can reach Supabase at all
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      setStatus(prev => prev + '\n1️⃣ Pinging Supabase health endpoint...');
      try {
        const healthResponse = await fetch(`${supabaseUrl}/health`);
        setStatus(prev => prev + `\n✅ Supabase is reachable: ${healthResponse.status}`);
      } catch {
        setStatus(prev => prev + '\n⚠️ Health endpoint not reachable, but that\'s okay');
      }

      // Test if tables exist at all
      setStatus(prev => prev + '\n\n2️⃣ Testing table existence...');
      try {
        const tableResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'application/vnd.pgrst.object+json'
          }
        });
        
        if (tableResponse.ok) {
          setStatus(prev => prev + '\n✅ Database connection established');
        } else {
          const errorText = await tableResponse.text();
          setStatus(prev => prev + `\n❌ Database error: ${tableResponse.status} - ${errorText}`);
        }
      } catch (dbError: any) {
        setStatus(prev => prev + `\n❌ Database connection failed: ${dbError.message}`);
      }

      // Try extremely simple query
      setStatus(prev => prev + '\n\n3️⃣ Testing minimal query...');
      try {
        const minimalPromise = fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const minimalTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Minimal query timeout')), 5000)
        );
        
        const minimalResponse = await Promise.race([minimalPromise, minimalTimeout]) as Response;
        const minimalText = await minimalResponse.text();
        
        if (minimalResponse.ok) {
          setStatus(prev => prev + `\n✅ Minimal query works: ${minimalText}`);
        } else {
          setStatus(prev => prev + `\n❌ Minimal query failed: ${minimalResponse.status} - ${minimalText}`);
          
          // Check if it's an RLS issue
          if (minimalText.includes('RLS') || minimalText.includes('policy')) {
            setStatus(prev => prev + '\n🔒 Detected RLS policy issue - this is likely the root cause!');
            setStatus(prev => prev + '\n📋 Solution: Update RLS policies or disable temporarily for testing');
          }
        }
        
      } catch (minimalError: any) {
        setStatus(prev => prev + `\n❌ Minimal query error: ${minimalError.message}`);
      }

      setStatus(prev => prev + '\n\n🏁 Schema test complete!');
      
    } catch (error: any) {
      setStatus(prev => prev + `\n💥 Schema test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
      <h2 className="text-xl font-bold mb-4 text-blue-800">🔍 Advanced Supabase Debug Center</h2>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testAdvancedDebug}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Advanced Debug'}
          </button>

          <button
            onClick={testSimplifiedSchema}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Schema & RLS'}
          </button>

          <button
            onClick={clearStorageAndTest}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Clear Storage & Debug'}
          </button>
          
          <button
            onClick={() => window.open('https://supabase.com/dashboard/project/koeoqfcxstsqmxphqxmh/editor', '_blank')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Open Supabase Dashboard
          </button>

          <button
            onClick={testAuthTokenBypass}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth Token Bypass'}
          </button>

          <button
            onClick={testSingleClientInstance}
            disabled={loading}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Single Client Instance'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded max-h-96 overflow-y-auto border">
          <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-800">🎯 Debugging Strategy:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>🔍 <strong>Advanced Debug</strong>: Raw HTTP → JS Client → Auth → Profiles</li>
          <li>🔒 <strong>Schema & RLS</strong>: Tests table existence and RLS policy issues</li>
          <li>🧹 <strong>Clear Storage</strong>: Eliminates browser storage conflicts</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
        <h3 className="font-semibold mb-2 text-red-800">🚨 Current Issue: JS Client Hangs When Authenticated</h3>
        <div className="text-sm text-red-700 space-y-2">
          <p><strong>Confirmed:</strong> Raw HTTP works, but Supabase JS client times out when user is signed in.</p>
          <p><strong>Next Steps:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Test without authentication headers</li>
            <li>• Check if the issue is with auth token format</li>
            <li>• Try bypassing RLS completely</li>
            <li>• Test with a fresh Supabase client instance</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-semibold mb-2 text-yellow-800">⚠️ Possible Causes:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Supabase JS client auth token handling issue</li>
          <li>• RLS policies still causing infinite loops</li>
          <li>• Auth session corruption</li>
          <li>• Client configuration conflict</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTest;