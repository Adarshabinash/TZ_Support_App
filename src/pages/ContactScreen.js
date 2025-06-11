import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

const ContactScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contact Screen</Text>
      <Button
        title="Back to Home"
        onPress={() => navigation.navigate('Home')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  heading: {fontSize: 24, marginBottom: 20},
});

export default ContactScreen;
