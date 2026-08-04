import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { FavouritesProvider } from '../../context/FavouritesContext';

export default function TabLayout() {
  return (
    <FavouritesProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { backgroundColor: '#0a1628' },
          tabBarActiveTintColor: '#7eb8f7',
          tabBarInactiveTintColor: '#4a5568',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'musical-notes' : 'musical-notes-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favourites"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sleep"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'moon' : 'moon-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'happy' : 'happy-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </FavouritesProvider>
  );
}
