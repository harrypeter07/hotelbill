# React Native / Expo
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class expo.modules.** { *; }

# Keep native methods
-keepclassmembers class * { native <methods>; }

# RN bridge
-keep class com.facebook.react.bridge.** { *; }

