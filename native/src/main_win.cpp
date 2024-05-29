#define _XM_NO_INTRINSICS_
#include <windows.h>
#include <DirectXMath.h>
#include <d3d11.h>
#include <openvr/openvr.h>
#include <stdio.h>
#include "napi.h"

// https://docs.microsoft.com/en-us/windows/win32/dxmath/pg-xnamath-migration-d3dx

typedef struct _OVERLAY_DATA
{
    BOOL dirty;
    VOID *data;
} OVERLAY_DATA;

typedef struct _VR_DEVICE_DATA
{
    vr::ETrackedDeviceClass deviceClass;
    bool isConnected;
    bool isCharging;
    float batteryPercentage;
    vr::ETrackedControllerRole controllerRole;
    uint64_t buttonPressedMask;
    uint64_t buttonTouchedMask;
} VR_DEVICE_DATA;

BOOL isOverlayRunning_;
HANDLE overlayThreadHandle_;
ID3D11Device *device_;
ID3D11DeviceContext *immediateContext_;
ID3D11Texture2D *textureHmd_;
ID3D11Texture2D *textureWrist_;
OVERLAY_DATA overlayDataHmd_;
OVERLAY_DATA overlayDataWrist_;
CRITICAL_SECTION vrDeviceLock_;
uint32_t vrDeviceCount_;
VR_DEVICE_DATA vrDeviceData_[vr::k_unMaxTrackedDeviceCount];
VR_DEVICE_DATA vrDeviceDataLocal_[vr::k_unMaxTrackedDeviceCount];
vr::VROverlayHandle_t overlayHandleHmd_ = vr::k_ulOverlayHandleInvalid;
vr::VROverlayHandle_t overlayHandleWrist_ = vr::k_ulOverlayHandleInvalid;

__declspec(noinline) BOOL overlayInit(void)
{
    HRESULT hr;

    hr = D3D11CreateDevice(
        NULL,
        D3D_DRIVER_TYPE_HARDWARE,
        NULL,
        D3D11_CREATE_DEVICE_SINGLETHREADED,
        NULL,
        0,
        D3D11_SDK_VERSION,
        &device_,
        NULL,
        &immediateContext_);
    if (hr != S_OK)
    {
        printf("D3D11CreateDevice(): %08x\n", hr);
        return FALSE;
    }

    D3D11_TEXTURE2D_DESC texDesc;
    texDesc.Width = 512;
    texDesc.Height = 512;
    texDesc.MipLevels = 1;
    texDesc.ArraySize = 1;
    texDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    texDesc.SampleDesc.Count = 1;
    texDesc.SampleDesc.Quality = 0;
    texDesc.Usage = D3D11_USAGE_DEFAULT;
    texDesc.BindFlags = D3D11_BIND_SHADER_RESOURCE;
    texDesc.CPUAccessFlags = 0;
    texDesc.MiscFlags = 0;

    hr = device_->CreateTexture2D(&texDesc, NULL, &textureHmd_);
    if (hr != S_OK)
    {
        printf("CreateTexture2D(): %08x\n", hr);
        return FALSE;
    }

    hr = device_->CreateTexture2D(&texDesc, NULL, &textureWrist_);
    if (hr != S_OK)
    {
        printf("CreateTexture2D(): %08x\n", hr);
        return FALSE;
    }

    return TRUE;
}

__declspec(noinline) void overlayExit(void)
{
    if (textureWrist_ != NULL)
    {
        textureWrist_->Release();
        textureWrist_ = NULL;
    }

    if (textureHmd_ != NULL)
    {
        textureHmd_->Release();
        textureHmd_ = NULL;
    }

    if (immediateContext_ != NULL)
    {
        immediateContext_->Release();
        immediateContext_ = NULL;
    }

    if (device_ != NULL)
    {
        device_->Release();
        device_ = NULL;
    }
}

