import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a1628' },
        tabBarActiveTintColor: '#7eb8f7',
        tabBarInactiveTintColor: '#4a5568',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Sounds' }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites' }} />
    </Tabs>
  );
}
