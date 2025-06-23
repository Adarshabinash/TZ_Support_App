import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import TakeQuiz from '../pages/TakeQuiz';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {View, Text} from 'react-native-animatable';
import {useColorScheme} from 'react-native';

enableScreens();

const Tab = createBottomTabNavigator();

function BottomTabsNavigator() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  const colors = {
    background: isDarkMode ? 'black' : 'lightgrey',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#cccccc' : '#34495e',
    buttonBg: isDarkMode ? '#3498db' : '#2980b9',
    imageButtonBg: isDarkMode ? '#2ecc71' : '#27ae60',
  };

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = '🏠';
          } else if (route.name === 'TakeQuiz') {
            iconName = '📖';
          } else if (route.name === 'Profile') {
            iconName = '🚀';
          }

          return (
            <View>
              <Text style={{fontSize: 23}}>{iconName}</Text>
            </View>
          );
        },
        tabBarStyle: {backgroundColor: colors.background},
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: colors.text,
      })}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="TakeQuiz" component={TakeQuiz} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

export default BottomTabsNavigator;
