plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.maasga.admin.mobile_admin"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.maasga.admin.mobile_admin"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