__declspec(noinline) BOOL overlaySetTexture(
    vr::IVROverlay *pVROverlay,
    vr::VROverlayHandle_t overlayHandle,
    OVERLAY_DATA *overlayData)
{
    BOOL dirty = overlayData->dirty;
    overlayData->dirty = FALSE;

    if (dirty != FALSE)
    {
        immediateContext_->UpdateSubresource(
            textureHmd_,
            0,
            NULL,
            overlayData->data,
            512 * 4,
            0);
    }

    vr::Texture_t texture;
    texture.handle = (void *)textureHmd_;
    texture.eType = vr::ETextureType::TextureType_DirectX;
    texture.eColorSpace = vr::EColorSpace::ColorSpace_Auto;

    auto overlayError = pVROverlay->SetOverlayTexture(
        overlayHandleHmd_,
        &texture);
    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        printf("SetOverlayTexture(): %d\n", overlayError);

        if (dirty != FALSE)
        {
            immediateContext_->Flush();
        }

        return FALSE;
    }

    if (dirty != FALSE)
    {
        immediateContext_->Flush();
    }

    return TRUE;
}

__declspec(noinline) void overlayRenderHmdCleanup(vr::IVROverlay *pVROverlay)
{
    pVROverlay->DestroyOverlay(overlayHandleHmd_);
    overlayHandleHmd_ = vr::k_ulOverlayHandleInvalid;
}

__declspec(noinline) BOOL overlayRenderHmdInit(vr::IVROverlay *pVROverlay)
{
    auto overlayError = pVROverlay->FindOverlay(
        "VRCX_HMD",
        &overlayHandleHmd_);

    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        if (overlayError != vr::EVROverlayError::VROverlayError_UnknownOverlay)
        {
            printf("FindOverlay(): %d\n", overlayError);
            return FALSE;
        }

        overlayError = pVROverlay->CreateOverlay(
            "VRCX_HMD",
            "VRCX_HMD",
            &overlayHandleHmd_);
        if (overlayError != vr::EVROverlayError::VROverlayError_None)
        {
            printf("CreateOverlay(): %d\n", overlayError);
            return FALSE;
        }
    }

    pVROverlay->SetOverlayAlpha(overlayHandleHmd_, 0.9f);

    overlayError = pVROverlay->SetOverlayWidthInMeters(
        overlayHandleHmd_,
        1.0f);
    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        printf("SetOverlayWidthInMeters(): %d\n", overlayError);
        overlayRenderHmdCleanup(pVROverlay);
        return FALSE;
    }

    overlayError = pVROverlay->SetOverlayInputMethod(
        overlayHandleHmd_,
        vr::VROverlayInputMethod::VROverlayInputMethod_None);
    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        printf("SetOverlayInputMethod(): %d\n", overlayError);
        overlayRenderHmdCleanup(pVROverlay);
        return FALSE;
    }

    auto m = DirectX::XMMatrixScaling(1.0f, 1.0f, 1.0f);
    m *= DirectX::XMMatrixTranslation(0.0f, -0.1f, -1.0f);
    vr::HmdMatrix34_t hmdMatrix34 = {
        m._11, m._21, m._31, m._41,
        m._12, m._22, m._32, m._42,
        m._13, m._23, m._33, m._43};

    overlayError = pVROverlay->SetOverlayTransformTrackedDeviceRelative(
        overlayHandleHmd_,
        vr::k_unTrackedDeviceIndex_Hmd,
        &hmdMatrix34);
    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        printf("SetOverlayTransformTrackedDeviceRelative(): %d\n", overlayError);
        overlayRenderHmdCleanup(pVROverlay);
        return FALSE;
    }

    if (overlaySetTexture(
            pVROverlay,
            overlayHandleHmd_,
            &overlayDataHmd_) == FALSE)
    {
        overlayRenderHmdCleanup(pVROverlay);
        return FALSE;
    }

    overlayError = pVROverlay->ShowOverlay(overlayHandleHmd_);
    if (overlayError != vr::EVROverlayError::VROverlayError_None)
    {
        printf("ShowOverlay(): %d\n", overlayError);
        overlayRenderHmdCleanup(pVROverlay);
        return FALSE;
    }

    return TRUE;
}

__declspec(noinline) void overlayRenderHmd(vr::IVROverlay *pVROverlay)
{
    if (overlayHandleHmd_ == vr::k_ulOverlayHandleInvalid)
    {
        overlayRenderHmdInit(pVROverlay);
        return;
    }

    if (overlayDataHmd_.dirty == FALSE)
    {
        return;
    }

    if (overlaySetTexture(
            pVROverlay,
            overlayHandleHmd_,
            &overlayDataHmd_) == FALSE)
    {
        overlayRenderHmdCleanup(pVROverlay);
    }
}

