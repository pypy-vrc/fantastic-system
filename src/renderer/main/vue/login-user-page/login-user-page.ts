import { computed, reactive } from "vue";
import {
  ApiStatusCode,
  ApiTwoFactorAuthType,
  changePassword,
  isLoggedIn,
  login,
  loginUser,
  logout,
  permissionMap,
  sendPasswordRecoveryLink,
  verifyTwoFactorAuthCode,
} from "../../game/api/index.ts";
import { decrementLoading, incrementLoading } from "../loading.ts";

const loginForm = reactive({
  username: "",
  password: "",
});

const twoFactorAuthForm = reactive({
  type: ApiTwoFactorAuthType.TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION,
  code: "",
});

const recoverPasswordForm = reactive({
  email: "",
});

const changePasswordForm = reactive({
  password: "",
  currentPassword: "",
});

const permissionListRef = computed(() => {
  // console.log('computed permissionList');
  const permissions = [...permissionMap.values()];
  permissions.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return permissions;
});

async function submitLogin() {
  incrementLoading();

  try {
    const { username, password } = loginForm;
    loginForm.password = "";
    await login(username, password);
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

async function submitLogout() {
  incrementLoading();

  try {
    await logout();
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

async function submitTwoFactorAuth() {
  incrementLoading();

  try {
    const { type, code } = twoFactorAuthForm;
    twoFactorAuthForm.code = "";

    await verifyTwoFactorAuthCode(type, code);
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

async function submitRecoverPassword() {
  incrementLoading();

  try {
    const { email } = recoverPasswordForm;

    await sendPasswordRecoveryLink(email);
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

async function doChangePassword() {
  incrementLoading();

  try {
    const { currentPassword, password } = changePasswordForm;
    changePasswordForm.currentPassword = "";
    changePasswordForm.password = "";

    const { status } = await changePassword(password, currentPassword);
    if (status === ApiStatusCode.OK) {
      // ElNotification({
      //     message: 'Password changed',
      //     type: 'success'
      // });
    }
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

export default {
  name: "LoginUserPage",
  setup() {
    return {
      isLoggedIn: isLoggedIn,
      loginUser: loginUser,
      loginForm,
      twoFactorAuthForm,
      recoverPasswordForm,
      changePasswordForm,
      permissionList: permissionListRef,
      submitLogin,
      submitLogout,
      submitTwoFactorAuth,
      submitRecoverPassword,
      changePassword: doChangePassword,
    };
  },
};
