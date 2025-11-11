<template>
  <div class="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4 py-4">
    <div class="w-full max-w-6xl flex overflow-hidden bg-white dark:bg-neutral-900 shadow-2xl rounded-3xl max-h-[90vh]">
      <!-- Left Section: Form -->
      <div class="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-14 overflow-auto">
        <!-- Brand -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
            <Icon name="mdi:store-fashion" class="w-6 h-6 text-white" />
          </div>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ config.public.siteName }}</span>
        </div>

        <!-- Title -->
        <div class="mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ isRegister ? 'Create your account' : 'Welcome back' }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {{ isRegister ? 'Join the style community today' : 'Sign in to continue your journey' }}
          </p>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <input
              v-model="form.email"
              type="email"
              placeholder="Email address"
              @keydown.enter="handleSubmit"
              :class="[
                'w-full px-4 py-3 rounded-xl border bg-transparent placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm',
                errors.email 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white'
              ]"
            />
            <p v-if="errors.email" class="mt-1.5 text-sm text-red-600 dark:text-red-400">{{ errors.email }}</p>
          </div>

          <div>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                @keydown.enter="handleSubmit"
                :class="[
                  'w-full px-4 py-3 pr-12 rounded-xl border bg-transparent placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm',
                  errors.password 
                    ? 'border-red-300 dark:border-red-700' 
                    : 'border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white'
                ]"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1.5 text-sm text-red-600 dark:text-red-400">{{ errors.password }}</p>
          </div>

          <div v-if="isRegister">
            <div class="relative">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm password"
                @keydown.enter="handleSubmit"
                :class="[
                  'w-full px-4 py-3 pr-12 rounded-xl border bg-transparent placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm',
                  errors.confirmPassword 
                    ? 'border-red-300 dark:border-red-700' 
                    : 'border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white'
                ]"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Icon :name="showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1.5 text-sm text-red-600 dark:text-red-400">{{ errors.confirmPassword }}</p>
          </div>

          <div v-if="!isRegister" class="flex justify-end">
            <button
              type="button"
              class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <!-- Submit -->
          <button
            @click="handleSubmit"
            :disabled="isLoading"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Processing...
            </span>
            <span v-else>{{ isRegister ? 'Create Account' : 'Sign In' }}</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center my-6">
          <div class="flex-grow border-t border-gray-200 dark:border-neutral-700"></div>
          <span class="px-4 text-sm text-gray-400">or</span>
          <div class="flex-grow border-t border-gray-200 dark:border-neutral-700"></div>
        </div>

        <!-- Social Login -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="handleOAuthLogin('google')"
            :disabled="isLoading"
            class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 text-sm"
          >
            <Icon name="mdi:google" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span class="font-medium text-gray-700 dark:text-gray-300">Google</span>
          </button>

          <button
            @click="handleOAuthLogin('facebook')"
            :disabled="isLoading"
            class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 text-sm"
          >
            <Icon name="mdi:facebook" class="w-4 h-4 text-[#1877F2]" />
            <span class="font-medium text-gray-700 dark:text-gray-300">Facebook</span>
          </button>
        </div>

        <!-- Toggle -->
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="toggleMode"
            class="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 ml-1 transition-colors"
          >
            {{ isRegister ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>

      <!-- Right Section: Visual Branding -->
      <div class="hidden lg:flex w-1/2 relative overflow-hidden">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
            alt="Fashion"
            class="w-full h-full object-cover"
          />
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-purple-800/85 to-pink-800/90"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col items-center justify-center p-8 text-white text-center ">
          <div class="max-w-xs space-y-4">
            <!-- Main Heading -->
            <div class="space-y-3">
              <div class="inline-block">
                <div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <Icon name="mdi:hanger" class="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 class="text-2xl font-bold leading-tight">
                Discover Your Perfect Style
              </h2>
              <p class="text-sm text-white/90 leading-relaxed">
                Shop from curated collections, connect with sellers worldwide, and express your unique fashion sense.
              </p>
            </div>

            <!-- Feature Icons -->
            <div class="flex justify-center gap-3 pt-6">
              <div class="group">
                <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all group-hover:bg-white/30 group-hover:scale-110">
                  <Icon name="mdi:palette" class="w-5 h-5 text-white" />
                </div>
                <p class="text-xs mt-1 text-white/80">Curated</p>
              </div>
              <div class="group">
                <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all group-hover:bg-white/30 group-hover:scale-110">
                  <Icon name="mdi:account-group" class="w-5 h-5 text-white" />
                </div>
                <p class="text-xs mt-1 text-white/80">Community</p>
              </div>
              <div class="group">
                <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all group-hover:bg-white/30 group-hover:scale-110">
                  <Icon name="mdi:cart" class="w-5 h-5 text-white" />
                </div>
                <p class="text-xs mt-1 text-white/80">Seamless</p>
              </div>
            </div>
          </div>

          <!-- Bottom Stats -->
          <div class="absolute bottom-6 left-0 right-0 px-8">
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg py-2 px-1">
                <div class="text-lg font-bold">500+</div>
                <div class="text-xs text-white/80">Sellers</div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-lg py-2 px-1">
                <div class="text-lg font-bold">50K+</div>
                <div class="text-xs text-white/80">Products</div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-lg py-2 px-1">
                <div class="text-lg font-bold">100K+</div>
                <div class="text-xs text-white/80">Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useUserStore } from '~/stores/user.store';
import { useRouter } from 'vue-router';
import { notify } from '@kyvg/vue3-notification';

definePageMeta({ layout: false });

const config = useRuntimeConfig();

const router = useRouter();
const userStore = useUserStore();

const isRegister = ref(false);
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const validateForm = () => {
  errors.email = !form.email || !/^\S+@\S+\.\S+$/.test(form.email) ? 'Valid email is required' : '';
  errors.password = !form.password || form.password.length < 6 ? 'Password must be at least 6 characters' : '';
  if (isRegister.value) {
    errors.confirmPassword = form.password !== form.confirmPassword ? 'Passwords do not match' : '';
  }
  return !errors.email && !errors.password && !errors.confirmPassword;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    let result;
    if (isRegister.value) {
      result = await userStore.registerWithPassword(form.email, form.password);
      if (result.success) {
        notify({ type: 'success', text: 'Account created successfully!' });
      }
    } else {
      result = await userStore.loginWithPassword(form.email, form.password);
      if (result.success) {
        router.push(userStore.isSeller ? '/seller/dashboard' : '/');
      }
    }
    if (result.error) {
      notify({ type: 'error', text: result.error });
    }
  } catch (err) {
    notify({ type: 'error', text: 'An error occurred. Please try again.' });
  } finally {
    isLoading.value = false;
  }
};

const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
  try {
    await userStore.loginWithOAuth(provider);
  } catch (err) {
    notify({ type: 'error', text: `Failed to login with ${provider}` });
  }
};

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  Object.assign(form, { email: '', password: '', confirmPassword: '' });
  Object.assign(errors, { email: '', password: '', confirmPassword: '' });
  showPassword.value = false;
  showConfirmPassword.value = false;
};
</script>