__declspec(noinline) BOOL overlayPollEvent(vr::IVRSystem *pVRSystem)
{
    vr::VREvent_t event;

    while (pVRSystem->PollNextEvent(&event, sizeof(event)) != false)
    {
        printf("VREventType: %d\n", event.eventType);
        if (event.eventType == vr::EVREventType::VREvent_Quit)
        {
            return FALSE;
        }
    }

    return TRUE;
}

__declspec(noinline) void overlayUpdateTrackedDevices(vr::IVRSystem *pVRSystem)
{
    vr::VRControllerState_t state;

    vrDeviceCount_ = 0;

    for (uint32_t devIndex = 0u; devIndex < vr::k_unMaxTrackedDeviceCount; ++devIndex)
    {
        auto devClass = pVRSystem->GetTrackedDeviceClass(devIndex);
        if (devClass == vr::ETrackedDeviceClass::TrackedDeviceClass_Invalid)
        {
            continue;
        }

        auto deviceData = &vrDeviceData_[vrDeviceCount_++];
        deviceData->deviceClass = devClass;

        deviceData->isConnected =
            pVRSystem->IsTrackedDeviceConnected(devIndex);

        deviceData->isCharging =
            pVRSystem->GetBoolTrackedDeviceProperty(
                devIndex,
                vr::ETrackedDeviceProperty::Prop_DeviceIsCharging_Bool);

        deviceData->batteryPercentage =
            pVRSystem->GetFloatTrackedDeviceProperty(
                devIndex,
                vr::ETrackedDeviceProperty::Prop_DeviceBatteryPercentage_Float);

        if (devClass == vr::ETrackedDeviceClass::TrackedDeviceClass_Controller)
        {
            deviceData->controllerRole =
                pVRSystem->GetControllerRoleForTrackedDeviceIndex(devIndex);

            if (pVRSystem->GetControllerState(
                    devIndex,
                    &state,
                    sizeof(state)) == false)
            {
                deviceData->buttonPressedMask = 0;
                deviceData->buttonTouchedMask = 0;
            }
            else
            {
                deviceData->buttonPressedMask = state.ulButtonPressed;
                deviceData->buttonTouchedMask = state.ulButtonTouched;
            }
        }
        else
        {
            deviceData->controllerRole =
                vr::ETrackedControllerRole::TrackedControllerRole_Invalid;
            deviceData->buttonPressedMask = 0;
            deviceData->buttonTouchedMask = 0;
        }
    }
}

__declspec(noinline) void overlayShutdown(void)
{
    auto pVROverlay = vr::VROverlay();
    if (pVROverlay != NULL)
    {
        overlayRenderHmdCleanup(pVROverlay);
    }

    overlayHandleHmd_ = vr::k_ulOverlayHandleInvalid;
    overlayHandleWrist_ = vr::k_ulOverlayHandleInvalid;
    vrDeviceCount_ = 0;

    vr::VR_Shutdown();
}

__declspec(noinline) void overlayLoop(void)
{
    uint32_t renderTick = 0;

    while (isOverlayRunning_ != FALSE)
    {
        auto pVRSystem = vr::VRSystem();
        if (pVRSystem == NULL)
        {
            auto initError = vr::EVRInitError::VRInitError_None;

            pVRSystem = vr::VR_Init(
                &initError,
                vr::EVRApplicationType::VRApplication_Overlay);

            if (initError != vr::EVRInitError::VRInitError_None)
            {
                printf("VR_Init(): %d\n", initError);
                Sleep(5000); // 5s
                continue;
            }
        }

        if (overlayPollEvent(pVRSystem) == FALSE)
        {
            printf("overlayPollEvent FALSE\n");
            overlayShutdown();
            Sleep(10000); // 10s
            continue;
        }

        if (TryEnterCriticalSection(&vrDeviceLock_) != FALSE)
        {
            overlayUpdateTrackedDevices(pVRSystem);
            LeaveCriticalSection(&vrDeviceLock_);
        }

        if (renderTick == 0)
        {
            renderTick = 5; // 20fps

            auto pVROverlay = vr::VROverlay();
            if (pVROverlay != NULL)
            {
                overlayRenderHmd(pVROverlay);
            }
        }
        else
        {
            --renderTick;
        }

        Sleep(10); // 0.01s
    }

    overlayShutdown();
}

