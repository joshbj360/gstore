<template>
  <div id="AuthPage" class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="w-full flex items-center justify-center p-5 border-b border-gray-200 bg-white">
      <NuxtLink to="/" class="min-w-[170px]">
        <img width="170" src="~/assets/images/grandeur-logo.png" alt="Grandeur Logo" loading="lazy" class="h-10 w-auto" />
      </NuxtLink>
    </header>
    <!-- Auth Form -->
    <main class="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <div class="max-w-md w-full bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
        <h2 class="text-center text-2xl sm:text-3xl font-bold text-gray-800">
          {{ isRegister ? 'Create Your Account' : 'Sign In' }}
        </h2>
        <div v-if="error" class="text-[#C42B78] text-sm text-center bg-[#f8f0f0] p-3 rounded-lg">
          {{ error }}
        </div>
        <!-- Email/Password Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <TextInput
            v-model:input="email"
            placeholder="Email address"
            inputType="email"
            label="Email"
            :error="errors.email"
            @input="clearError('email')"
            aria-required="true"
          />
          <TextInput
            v-model:input="password"
            placeholder="Password"
            inputType="password"
            label="Password"
            :error="errors.password"
            @input="clearError('password')"
            aria-required="true"
          />
          <TextInput
            v-if="isRegister"
            v-model:input="confirmPassword"
            placeholder="Confirm Password"
            inputType="password"
            label="Confirm Password"
            :error="errors.confirmPassword"
            @input="clearError('confirmPassword')"
            aria-required="true"
          />
          <button
            type="submit"
            class="w-full py-2.5 px-4 text-white bg-[#C42B78] rounded-lg hover:bg-[#d81b36] transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50 disabled:bg-gray-400 disabled:cursor-not-allowed"
            :disabled="loading"
            aria-label="Submit form"
          >
            {{ loading ? 'Processing...' : isRegister ? 'Sign Up' : 'Sign In' }}
          </button>
        </form>
        <!-- Social Login -->
        <div class="space-y-3">
          <button
            @click="socialLogin('google')"
            :disabled="loading"
            class="flex items-center justify-center gap-3 p-2.5 w-full border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-250 text-base font-medium disabled:bg-gray-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
            aria-label="Sign in with Google"
          >
            <img class="w-6 h-6" src="~/assets/images/google-logo.png" alt="Google Logo" loading="lazy" />
            <span>Continue with Google</span>
          </button>
          <button
            @click="socialLogin('github')"
            :disabled="loading"
            class="flex items-center justify-center gap-3 p-2.5 w-full border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-250 text-base font-medium disabled:bg-gray-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
            aria-label="Sign in with GitHub"
          >
            <img class="w-6 h-6" src="~/assets/images/github-logo.png" alt="GitHub Logo" loading="lazy" />
            <span>Continue with GitHub</span>
          </button>
        </div>
        <!-- Toggle Login/Register -->
        <p class="text-center text-sm text-gray-600">
          {{ isRegister ? 'Already have an account?' : 'Need an account?' }}
          <button
            @click="toggleRegister"
            class="text-[#C42B78] hover:underline focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
            aria-label="Toggle between sign in and sign up"
          >
            {{ isRegister ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useUserStore } from '~/stores/user.store';
import { useRouter } from 'vue-router';
import TextInput from '~/components/shared/TextInput.vue';
import type { Database } from '@/types/supabase';

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const userStore = useUserStore();
const router = useRouter();

const isRegister = ref(false);
const isSocialLogin = ref(false);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const errors = ref({
  email: '',
  password: '',
  confirmPassword: '',
});

const handleSubmit = async () => {
  isRegister.value ? await register() : await login();
};

const toggleRegister = () => {
  isRegister.value = !isRegister.value;
  isSocialLogin.value = false;
  clearErrors();
  error.value = '';
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
};

const login = async () => {
  clearErrors();
  if (!email.value) errors.value.email = 'Email is required';
  if (!password.value) errors.value.password = 'Password is required';
  if (errors.value.email || errors.value.password) return;

  loading.value = true;
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (authError) throw authError;

    const profileSuccess = await userStore.fetchUserAndProfile();
    if (profileSuccess && userStore.isLoggedIn) {
      router.push(userStore.isSeller ? '/seller/dashboard' : '/');
    } else {
      router.push('/')
      error.value = userStore.error || 'Failed to initialize user profile';
    }
  } catch (err: any) {
    error.value = err.message || 'Invalid email or password';
  } finally {
    loading.value = false;
  }
};

const register = async () => {
  clearErrors();
  if (!email.value) errors.value.email = 'Email is required';
  if (!password.value) errors.value.password = 'Password is required';
  if (password.value !== confirmPassword.value) errors.value.confirmPassword = 'Passwords do not match';
  if (errors.value.email || errors.value.password || errors.value.confirmPassword) return;

  loading.value = true;
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { email: email.value, role: 'client' },
      },
    });
    if (authError) throw authError;

    if (data.user && !data.user.confirmed_at) {
      error.value = 'Registration successful. Please check your email to confirm your account.';
      return;
    }

    const profileSuccess = await userStore.fetchUserAndProfile();
    if (profileSuccess && userStore.isLoggedIn) {
      router.push('/');
    } else {
      error.value = userStore.error || 'Failed to initialize user profile';
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to register. Please try again.';
  } finally {
    loading.value = false;
  }
};

const socialLogin = async (provider: 'google' | 'github') => {
  isSocialLogin.value = true;
  loading.value = true;
  error.value = '';
  try {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) throw authError;
  } catch (err: any) {
    error.value = err.message || `Failed to authenticate with ${provider}`;
  } finally {
    loading.value = false;
    isSocialLogin.value = false;
  }
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
};

const clearErrors = () => {
  errors.value = { email: '', password: '', confirmPassword: '' };
};
</script>

<style scoped>
button:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}
</style>