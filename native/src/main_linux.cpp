#include <stdio.h>
#include "napi.h"

Napi::Value getRunningApp(const Napi::CallbackInfo &info)
{
    auto env = info.Env();
    auto obj = Napi::Object::New(env);

    obj.Set(
        "vrchat",
        Napi::Boolean::New(
            env,
            false));

    obj.Set(
        "steamvr",
        Napi::Boolean::New(
            env,
            false));

    return obj;
}

Napi::Value playGame(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    return Napi::Boolean::New(env, false);
}

Napi::Value startOverlay(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    return Napi::Boolean::New(env, false);
}

Napi::Value stopOverlay(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    return env.Undefined();
}

Napi::Value setOverlayFrameBuffer(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    return env.Undefined();
}

Napi::Value getVRDeviceList(const Napi::CallbackInfo &info)
{
    auto env = info.Env();

    auto arr = Napi::Array::New(env, 0);

    return arr;
}

Napi::Object init(Napi::Env env, Napi::Object exports)
{
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