DWORD __stdcall overlayThreadRoutine(void *args)
{
    printf("overlay init\n");

    if (overlayInit() != FALSE)
    {
        overlayLoop();
        overlayExit();
    }

    printf("overlay shutdown\n");

    CloseHandle(overlayThreadHandle_);
    overlayThreadHandle_ = NULL;

    return 0;
}

Napi::Value getRunningApp(const Napi::CallbackInfo &info)
{
    auto env = info.Env();
    auto obj = Napi::Object::New(env);

    obj.Set(
        "vrchat",
        Napi::Boolean::New(
            env,
            FindWindowW(
                L"UnityWndClass",
                L"VRChat") != NULL));

    obj.Set(
        "steamvr",
        Napi::Boolean::New(
            env,
            FindWindowW(
                L"Qt5QWindowIcon",
                L"SteamVR Status") != NULL));

    return obj;
}

Napi::Value playGame(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    wchar_t steamExe[256];
    *steamExe = 0;

    HKEY hkey;
    if (RegOpenKeyExW(
            HKEY_CLASSES_ROOT,
            L"steam\\shell\\open\\command",
            0,
            KEY_READ,
            &hkey) == ERROR_SUCCESS)
    {
        DWORD cb = sizeof(steamExe);
        RegQueryValueExW(hkey, NULL, NULL, NULL, (BYTE *)steamExe, &cb);
        RegCloseKey(hkey);
    }

    // "C:\Program Files (x86)\Steam\steam.exe" -- "%1"
    auto ptr = wcsstr(steamExe, L".exe\"");
    if (ptr == NULL)
    {
        return Napi::Boolean::New(env, false);
    }

    ptr[5] = 0; // cut the rest

    auto arg0 = info[0];
    if (arg0.IsString() == false)
    {
        return Napi::Boolean::New(env, false);
    }
    auto launchOption = arg0.ToString().Utf16Value(); // pin to stack

    wchar_t command[1024]; // wsprint() has limit to 1024 bytes
    wsprintfW(
        command,
        L"%s -applaunch 438100 -- %s",
        steamExe,
        launchOption.data());

    PROCESS_INFORMATION processInfo;
    STARTUPINFOW startupInfo;
    memset(&startupInfo, 0, sizeof(startupInfo));
    startupInfo.cb = sizeof(startupInfo);

    if (CreateProcessW(
            NULL,
            command,
            NULL,
            NULL,
            FALSE,
            0,
            NULL,
            NULL,
            &startupInfo,
            &processInfo) == FALSE)
    {
        return Napi::Boolean::New(env, false);
    }

    CloseHandle(processInfo.hProcess);
    CloseHandle(processInfo.hThread);

    return Napi::Boolean::New(env, true);
}

Napi::Value startOverlay(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    if (overlayThreadHandle_ == NULL)
    {
        isOverlayRunning_ = TRUE;
        overlayThreadHandle_ = CreateThread(
            NULL,
            0,
            overlayThreadRoutine,
            NULL,
            0,
            NULL);
    }

    return Napi::Boolean::New(env, overlayThreadHandle_ != NULL);
}

Napi::Value stopOverlay(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    isOverlayRunning_ = FALSE;

    return env.Undefined();
}

__declspec(noinline) void copyFrameBuffer(
    uint8_t *target,
    uint8_t *source,
    int32_t x,
    uint32_t y,
    uint32_t width,
    uint32_t height)
{
    // printf("copyFrameBuffer: origin=(%u,%u) size=(%u,%u)\n", x, y, width, height);
    // copyFrameBuffer: origin=(0,0) size=(512,512)
    // copyFrameBuffer: origin=(0,106) size=(512,406)

    source += (y * 512 + x) * 4;
    target += (y * 512 + x) * 4;

    if (x == 0 && width == 512)
    {
        memcpy(target, source, height * 512 * 4);
    }
    else
    {
        uint32_t xs = width * 4;
        for (uint32_t ys = height; ys != 0; --ys)
        {
            memcpy(target, source, xs);
            source += 512 * 4;
            target += 512 * 4;
        }
    }
}

