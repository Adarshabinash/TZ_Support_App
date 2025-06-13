import React from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';

const ProfilePage = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/img/user.png')}
        style={styles.profileImage}
      />

      <Text style={styles.name}>Adarsh Mishra</Text>
      <Text style={styles.email}>adarsh@example.com</Text>
      <Text style={styles.phone}>+91 98765 43210</Text>

      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6fc',
    padding: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    top: '7%',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
