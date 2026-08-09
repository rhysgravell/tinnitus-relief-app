import { Tabs } from 'expo-router';
import { FavouritesProvider } from '../../context/FavouritesContext';
import { TABS, TabBar } from '../../components/TabBar';

export default function TabLayout() {
  return (
    <FavouritesProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        {/* Registered from the manifest so the navigator and the bar cannot drift apart. */}
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
        ))}
      </Tabs>
    </FavouritesProvider>
  );
}
