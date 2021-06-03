import * as vue from "vue";
import * as api from "../../game/api";
import * as loading from "../loading";

const loginForm = vue.reactive({
  username: "",
  password: "",
});

const twoFactorAuthForm = vue.reactive({
  type: api.ApiTwoFactorAuthType.TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION,
  code: "",
});

const recoverPasswordForm = vue.reactive({
  email: "",
});

const changePasswordForm = vue.reactive({
  password: "",
  currentPassword: "",
});

const permissionListRef = vue.computed(() => {
  // console.log('computed permissionList');
  return [...api.permissionMap.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
});

async function submitLogin() {
  loading.increment();

  try {
    const { username, password } = loginForm;
    loginForm.password = "";
    await api.login(username, password);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitLogout() {
  loading.increment();

  try {
    await api.logout();
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitTwoFactorAuth() {
  loading.increment();

  try {
    const { type, code } = twoFactorAuthForm;
    twoFactorAuthForm.code = "";

    await api.verifyTwoFactorAuthCode(type, code);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function submitRecoverPassword() {
  loading.increment();

  try {
    const { email } = recoverPasswordForm;

    await api.sendPasswordRecoveryLink(email);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function changePassword() {
  loading.increment();

  try {
    const { currentPassword, password } = changePasswordForm;
    changePasswordForm.currentPassword = "";
    changePasswordForm.password = "";

    const { status } = await api.changePassword(password, currentPassword);
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
  name: "LoginUserPage",
  setup() {
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
      changePassword,
    };
  },
};
