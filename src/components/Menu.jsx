import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { Link, useNavigate } from 'react-router-dom';
import Logout from '@mui/icons-material/Logout';
import Tooltip from '@mui/material/Tooltip';
import Settings from '@mui/icons-material/Settings';
import { signOutUser } from '../components/config/firebase/firebasemethod';

export default function AccountMenu() {
    let navigate = useNavigate()

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    React.useEffect(() => {

    }, [])


    function userLogout() {
        signOutUser()
        console.log('user logout Succesfully');
        navigate('/login')
    }

    function addAnotherAccount() {
        navigate('/register')
    }

    function profilePage() {
        navigate('/profile')
    }
    function dashbordPage() {
        navigate('/dashbord')
    }

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
            <Typography sx={{ minWidth: 100 }}><Link to='/'>All Blogs</Link></Typography>
                <Tooltip title="Account settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <Avatar sx={{ width: 32, height: 32 }}><img
                            alt="hero"
                            src="https://spaces-wp.imgix.net/2016/06/coding-in-the-classroom.png?auto=compress,format&q=50"
                        /></Avatar>
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,'& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={profilePage}>
                    <Avatar /> Profile
                </MenuItem>
                <MenuItem onClick={dashbordPage}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Dashbord
                </MenuItem>
                <Divider />
                <MenuItem onClick={addAnotherAccount}>
                    <ListItemIcon>
                        <PersonAdd fontSize="small" />
                    </ListItemIcon>
                    Add another account
                </MenuItem>
                <MenuItem onClick={userLogout}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
}
