import { Tabs } from 'expo-router';
import { TABS, TabBar } from '../../components/TabBar';

export default function TabLayout() {
  return (
    // No provider here: per-sound state, saved included, is provided at the root so the
    // session modal shares it with the tabs.
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      {/* Registered from the manifest so the navigator and the bar cannot drift apart. */}
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
