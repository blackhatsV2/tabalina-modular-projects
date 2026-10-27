import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ph.tabalina.budget",
  appName: "Budget Buddy",
  webDir: "dist",
  android: { allowMixedContent: false },
  plugins: {
    LocalNotifications: { smallIcon: "ic_stat_icon", iconColor: "#1F3864" },
  },
};

export default config;
