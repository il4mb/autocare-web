"use client"

import React from "react"
import Drawer from "@mui/material/Drawer"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Collapse from "@mui/material/Collapse"
import InboxIcon from '@mui/icons-material/Inbox'
import ListItemIcon from "@mui/material/ListItemIcon"
import { ExpandLess, ExpandMore } from "@mui/icons-material"

export default function SideNav() {
  const [openDict, setOpenDict] = React.useState(true)

  return (
    <Drawer variant="permanent" open sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' } }}>
      <List component="nav">
        <ListItemButton>
          <ListItemIcon>
            <InboxIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </ListItemButton>

        <ListItemButton onClick={() => setOpenDict((s) => !s)}>
          <ListItemText primary="Dictionary" />
          {openDict ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={openDict} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemText primary="Brand" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemText primary="Vehicle" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemText primary="Diagnostic Code" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Drawer>
  )
}
