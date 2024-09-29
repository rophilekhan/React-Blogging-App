import React from 'react';
import { Typography, Avatar, Grid } from '@mui/material';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Grid container spacing={2} className="p-4">
      <Grid item xs={12} sm={4} md={3} lg={2}>
        <Avatar src={user.photoURL} alt={user.displayName} className="w-48 h-48" />
      </Grid>
      <Grid item xs={12} sm={8} md={9} lg={10}>
        <Typography variant="h3" className="mb-2">
          {user.displayName}
        </Typography>
        <Typography variant="body1" className="mb-2">
          {user.email}
        </Typography>
        <Typography variant="body1" className="mb-4">
          {user.bio}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default Profile;