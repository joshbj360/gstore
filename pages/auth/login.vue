<template>
  <div id="AuthPage" class="min-h-screen bg-gray-100 flex flex-col">
    <header class="w-full flex items-center justify-center p-5 border-b border-gray-200 bg-white">
      <NuxtLink to="/">
        <img width="170" src="~/assets/images/grandeur-logo.png" alt="Grandeur Logo" class="h-10 w-auto" />
      </NuxtLink>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6">
        <h2 class="text-center text-2xl sm:text-3xl font-bold text-gray-800">
          {{ isRegister ? 'Create Your Account' : 'Welcome Back' }}
        </h2>
        
        <p v-if="authMessage" class="text-center text-sm p-3 rounded-lg" :class="isError_ ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
          {{ authMessage }}
        </p>

        <!-- Email/Password Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <TextInput v-model:input="form.email" placeholder="Email address" inputType="email" label="Email" :error="errors.email" />
          <TextInput v-model:input="form.password" placeholder="Password" inputType="password" label="Password" :error="errors.password" />
          
          <transition enter-active-class="transition-all duration-300 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 -translate-y-2" leave-to-class="opacity-0 -translate-y-2">
            <TextInput v-if="isRegister" v-model:input="form.confirmPassword" placeholder="Confirm Password" inputType="password" label="Confirm Password" :error="errors.confirmPassword" />
          </transition>
          
          <button type="submit" class="w-full py-3 px-4 text-white bg-[#f02c56] rounded-lg font-semibold hover:bg-[#d81b36] transition-all disabled:bg-gray-400" :disabled="userStore.isLoading">
            {{ userStore.isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In' }}
          </button>
        </form>

        <!-- Separator -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300" /></div>
          <div class="relative flex justify-center text-sm"><span class="bg-white px-2 text-gray-500">OR</span></div>
        </div>

        <!-- Social Login -->
        <div class="space-y-3">
          <button @click="userStore.loginWithOAuth('google')" class="social-login-button">
            <img class="w-6 h-6" src="~/assets/images/google-logo.png" alt="Google Logo" />
            <span>Continue with Google</span>
          </button>
          <button @click="userStore.loginWithOAuth('github')" class="social-login-button">
            <img class="w-6 h-6" src="~/assets/images/github-logo.png" alt="GitHub Logo" />
            <span>Continue with GitHub</span>
          </button>
        </div>
        
        <!-- Toggle Login/Register -->
        <p class="text-center text-sm text-gray-600">
          {{ isRegister ? 'Already have an account?' : 'Need an account?' }}
          <button @click="toggleRegister" class="font-semibold text-[#f02c56] hover:underline">
            {{ isRegister ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '~/stores/user.store';
import { useRouter } from 'vue-router';
import TextInput from '~/components/shared/TextInput.vue';

definePageMeta({ layout: false });

const userStore = useUserStore();
const router = useRouter();

const isRegister = ref(false);
const authMessage = ref('');
const isError_ = ref(false);

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
  errors.email = !form.email ? 'Email is required' : '';
  errors.password = !form.password ? 'Password is required' : '';
  if (isRegister.value) {
    errors.confirmPassword = form.password !== form.confirmPassword ? 'Passwords do not match' : '';
  }
  return !errors.email && !errors.password && !errors.confirmPassword;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  authMessage.value = '';
  isError_.value = false;

  let result;
  if (isRegister.value) {
    result = await userStore.registerWithPassword(form.email, form.password);
    if(result.success && result.user?.identities?.length > 0) {
        authMessage.value = 'Registration successful! Please check your email to confirm your account.';
    }
  } else {
    result = await userStore.loginWithPassword(form.email, form.password);
    if(result.success) {
        router.push(userStore.isSeller ? '/seller/dashboard' : '/');
    }
  }

  if (result && result.error) {
      authMessage.value = result.error;
      isError_.value = true;
  }
};

const toggleRegister = () => {
  isRegister.value = !isRegister.value;
  authMessage.value = '';
  isError_.value = false;
  Object.assign(form, { email: '', password: '', confirmPassword: '' });
  Object.assign(errors, { email: '', password: '', confirmPassword: '' });
};
</script>

<style scoped>
.social-login-button {
  @apply flex items-center justify-center gap-3 p-2.5 w-full border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:bg-gray-200 disabled:cursor-not-allowed;
}
</style>
