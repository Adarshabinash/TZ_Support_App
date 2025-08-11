import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import TakeQuiz from '../pages/TakeQuiz';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import {useColorScheme, View, Text} from 'react-native';

enableScreens();

const Tab = createBottomTabNavigator();

function BottomTabsNavigator() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',
    card: isDarkMode ? '#1e1e1e' : '#f2f2f2',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    active: isDarkMode ? '#BB86FC' : '#007AFF',
    inactive: isDarkMode ? '#888888' : '#999999',
  };

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Student Register') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Sikhyana Sopana') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={24}
              color={focused ? colors.active : colors.inactive}
            />
          );
        },
        tabBarLabel: ({focused}) => (
          <Text
            style={{
              fontSize: 12,
              color: focused ? colors.active : colors.inactive,
              fontWeight: focused ? '600' : '500',
            }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        headerShown: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
      })}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Student Register" component={TakeQuiz} />
      <Tab.Screen name="Sikhyana Sopana" component={ProfilePage} />
    </Tab.Navigator>
  );
}

export default BottomTabsNavigator;