Napi::Value setOverlayFrameBuffer(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    if (info.Length() != 6)
    {
        return env.Undefined();
    }

    auto x = info[1].ToNumber().Uint32Value();
    auto y = info[2].ToNumber().Uint32Value();
    auto width = info[3].ToNumber().Uint32Value();
    auto height = info[4].ToNumber().Uint32Value();

    // sanity check
    if (x >= 512 || y >= 512 ||
        width == 0 || width > 512 ||
        height == 0 || height > 512 ||
        x + width > 512 || y + height > 512)
    {
        return env.Undefined();
    }

    auto arg5 = info[5];
    if (arg5.IsTypedArray() == false)
    {
        return env.Undefined();
    }

    auto data = arg5.As<Napi::Uint8Array>();
    if (data.ByteLength() != 512 * 512 * 4)
    {
        return env.Undefined();
    }

    auto id = info[0].ToNumber().Uint32Value();
    if (id == 0)
    {
        copyFrameBuffer(
            (uint8_t *)overlayDataHmd_.data,
            data.Data(),
            x,
            y,
            width,
            height);
        overlayDataHmd_.dirty = TRUE;
    }
    else if (id == 1)
    {
        copyFrameBuffer(
            (uint8_t *)overlayDataWrist_.data,
            data.Data(),
            x,
            y,
            width,
            height);
        overlayDataWrist_.dirty = TRUE;
    }

    return env.Undefined();
}

Napi::Value getVRDeviceList(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    EnterCriticalSection(&vrDeviceLock_);

    auto count = vrDeviceCount_;
    memcpy(vrDeviceDataLocal_, vrDeviceData_, sizeof(VR_DEVICE_DATA) * count);

    LeaveCriticalSection(&vrDeviceLock_);

    auto arr = Napi::Array::New(env, count);

    for (uint32_t i = 0; i < count; ++i)
    {
        auto deviceData = &vrDeviceDataLocal_[i];
        auto obj = Napi::Object::New(env);

        obj.Set(
            "deviceClass",
            Napi::Number::New(
                env,
                deviceData->deviceClass));

        obj.Set(
            "isConnected",
            Napi::Boolean::New(
                env,
                deviceData->isConnected));

        obj.Set(
            "isCharging",
            Napi::Boolean::New(
                env,
                deviceData->isCharging));

        obj.Set(
            "batteryPercentage",
            Napi::Number::New(
                env,
                deviceData->batteryPercentage));

        obj.Set(
            "controllerRole",
            Napi::Number::New(
                env,
                deviceData->controllerRole));

        obj.Set(
            "buttonPressedMask",
            Napi::Number::New(
                env,
                deviceData->buttonPressedMask));

        obj.Set(
            "buttonTouchedMask",
            Napi::Number::New(
                env,
                deviceData->buttonTouchedMask));

        arr.Set(i, obj);
    }

    return arr;
}

Napi::Object init(Napi::Env env, Napi::Object exports)
{
    if (InitializeCriticalSectionAndSpinCount(&vrDeviceLock_, 4000) == FALSE)
    {
        throw Napi::Error::New(env, "out of memory");
    }

    overlayDataHmd_.data = VirtualAlloc(
        NULL,
        512 * 512 * 4,
        MEM_COMMIT,
        PAGE_READWRITE);

    if (overlayDataHmd_.data == NULL)
    {
        throw Napi::Error::New(env, "out of memory");
    }

    overlayDataWrist_.data = VirtualAlloc(
        NULL,
        512 * 512 * 4,
        MEM_COMMIT,
        PAGE_READWRITE);

    if (overlayDataWrist_.data == NULL)
    {
        throw Napi::Error::New(env, "out of memory");
    }

    exports.Set(
        "getRunningApp",
        Napi::Function::New(env, getRunningApp));

    exports.Set(
        "playGame",
        Napi::Function::New(env, playGame));

    exports.Set(
        "startOverlay",
        Napi::Function::New(env, startOverlay));

    exports.Set(
        "stopOverlay",
        Napi::Function::New(env, stopOverlay));

    exports.Set(
        "setOverlayFrameBuffer",
        Napi::Function::New(env, setOverlayFrameBuffer));

    exports.Set(
        "getVRDeviceList",
        Napi::Function::New(env, getVRDeviceList));

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init);
