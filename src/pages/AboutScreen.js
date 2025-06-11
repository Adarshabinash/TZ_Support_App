import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

const AboutScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>About Screen</Text>
      <Button
        title="Go to Contact"
        onPress={() => navigation.navigate('Contact')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  heading: {fontSize: 24, marginBottom: 20},
});

export default AboutScreen;
