import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/context/AuthContext';
import { Colors, Typography } from '@/theme';

import LoginScreen           from '@/screens/auth/LoginScreen';
import HubDashboard          from '@/screens/hub/HubDashboard';
import ScanReceiveScreen     from '@/screens/hub/ScanReceiveScreen';
import QCScreen              from '@/screens/hub/QCScreen';
import WastageEntryScreen    from '@/screens/hub/WastageEntryScreen';
import DriverDashboard       from '@/screens/driver/DriverDashboard';
import ScanDispatchScreen    from '@/screens/driver/ScanDispatchScreen';
import DeliveryConfirmScreen from '@/screens/driver/DeliveryConfirmScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Hub Tab Navigator ─────────────────────────────────────
function HubTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            'Dashboard':      focused ? 'grid' : 'grid-outline',
            'Scan & Receive': focused ? 'qr-code' : 'qr-code-outline',
            'Wastage':        focused ? 'warning' : 'warning-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: Typography.fontWeights.semibold,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard"      component={HubDashboard} />
      <Tab.Screen name="Scan & Receive" component={ScanReceiveScreen} />
      <Tab.Screen name="Wastage"        component={WastageEntryScreen} />
    </Tab.Navigator>
  );
}

function HubStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HubTabs" component={HubTabs} />
      <Stack.Screen
        name="QC"
        component={QCScreen}
        options={{
          headerShown: true,
          title: 'QC Check',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: Typography.fontWeights.bold },
        }}
      />
    </Stack.Navigator>
  );
}

// ── Driver Tab Navigator ──────────────────────────────────
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            'My Route':  focused ? 'map' : 'map-outline',
            'Scan Pack': focused ? 'barcode' : 'barcode-outline',
            'Deliver':   focused ? 'checkmark-circle' : 'checkmark-circle-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor:   Colors.driver,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: Typography.fontWeights.semibold,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="My Route"  component={DriverDashboard} />
      <Tab.Screen name="Scan Pack" component={ScanDispatchScreen} />
      <Tab.Screen name="Deliver"   component={DeliveryConfirmScreen} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────
export default function AppNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <LinearGradient colors={['#1A5240', '#2D7A5F']} style={styles.splash}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
        <Text style={styles.splashText}>Farmers Factory</Text>
        <Text style={styles.splashSub}>Loading…</Text>
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login"      component={LoginScreen} />
        ) : profile?.role === 'driver' ? (
          <Stack.Screen name="DriverRoot" component={DriverTabs} />
        ) : (
          <Stack.Screen name="HubRoot"    component={HubStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  splashText: {
    color: '#fff',
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.black,
    letterSpacing: 0.5,
    marginTop: 16,
  },
  splashSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: Typography.fontSizes.sm,
  },
});
