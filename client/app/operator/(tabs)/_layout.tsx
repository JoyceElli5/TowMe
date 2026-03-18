import { Tabs } from "expo-router";
import React from "react";

import { OperatorFloatingTabBar } from "@/components/operator-floating-tab-bar";

export default function OperatorTabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <OperatorFloatingTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="available-jobs" options={{ title: "Available" }} />
      <Tabs.Screen name="jobs" options={{ title: "My Jobs" }} />
      <Tabs.Screen name="earnings" options={{ title: "Earnings" }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
