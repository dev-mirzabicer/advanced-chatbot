// src/components/Layout.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import { useContext, useState } from 'react';
import { StateContext, DispatchContext } from '../context/StateContext';
import { v4 as uuidv4 } from 'uuid';

const drawerWidth = 240;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { chats, activeChatId } = useContext(StateContext);
  const dispatch = useContext(DispatchContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNewChat = () => {
    const newChatId = uuidv4();
    dispatch({ type: 'CREATE_CHAT', payload: newChatId });
    dispatch({ type: 'SWITCH_CHAT', payload: newChatId });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Chat Sessions
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {Object.keys(chats).map((chatId) => (
          <ListItem key={chatId} disablePadding>
            <ListItemButton
              selected={chatId === activeChatId}
              onClick={() => dispatch({ type: 'SWITCH_CHAT', payload: chatId })}
            >
              <ListItemText primary={`Chat ${chatId.slice(0, 8)}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box textAlign="center" mt={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewChat}
        >
          New Chat
        </Button>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Advanced Chatbot System
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer for larger screens */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
