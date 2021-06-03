import * as vue from 'vue';
import * as api from '../../game/api';
import * as loading from '../loading';

let loginForm = vue.reactive({
  username: '',
  password: ''
});

let twoFactorAuthForm = vue.reactive({
  type: api.ApiTwoFactorAuthType.TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION,
  code: ''
});

let recoverPasswordForm = vue.reactive({
  email: ''
});

let changePasswordForm = vue.reactive({
  password: '',
  currentPassword: ''
});

let permissionListRef = vue.computed(() => {
  // console.log('computed permissionList');
  return [...api.permissionMap.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
});

async function submitLogin(): Promise<void> {
  loading.increment();

  try {
    let {username, password} = loginForm;
    loginForm.password = '';
    await api.login(username, password);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitLogout(): Promise<void> {
  loading.increment();

  try {
    await api.logout();
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitTwoFactorAuth(): Promise<void> {
  loading.increment();

  try {
    let {type, code} = twoFactorAuthForm;
    twoFactorAuthForm.code = '';

    await api.verifyTwoFactorAuthCode(type, code);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitRecoverPassword(): Promise<void> {
  loading.increment();

  try {
    let {email} = recoverPasswordForm;

    await api.sendPasswordRecoveryLink(email);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function changePassword(): Promise<void> {
  loading.increment();

  try {
    let {currentPassword, password} = changePasswordForm;
    changePasswordForm.currentPassword = '';
    changePasswordForm.password = '';

    let {status} = await api.changePassword(password, currentPassword);
    if (status === api.ApiStatusCode.OK) {
      // ElNotification({
      //     message: 'Password changed',
      //     type: 'success'
      // });
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

export default {
  name: 'LoginUserPage',
  setup(): any {
    return {
      isLoggedIn: api.isLoggedIn,
      loginUser: api.loginUser,
      loginForm,
      twoFactorAuthForm,
      recoverPasswordForm,
      changePasswordForm,
      permissionList: permissionListRef,
      submitLogin,
      submitLogout,
      submitTwoFactorAuth,
      submitRecoverPassword,
      changePassword
    };
  }
};
